// File: src/app/api/ai/tools/get-task-details/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const taskTitle = searchParams.get('taskTitle');
    const projectId = searchParams.get('projectId');

    if (!taskId && !taskTitle) {
      return NextResponse.json({ error: 'Either taskId or taskTitle is required' }, { status: 400 });
    }

    let finalTaskId = taskId;

    // If we only have a title, resolve it to an ID using resolve-id for robustness.
    if (!finalTaskId && taskTitle) {
      try {
        const res = await fetch(new URL('/api/ai/tools/resolve-id', request.url), {
          method: 'POST',
          headers: request.headers,
          body: JSON.stringify({ entity: 'task', name: taskTitle, context: { projectId } }),
        });
        const data = await res.json();
        if (!res.ok) {
          return NextResponse.json({ error: data?.error || 'Failed to resolve task by title' }, { status: res.status });
        }
        const best = data?.best;
        if (best?.id) {
          finalTaskId = String(best.id);
        } else {
          const candidates = Array.isArray(data?.candidates) ? data.candidates : [];
          const message = candidates.length > 1
            ? 'Multiple tasks found matching that title. Please be more specific.'
            : 'Task not found.';
          return NextResponse.json({ error: message }, { status: 404 });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Failed to resolve task title' }, { status: 500 });
      }
    }

    // Now, fetch the full details using the definitive ID.
    const taskDetailsReq = new Request(new URL(`/api/tasks/${finalTaskId}`, request.url), {
        headers: request.headers,
    });
    const taskDetailsRes = await fetch(taskDetailsReq);
    const taskData = await taskDetailsRes.json();

    if (!taskDetailsRes.ok) {
        return NextResponse.json({ error: taskData.error || 'Failed to fetch task details' }, { status: taskDetailsRes.status });
    }

    // Persist last viewed task memory
    try {
      const mHeaders = new Headers();
      mHeaders.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) mHeaders.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) mHeaders.set('authorization', auth);
      await fetch(new URL('/api/ai/tools/memory', request.url), {
        method: 'POST',
        headers: mHeaders,
        body: JSON.stringify({ key: 'last_viewed_task', value: { taskId: finalTaskId }, projectId }),
      });
    } catch {}

    return NextResponse.json(taskData);

  } catch (e: any) {
    console.error('get-task-details error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}