import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { taskId, taskTitle, projectId, title, assigneeName, assigneeId } = await request.json();
    if (!title || !(taskId || taskTitle)) {
      return NextResponse.json({ error: 'title and taskId|taskTitle are required' }, { status: 400 });
    }

    // Resolve main task by title within project if needed
    let finalTaskId: string | undefined = taskId;
    if (!finalTaskId && taskTitle) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) headers.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) headers.set('authorization', auth);
      const res = await fetch(new URL('/api/ai/tools/resolve-id', request.url), {
        method: 'POST',
        headers,
        body: JSON.stringify({ entity: 'task', name: taskTitle, context: { projectId } }),
      });
      const data = await res.json();
      if (!res.ok || !data?.best?.id) {
        return NextResponse.json({ error: data?.error || 'Failed to resolve main task by title' }, { status: res.status || 404 });
      }
      finalTaskId = String(data.best.id);
    }

    // Resolve assignee by name if provided
    let finalAssigneeId: string | undefined = assigneeId;
    if (!finalAssigneeId && assigneeName) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) headers.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) headers.set('authorization', auth);
      const res = await fetch(new URL('/api/ai/tools/resolve-user', request.url), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: assigneeName, context: { projectId } }),
      });
      if (res.ok) {
        try {
          const data = await res.json();
          if (data?.best?.id) finalAssigneeId = String(data.best.id);
        } catch (e) {
          console.warn('Failed to parse resolve-user response:', e);
        }
      }
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const auth = request.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    const createRes = await fetch(new URL(`/api/tasks/${finalTaskId}/subtasks`, request.url), {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, assigneeId: finalAssigneeId ?? undefined }),
    });
    const created = await createRes.json().catch(() => ({}));
    if (!createRes.ok) return NextResponse.json({ error: created?.error || 'Failed to create subtask' }, { status: createRes.status });
    return NextResponse.json({ success: true, message: 'Subtask created', subtask: created });
  } catch (e) {
    console.error('ai/tools/create-subtask error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


