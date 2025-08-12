import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, workspaceMembers } from '@/db/schema';
import { and, eq, ilike } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    let { projectId, projectName, title, details, priority = 'medium', status = 'todo', assigneeId } = body as any;

    if (!projectId) {
      // Resolve by name across workspaces the user belongs to
      if (typeof projectName === 'string' && projectName.trim().length > 0) {
        const nameQuery = projectName.trim();
        // Join projects with workspaceMembers to ensure visibility
        const rows = await db
          .select({ id: projects.id, name: projects.name })
          .from(projects)
          .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
          .where(and(eq(workspaceMembers.profileId, user.id), ilike(projects.name, `%${nameQuery}%`)));
        if (rows.length === 1) {
          projectId = rows[0].id;
        } else if (rows.length > 1) {
          return new Response('Ambiguous projectName. Please specify a more exact name or projectId.', { status: 400 });
        } else {
          return new Response('Project not found for given projectName', { status: 404 });
        }
      }
    }

    if (!projectId || !title) {
      return new Response('Missing projectId or title', { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('create')) {
      return new Response('Forbidden', { status: 403 });
    }

    const [t] = await db
      .insert(tasks)
      .values({
        title: String(title).slice(0, 200),
        description: details ?? null,
        status,
        priority,
        projectId,
        assigneeId: assigneeId ?? null,
        creatorId: user.id,
      })
      .returning();

    return Response.json({ task: t });
  } catch (e) {
    console.error('ai/tools/create-task error', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}


