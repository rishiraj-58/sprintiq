import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, taskSubtasks, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    const [task] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));

    if (!task) return new NextResponse('Task not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, task.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    const items = await db
      .select({
        id: taskSubtasks.id,
        title: taskSubtasks.title,
        isCompleted: taskSubtasks.isCompleted,
        assignee: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(taskSubtasks)
      .leftJoin(profiles, eq(taskSubtasks.assigneeId, profiles.id))
      .where(eq(taskSubtasks.taskId, taskId));

    return NextResponse.json(items);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;
    const { title, assigneeId } = await request.json();
    if (!title || !title.trim()) return new NextResponse('Title required', { status: 400 });

    const [task] = await db
      .select({ 
        workspaceId: projects.workspaceId,
        taskAssigneeId: tasks.assigneeId,
        projectOwnerId: projects.ownerId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));
    if (!task) return new NextResponse('Task not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, task.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    // Determine default assignee: prefer parent task's assignee, else project's owner, unless explicitly provided
    const defaultAssignee = assigneeId ?? task.taskAssigneeId ?? task.projectOwnerId ?? null;

    const [created] = await db
      .insert(taskSubtasks)
      .values({ taskId, title: title.trim(), assigneeId: defaultAssignee })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


