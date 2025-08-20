import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { taskId, taskTitle, projectId, subtaskId, title, isCompleted, assigneeName, assigneeId } = await request.json();
    if (!(taskId || taskTitle) || !subtaskId) {
      return NextResponse.json({ error: 'taskId|taskTitle and subtaskId are required' }, { status: 400 });
    }

    // Resolve main task if necessary
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
      if (!res.ok || !data?.best?.id) return NextResponse.json({ error: data?.error || 'Failed to resolve task' }, { status: res.status || 404 });
      finalTaskId = String(data.best.id);
    }

    // Resolve assignee by name if needed
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
      const data = await res.json();
      if (res.ok && data?.best?.id) finalAssigneeId = String(data.best.id);
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const auth = request.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    const res = await fetch(new URL(`/api/tasks/${finalTaskId}/subtasks/${subtaskId}`, request.url), {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title, isCompleted, assigneeId: finalAssigneeId }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error || 'Failed to update subtask' }, { status: res.status });
    return NextResponse.json({ success: true, message: 'Subtask updated', subtask: data });
  } catch (e) {
    console.error('ai/tools/update-subtask error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



