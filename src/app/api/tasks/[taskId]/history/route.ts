import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, taskAuditLogs, projects, workspaceMembers, profiles, taskHistory } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
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

    // Prefer taskHistory for user-friendly per-field changes; fall back to audit logs if needed
    const oldProfile = alias(profiles, 'old_profile');
    const newProfile = alias(profiles, 'new_profile');

    const history = await db
      .select({
        id: taskHistory.id,
        field: taskHistory.field,
        oldValue: taskHistory.oldValue,
        newValue: taskHistory.newValue,
        oldAssignee: {
          id: oldProfile.id,
          firstName: oldProfile.firstName,
          lastName: oldProfile.lastName,
        },
        newAssignee: {
          id: newProfile.id,
          firstName: newProfile.firstName,
          lastName: newProfile.lastName,
        },
        createdAt: taskHistory.createdAt,
        actor: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(taskHistory)
      .innerJoin(profiles, eq(taskHistory.userId, profiles.id))
      .leftJoin(oldProfile, eq(oldProfile.id, taskHistory.oldValue as any))
      .leftJoin(newProfile, eq(newProfile.id, taskHistory.newValue as any))
      .where(eq(taskHistory.taskId, taskId))
      .orderBy(desc(taskHistory.createdAt));

    return NextResponse.json(history);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


