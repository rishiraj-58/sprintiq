import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, taskSubtasks, projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string; subtaskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId, subtaskId } = params;
    const updates = await request.json();

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
    if (!capabilities.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    const [updated] = await db
      .update(taskSubtasks)
      .set({
        ...(updates.title ? { title: updates.title } : {}),
        ...(typeof updates.isCompleted === 'boolean' ? { isCompleted: updates.isCompleted } : {}),
        ...(updates.assigneeId !== undefined ? { assigneeId: updates.assigneeId || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(taskSubtasks.id, subtaskId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string; subtaskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId, subtaskId } = params;

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
    if (!capabilities.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    await db.delete(taskSubtasks).where(eq(taskSubtasks.id, subtaskId));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


