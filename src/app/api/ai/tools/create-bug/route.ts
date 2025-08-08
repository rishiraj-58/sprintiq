import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs } from '@/db/schema';
import { PermissionManager } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, title, details, severity = 'medium', status = 'open', assigneeId } = body as any;

    if (!projectId || !title) {
      return new Response('Missing projectId or title', { status: 400 });
    }

    const caps = await PermissionManager.getUserCapabilities(user.id, projectId, 'project');
    if (!caps.includes('create')) {
      return new Response('Forbidden', { status: 403 });
    }

    const [b] = await db
      .insert(bugs)
      .values({
        title: String(title).slice(0, 200),
        description: details ?? null,
        status,
        severity,
        projectId,
        reporterId: user.id,
        assigneeId: assigneeId ?? null,
      })
      .returning();

    return Response.json({ bug: b });
  } catch (e) {
    console.error('ai/tools/create-bug error', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}


