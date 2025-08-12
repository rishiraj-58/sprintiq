import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { ensureCoreSchema } from '@/db/maintenance';
import { projects, workspaceMembers, tasks, projectMembers, profiles } from '@/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { workspaceId: string } }) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const { workspaceId } = params;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Must be a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.profileId, profile.id)));

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch projects in workspace
    const projectRows = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));

    if (projectRows.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = projectRows.map(p => p.id);

    // Tasks aggregates per project
    // Use raw SQL for conditional aggregation for simplicity
    const tasksAgg = await db.execute(sql`
      select project_id, 
             count(*)::int as total_tasks,
             sum((lower(status) = 'done')::int)::int as tasks_completed,
             sum((lower(status) = 'blocked')::int)::int as tasks_blocked
      from tasks
      where project_id in (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})
      group by project_id
    `);
    const taskAggRows: Array<{ project_id: string; total_tasks: number; tasks_completed: number; tasks_blocked: number; }> = Array.isArray(tasksAgg) ? (tasksAgg as any) : (tasksAgg as any).rows;
    const projectIdToTaskAgg = new Map<string, { total: number; completed: number; blocked: number }>();
    for (const r of taskAggRows || []) {
      projectIdToTaskAgg.set(r.project_id, { total: Number(r.total_tasks || 0), completed: Number(r.tasks_completed || 0), blocked: Number(r.tasks_blocked || 0) });
    }

    // Team members per project (limit 3 display, count total)
    const pmRows = await db
      .select({ projectId: projectMembers.projectId, profileId: projectMembers.profileId, firstName: profiles.firstName, lastName: profiles.lastName, avatarUrl: profiles.avatarUrl })
      .from(projectMembers)
      .innerJoin(profiles, eq(projectMembers.profileId, profiles.id))
      .where(inArray(projectMembers.projectId, projectIds));
    const projectIdToMembers = new Map<string, Array<{ id: string; name: string; avatar: string | null }>>();
    for (const row of pmRows) {
      const list = projectIdToMembers.get(row.projectId) || [];
      list.push({ id: row.profileId, name: `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Member', avatar: row.avatarUrl || null });
      projectIdToMembers.set(row.projectId, list);
    }

    // Build enriched results
    const enriched = projectRows.map(p => {
      const agg = projectIdToTaskAgg.get(p.id) || { total: 0, completed: 0, blocked: 0 };
      const progress = agg.total > 0 ? Math.round((agg.completed / agg.total) * 100) : 0;
      const members = projectIdToMembers.get(p.id) || [];

      // Health rules
      const now = new Date();
      const target = p.targetEndDate as unknown as Date | null;
      let health: 'on-track' | 'at-risk' | 'delayed' = 'on-track';
      if (target && target < now && progress < 100) health = 'delayed';
      else if ((target && (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7 && progress < 80) || agg.blocked > 0) health = 'at-risk';

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        status: p.status,
        progress,
        health,
        tasksCompleted: agg.completed,
        totalTasks: agg.total,
        teamMembers: members.slice(0, 3).map(m => ({ id: m.id, name: m.name, avatar: m.avatar })),
        teamCount: members.length,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('workspace projects report error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


