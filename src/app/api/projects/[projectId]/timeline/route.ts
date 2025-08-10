import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, sprints, tasks, workspaceMembers, milestones, releases, calendarEvents, projectPhases, capacityWindows, policies } from '@/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const assigneeId = searchParams.get('assigneeId');

    // validate project
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    // user must belong to workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    // project content requires project membership caps.view (no workspace fallback for content)
    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    // build sprint filters
    const sprintWhere = [eq(sprints.projectId, projectId)];
    if (from) sprintWhere.push(gte(sprints.endDate, new Date(from)));
    if (to) sprintWhere.push(lte(sprints.startDate, new Date(to)));

    const sprintRows = await db
      .select({ id: sprints.id, name: sprints.name, status: sprints.status, startDate: sprints.startDate, endDate: sprints.endDate })
      .from(sprints)
      .where(and(...sprintWhere));

    // build task filters
    const taskWhere = [eq(tasks.projectId, projectId)];
    if (status) taskWhere.push(eq(tasks.status, status));
    if (type) taskWhere.push(eq(tasks.type, type));
    if (assigneeId) taskWhere.push(eq(tasks.assigneeId, assigneeId));
    if (from) taskWhere.push(gte(tasks.dueDate, new Date(from)));
    if (to) taskWhere.push(lte(tasks.dueDate, new Date(to)));

    const taskRows = await db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status, type: tasks.type, sprintId: tasks.sprintId, dueDate: tasks.dueDate, storyPoints: tasks.storyPoints })
      .from(tasks)
      .where(and(...taskWhere));

    // milestones
    const milestoneRows = await db
      .select({ id: milestones.id, name: milestones.name, dueDate: milestones.dueDate, status: milestones.status })
      .from(milestones)
      .where(eq(milestones.projectId, projectId));

    // releases
    const releaseRows = await db
      .select({ id: releases.id, name: releases.name, date: releases.date, notes: releases.notes })
      .from(releases)
      .where(eq(releases.projectId, projectId));

    // overlays & events
    const events = await db
      .select({ id: calendarEvents.id, name: calendarEvents.name, date: calendarEvents.date, kind: calendarEvents.kind, notes: calendarEvents.notes })
      .from(calendarEvents)
      .where(eq(calendarEvents.projectId, projectId));

    const phases = await db
      .select({ id: projectPhases.id, name: projectPhases.name, startDate: projectPhases.startDate, endDate: projectPhases.endDate, sortOrder: projectPhases.sortOrder })
      .from(projectPhases)
      .where(eq(projectPhases.projectId, projectId));

    const capacity = await db
      .select({ id: capacityWindows.id, name: capacityWindows.name, startDate: capacityWindows.startDate, endDate: capacityWindows.endDate, kind: capacityWindows.kind })
      .from(capacityWindows)
      .where(eq(capacityWindows.projectId, projectId));

    const policy = await db
      .select({ id: policies.id, name: policies.name, startDate: policies.startDate, endDate: policies.endDate, kind: policies.kind })
      .from(policies)
      .where(eq(policies.projectId, projectId));

    return NextResponse.json({
      sprints: sprintRows,
      tasks: taskRows,
      milestones: milestoneRows,
      releases: releaseRows,
      events,
      phases,
      capacity,
      policies: policy,
      now: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Timeline GET failed', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

