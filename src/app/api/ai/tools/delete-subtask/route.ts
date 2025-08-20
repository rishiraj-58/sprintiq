import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { taskId, taskTitle, projectId, subtaskId } = await request.json();
    if (!(taskId || taskTitle) || !subtaskId) {
      return NextResponse.json({ error: 'taskId|taskTitle and subtaskId are required' }, { status: 400 });
    }

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

    const headers = new Headers();
    const cookie = request.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const auth = request.headers.get('authorization');
    if (auth) headers.set('authorization', auth);
    const delRes = await fetch(new URL(`/api/tasks/${finalTaskId}/subtasks/${subtaskId}`, request.url), {
      method: 'DELETE',
      headers,
    });
    if (!delRes.ok) {
      const data = await delRes.json().catch(() => ({}));
      return NextResponse.json({ error: data?.error || 'Failed to delete subtask' }, { status: delRes.status });
    }
    return NextResponse.json({ success: true, message: 'Subtask deleted', subtaskId });
  } catch (e) {
    console.error('ai/tools/delete-subtask error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



