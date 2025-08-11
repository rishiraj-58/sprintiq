import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, taskAuditLogs, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
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

    const logs = await db
      .select({
        id: taskAuditLogs.id,
        action: taskAuditLogs.action,
        details: taskAuditLogs.details,
        createdAt: taskAuditLogs.createdAt,
        actor: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(taskAuditLogs)
      .innerJoin(profiles, eq(taskAuditLogs.actorId, profiles.id))
      .where(eq(taskAuditLogs.taskId, taskId))
      .orderBy(desc(taskAuditLogs.createdAt));

    return NextResponse.json(logs);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


