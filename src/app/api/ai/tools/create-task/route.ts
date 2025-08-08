import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { PermissionManager } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, title, details, priority = 'medium', status = 'todo', assigneeId } = body as any;

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


