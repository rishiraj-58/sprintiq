import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { comments } from '@/db/schema';
import { PermissionManager } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, taskId, content } = body as any;

    if (!projectId || !taskId || !content) {
      return new Response('Missing projectId, taskId or content', { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('create')) {
      return new Response('Forbidden', { status: 403 });
    }

    const [c] = await db
      .insert(comments)
      .values({
        content: String(content),
        taskId,
        authorId: user.id,
      })
      .returning();

    return Response.json({ comment: c });
  } catch (e) {
    console.error('ai/tools/comment error', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}


