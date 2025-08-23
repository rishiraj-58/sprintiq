import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';
import { db } from '@/db';
import { projects, workspaceMembers, sprints, tasks, taskHistory } from '@/db/schema';
import { and, desc, eq, count } from 'drizzle-orm';

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

async function seedReports(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    // Validate project and membership
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('create')) return new NextResponse('Forbidden', { status: 403 });

    // Create a few sprints around current date
    const today = new Date();
    const sprintDefs = [
      { name: 'Seed Sprint 1', startOffset: -42, endOffset: -28, status: 'completed' },
      { name: 'Seed Sprint 2', startOffset: -28, endOffset: -14, status: 'completed' },
      { name: 'Seed Sprint 3', startOffset: -14, endOffset: 0, status: 'active' },
    ];

    const createdSprints: Array<{ id: string; name: string; startDate: Date; endDate: Date }> = [];
    for (const def of sprintDefs) {
      const startDate = addDays(today, def.startOffset);
      const endDate = addDays(today, def.endOffset);
      const [s] = await db
        .insert(sprints)
        .values({
          projectId,
          name: def.name,
          description: 'Seeded sprint for reports demo',
          status: def.status,
          startDate,
          endDate,
        })
        .returning();
      createdSprints.push({ id: s.id, name: s.name, startDate, endDate });
    }

    // Create backlog tasks
    const backlogTasksToCreate = [
      { title: 'Seed Backlog Task A', storyPoints: 3 },
      { title: 'Seed Backlog Task B', storyPoints: 5 },
      { title: 'Seed Backlog Task C', storyPoints: 2 },
    ];
    const createdBacklogTasks: Array<{ id: string; createdAt: Date }> = [];
    
    // Get the next project_task_id for this project
    let nextProjectTaskId = 1;
    
    for (const t of backlogTasksToCreate) {
      const createdAt = addDays(today, -20);
      const [row] = await db
        .insert(tasks)
        .values({
          projectTaskId: nextProjectTaskId++,
          projectId,
          title: t.title,
          description: 'Seeded task (backlog) for reports demo',
          priority: 'medium',
          status: 'todo',
          creatorId: profile.id,
          assigneeId: profile.id,
          createdAt,
          storyPoints: t.storyPoints,
        })
        .returning();
      createdBacklogTasks.push({ id: row.id, createdAt });
    }

    // Create sprint tasks with a mix of completed/active and add status transitions for cycle time/CFD
    const createdTasks: Array<{ id: string; startedAt: Date; completedAt?: Date }> = [];
    for (const s of createdSprints) {
      // 6 tasks per sprint
      const points = [2, 3, 5, 8, 3, 5];
      for (let i = 0; i < points.length; i++) {
        const title = `Seed ${s.name} Task ${i + 1}`;
        const createdAt = addDays(s.startDate, Math.max(0, i - 1));
        const startedAt = addDays(createdAt, 1);
        const isCompleted = i % 2 === 0; // every other task completed
        const completedAt = isCompleted ? addDays(startedAt, 2 + (i % 3)) : undefined;
        const status = isCompleted ? 'done' : (i % 3 === 0 ? 'in_progress' : 'todo');

        const [taskRow] = await db
          .insert(tasks)
          .values({
            projectTaskId: nextProjectTaskId++,
            projectId,
            title,
            description: 'Seeded task for reports demo',
            priority: 'medium',
            status,
            creatorId: profile.id,
            assigneeId: profile.id,
            sprintId: s.id,
            storyPoints: points[i],
            createdAt,
            completedAt: completedAt ?? null,
          })
          .returning();

        // Status transitions: todo -> in_progress -> done (if completed)
        // First transition: to in_progress
        await db.insert(taskHistory).values({
          taskId: taskRow.id,
          userId: profile.id,
          field: 'status',
          oldValue: 'todo',
          newValue: 'in_progress',
          createdAt: startedAt,
        });
        if (completedAt) {
          await db.insert(taskHistory).values({
            taskId: taskRow.id,
            userId: profile.id,
            field: 'status',
            oldValue: 'in_progress',
            newValue: 'done',
            createdAt: completedAt,
          });
        }

        createdTasks.push({ id: taskRow.id, startedAt, completedAt });
      }
    }

    // A couple of tasks in current sprint that are active now for workload
    const [currentSprint] = createdSprints.sort((a, b) => (b.startDate.getTime() - a.startDate.getTime()));
    if (currentSprint) {
      for (let i = 0; i < 3; i++) {
        const createdAt = addDays(currentSprint.startDate, i);
        const startedAt = addDays(createdAt, 1);
        const [tRow] = await db
          .insert(tasks)
          .values({
            projectTaskId: nextProjectTaskId++,
            projectId,
            title: `Seed ${currentSprint.name} Active ${i + 1}`,
            description: 'Active seeded task',
            priority: 'high',
            status: 'in_progress',
            creatorId: profile.id,
            assigneeId: profile.id,
            sprintId: currentSprint.id,
            storyPoints: 5,
            createdAt,
          })
          .returning();
        await db.insert(taskHistory).values({
          taskId: tRow.id,
          userId: profile.id,
          field: 'status',
          oldValue: 'todo',
          newValue: 'in_progress',
          createdAt: startedAt,
        });
      }
    }

    // Return a summary
    const [{ count: sprintCount }] = await db
      .select({ count: count(sprints.id) })
      .from(sprints)
      .where(eq(sprints.projectId, projectId));
    const [{ count: taskCount }] = await db
      .select({ count: count(tasks.id) })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    return NextResponse.json({
      message: 'Reports seed completed',
      sprintsCreated: createdSprints.length,
      backlogCreated: createdBacklogTasks.length,
      tasksCreated: createdTasks.length + 3, // +active tasks
      totals: { sprints: sprintCount ?? null, tasks: taskCount ?? null },
    });
  } catch (e) {
    console.error('POST reports seed error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  ctx: { params: { projectId: string } }
) {
  return seedReports(request, ctx);
}

// Convenience for local/dev: allow GET to trigger the same seeding action.
export async function GET(
  request: Request,
  ctx: { params: { projectId: string } }
) {
  return seedReports(request, ctx);
}


