import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PermissionManager } from '@/lib/permissions';
import { db } from '@/db';
import {
  tasks,
  projects,
  workspaceMembers,
  projectMembers,
  taskAuditLogs,
  taskHistory,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';

type UpdateTaskPayload = {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string | null;
  sprintId?: string | null;
  dueDate?: string | null; // ISO8601 or null
  storyPoints?: number | null;
};

function isUuidLike(value: unknown): value is string {
  return typeof value === 'string' && value.length >= 8; // lightweight guard
}

function parsePayload(body: any): UpdateTaskPayload {
  if (!body || typeof body !== 'object') throw new Error('Invalid JSON');
  const { taskId } = body;
  if (!isUuidLike(taskId)) throw new Error('taskId is required');

  const payload: UpdateTaskPayload = { taskId };
  if (typeof body.title === 'string') payload.title = body.title;
  if (body.description === null || typeof body.description === 'string') payload.description = body.description ?? undefined;
  if (typeof body.status === 'string') payload.status = body.status;
  if (typeof body.priority === 'string') payload.priority = body.priority;
  if (typeof body.type === 'string') payload.type = body.type;
  if (Object.prototype.hasOwnProperty.call(body, 'assigneeId')) {
    if (body.assigneeId === null || typeof body.assigneeId === 'string') payload.assigneeId = body.assigneeId;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'sprintId')) {
    if (body.sprintId === null || typeof body.sprintId === 'string') payload.sprintId = body.sprintId;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'dueDate')) {
    if (body.dueDate === null || typeof body.dueDate === 'string') payload.dueDate = body.dueDate;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'storyPoints')) {
    if (body.storyPoints === null || typeof body.storyPoints === 'number') payload.storyPoints = body.storyPoints;
  }
  return payload;
}

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();
    const validated = parsePayload(body);

    // Load task and its project/workspace context
    const [taskRow] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        type: tasks.type,
        assigneeId: tasks.assigneeId,
        sprintId: tasks.sprintId,
        dueDate: tasks.dueDate,
        storyPoints: tasks.storyPoints,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, validated.taskId));

    if (!taskRow) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Must belong to workspace and have edit rights (mirror existing PATCH route policy)
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, taskRow.workspaceId)));
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const caps = await PermissionManager.getUserCapabilities(profile.id, taskRow.workspaceId);
    if (!caps.includes('edit')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If assigning someone, ensure the new assignee is a valid project or workspace member
    if (Object.prototype.hasOwnProperty.call(validated, 'assigneeId')) {
      const newAssignee = validated.assigneeId ?? null;
      if (newAssignee) {
        // First check project membership
        const [projMember] = await db
          .select({ id: projectMembers.id })
          .from(projectMembers)
          .where(and(eq(projectMembers.projectId, taskRow.projectId), eq(projectMembers.profileId, newAssignee)));
        if (!projMember) {
          const [wsMember] = await db
            .select({ id: workspaceMembers.id })
            .from(workspaceMembers)
            .where(and(eq(workspaceMembers.profileId, newAssignee), eq(workspaceMembers.workspaceId, taskRow.workspaceId)));
          if (!wsMember) {
            return NextResponse.json({ error: 'Assignee must be a member of the project or workspace' }, { status: 400 });
          }
        }
      }
    }

    // Compute updates, mirroring the auto-transition rule from core PATCH handler
    const computedUpdates: Record<string, any> = { ...validated };
    delete computedUpdates.taskId;
    const assigningSomeone = Object.prototype.hasOwnProperty.call(validated, 'assigneeId') && (validated.assigneeId ?? null) !== null;
    if (assigningSomeone && (taskRow.status as unknown as string) === 'todo' && !Object.prototype.hasOwnProperty.call(validated, 'status')) {
      computedUpdates.status = 'in_progress';
    }

    // Build final update set with proper null handling and type conversions
    const updateSet: Record<string, any> = {
      ...(computedUpdates.title ? { title: computedUpdates.title } : {}),
      ...(Object.prototype.hasOwnProperty.call(computedUpdates, 'description') ? { description: computedUpdates.description } : {}),
      ...(computedUpdates.status ? { status: computedUpdates.status } : {}),
      ...(computedUpdates.priority ? { priority: computedUpdates.priority } : {}),
      ...(computedUpdates.type ? { type: computedUpdates.type } : {}),
      ...(Object.prototype.hasOwnProperty.call(computedUpdates, 'assigneeId') ? { assigneeId: computedUpdates.assigneeId || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(computedUpdates, 'sprintId') ? { sprintId: computedUpdates.sprintId || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(computedUpdates, 'dueDate') ? { dueDate: computedUpdates.dueDate ? new Date(computedUpdates.dueDate) : null } : {}),
      ...(Object.prototype.hasOwnProperty.call(computedUpdates, 'storyPoints') ? { storyPoints: typeof computedUpdates.storyPoints === 'number' ? computedUpdates.storyPoints : null } : {}),
      updatedAt: new Date(),
    };

    // Short-circuit if no fields to update were provided
    const hasFieldsToUpdate = Object.keys(updateSet).some((k) => k !== 'updatedAt');
    if (!hasFieldsToUpdate) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const [updated] = await db
      .update(tasks)
      .set(updateSet)
      .where(eq(tasks.id, taskRow.id))
      .returning();

    // Audit + history logging (subset mirroring core route)
    if (hasFieldsToUpdate) {
      await db.insert(taskAuditLogs).values({
        taskId: taskRow.id,
        actorId: profile.id,
        action: 'task_updated',
        details: JSON.stringify(updateSet),
      });
    }

    const changes: Array<{ field: string; oldValue: any; newValue: any }> = [];
    const fields: Array<{ key: keyof typeof taskRow; name: string; newVal: any }> = [
      { key: 'title', name: 'title', newVal: updated.title },
      { key: 'description', name: 'description', newVal: updated.description },
      { key: 'status', name: 'status', newVal: updated.status },
      { key: 'priority', name: 'priority', newVal: updated.priority },
      { key: 'type', name: 'type', newVal: updated.type },
      { key: 'assigneeId', name: 'assignee', newVal: updated.assigneeId },
      { key: 'sprintId', name: 'sprint', newVal: updated.sprintId },
      { key: 'dueDate', name: 'dueDate', newVal: updated.dueDate },
      { key: 'storyPoints', name: 'storyPoints', newVal: updated.storyPoints },
    ];
    for (const f of fields) {
      if (Object.prototype.hasOwnProperty.call(computedUpdates, f.key)) {
        const oldVal = (taskRow as any)[f.key];
        const newVal = f.newVal;
        const toStr = (v: any) => (v === null || v === undefined ? '' : v instanceof Date ? v.toISOString() : String(v));
        if (toStr(oldVal) !== toStr(newVal)) {
          changes.push({ field: f.name, oldValue: oldVal, newValue: newVal });
        }
      }
    }

    if (changes.length > 0) {
      await db.insert(taskHistory).values(
        changes.map((c) => ({
          taskId: taskRow.id,
          userId: profile.id,
          field: c.field,
          oldValue:
            c.oldValue === null || c.oldValue === undefined
              ? null
              : typeof c.oldValue === 'string'
              ? c.oldValue
              : c.oldValue instanceof Date
              ? c.oldValue.toISOString()
              : String(c.oldValue),
          newValue:
            c.newValue === null || c.newValue === undefined
              ? null
              : typeof c.newValue === 'string'
              ? c.newValue
              : c.newValue instanceof Date
              ? c.newValue.toISOString()
              : String(c.newValue),
        }))
      );
    }

    if (changes.length === 0) {
      return NextResponse.json({ error: 'No actual changes applied' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Task ${updated.id} updated successfully`,
      task: {
        id: updated.id,
        title: updated.title,
        status: updated.status,
        priority: updated.priority,
        assigneeId: updated.assigneeId,
      },
    });
  } catch (e: any) {
    if (e?.message === 'taskId is required' || e?.message === 'Invalid JSON') {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('ai/tools/update-task error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


