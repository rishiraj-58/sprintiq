import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, workspaceMembers, projectMembers, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { taskId, assigneeId, projectId } = body as any;

    if (!taskId || !projectId) {
      return new Response('Missing taskId or projectId', { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('edit')) {
      return new Response('Forbidden', { status: 403 });
    }

    // Ensure assignee is a member of the project or workspace
    if (assigneeId) {
      // find the project's workspace
      const [proj] = await db
        .select({ workspaceId: projects.workspaceId })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (!proj) {
        return new Response('Project not found', { status: 404 });
      }

      const [projMember] = await db
        .select({ id: projectMembers.id })
        .from(projectMembers)
        .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.profileId, assigneeId)));

      if (!projMember) {
        const [wsMember] = await db
          .select({ id: workspaceMembers.id })
          .from(workspaceMembers)
          .where(and(eq(workspaceMembers.profileId, assigneeId), eq(workspaceMembers.workspaceId, proj.workspaceId)));
        if (!wsMember) {
          return new Response('Assignee must be a member of the project or workspace', { status: 400 });
        }
      }
    }

    const [t] = await db
      .update(tasks)
      .set({ assigneeId: assigneeId ?? null })
      .where(eq(tasks.id, taskId))
      .returning();

    return Response.json({ task: t });
  } catch (e) {
    console.error('ai/tools/assign-task error', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}


