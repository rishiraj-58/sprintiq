import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, workspaceMembers, profiles, taskAuditLogs, taskHistory } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    // Create aliases for profiles table to join twice
    const assigneeProfiles = alias(profiles, 'assignee_profiles');
    const creatorProfiles = alias(profiles, 'creator_profiles');
    
    const [taskWithDetails] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        storyPoints: tasks.storyPoints,
        projectId: tasks.projectId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        dueDate: tasks.dueDate,
        workspaceId: projects.workspaceId,
        assignee: {
          id: assigneeProfiles.id,
          firstName: assigneeProfiles.firstName,
          lastName: assigneeProfiles.lastName,
          email: assigneeProfiles.email,
          avatarUrl: assigneeProfiles.avatarUrl,
        },
        creator: {
          id: creatorProfiles.id,
          firstName: creatorProfiles.firstName,
          lastName: creatorProfiles.lastName,
          email: creatorProfiles.email,
          avatarUrl: creatorProfiles.avatarUrl,
        },
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assigneeProfiles, eq(tasks.assigneeId, assigneeProfiles.id)) // Assignee (optional)
      .leftJoin(creatorProfiles, eq(tasks.creatorId, creatorProfiles.id)) // Creator
      .where(eq(tasks.id, taskId));

    if (!taskWithDetails) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Check if user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, taskWithDetails.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, taskWithDetails.workspaceId);
    if (!capabilities.includes('view')) {
      return new NextResponse('Forbidden: You do not have permission to view tasks', { status: 403 });
    }

    return NextResponse.json(taskWithDetails);

  } catch (error) {
    console.error('API Error fetching task:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;
    const updates = await request.json();

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    // Get the task and its project
    const [task] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
        type: tasks.type,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        assigneeId: tasks.assigneeId,
        sprintId: tasks.sprintId,
        dueDate: tasks.dueDate,
        storyPoints: tasks.storyPoints,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Check if user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, task.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('edit')) {
      return new NextResponse('Forbidden: You do not have permission to edit tasks', { status: 403 });
    }

    // If assigning a user and task is currently todo, auto-move to in_progress unless status explicitly provided
    const computedUpdates: Record<string, any> = { ...updates };
    const assigningSomeone = Object.prototype.hasOwnProperty.call(updates, 'assigneeId') && (updates.assigneeId ?? null) !== null;
    if (assigningSomeone && task.status === 'todo' && !Object.prototype.hasOwnProperty.call(updates, 'status')) {
      computedUpdates.status = 'in_progress';
    }

    // Update the task
    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...(computedUpdates.title ? { title: computedUpdates.title } : {}),
        ...(computedUpdates.description !== undefined ? { description: computedUpdates.description } : {}),
        ...(computedUpdates.status ? { status: computedUpdates.status } : {}),
        ...(computedUpdates.priority ? { priority: computedUpdates.priority } : {}),
        ...(computedUpdates.type ? { type: computedUpdates.type } : {}),
        ...(computedUpdates.assigneeId !== undefined ? { assigneeId: computedUpdates.assigneeId || null } : {}),
        ...(computedUpdates.sprintId !== undefined ? { sprintId: computedUpdates.sprintId || null } : {}),
        ...(computedUpdates.dueDate !== undefined ? { dueDate: computedUpdates.dueDate ? new Date(computedUpdates.dueDate) : null } : {}),
        ...(computedUpdates.storyPoints !== undefined ? { storyPoints: typeof computedUpdates.storyPoints === 'number' ? computedUpdates.storyPoints : null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Log audit
    await db.insert(taskAuditLogs).values({
      taskId,
      actorId: profile.id,
      action: 'task_updated',
      details: JSON.stringify(computedUpdates),
    });

    // Log per-field history entries
    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const fields: Array<{ key: keyof typeof task; name: string; newVal: any }> = [
      { key: 'title', name: 'title', newVal: updatedTask.title },
      { key: 'description', name: 'description', newVal: updatedTask.description },
      { key: 'status', name: 'status', newVal: updatedTask.status },
      { key: 'priority', name: 'priority', newVal: updatedTask.priority },
      { key: 'type', name: 'type', newVal: updatedTask.type },
      { key: 'assigneeId', name: 'assignee', newVal: updatedTask.assigneeId },
      { key: 'sprintId', name: 'sprint', newVal: updatedTask.sprintId },
      { key: 'dueDate', name: 'dueDate', newVal: updatedTask.dueDate },
      { key: 'storyPoints', name: 'storyPoints', newVal: updatedTask.storyPoints },
    ];
    for (const f of fields) {
      // Only record if provided in updates payload (to avoid noisy null comparisons)
      if (Object.prototype.hasOwnProperty.call(computedUpdates, f.key)) {
        const oldVal = (task as any)[f.key];
        const newVal = f.newVal;
        const toStr = (v: any) => v === null || v === undefined ? '' : (v instanceof Date ? v.toISOString() : String(v));
        if (toStr(oldVal) !== toStr(newVal)) {
          changes.push({ field: f.name, oldValue: oldVal, newValue: newVal });
        }
      }
    }

    if (changes.length > 0) {
      await db.insert(taskHistory).values(
        changes.map((c) => ({
          taskId,
          userId: profile.id,
          field: c.field,
          oldValue: c.oldValue === null || c.oldValue === undefined ? null : typeof c.oldValue === 'string' ? c.oldValue : c.oldValue instanceof Date ? c.oldValue.toISOString() : String(c.oldValue),
          newValue: c.newValue === null || c.newValue === undefined ? null : typeof c.newValue === 'string' ? c.newValue : c.newValue instanceof Date ? c.newValue.toISOString() : String(c.newValue),
        }))
      );
    }

    return NextResponse.json(updatedTask);

  } catch (error) {
    console.error('API Error updating task:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    if (!taskId) {
      return new NextResponse('Task ID is required', { status: 400 });
    }

    // Get the task and its project
    const [task] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Check if user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, task.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('delete')) {
      return new NextResponse('Forbidden: You do not have permission to delete tasks', { status: 403 });
    }

    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return NextResponse.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('API Error deleting task:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}