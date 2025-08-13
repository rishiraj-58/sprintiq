import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    let { taskId, taskTitle, projectId } = body as { taskId?: string; taskTitle?: string; projectId?: string };

    if (!taskId && !taskTitle) {
      return NextResponse.json({ error: 'taskId or taskTitle is required' }, { status: 400 });
    }

    // Resolve title to ID if needed
    if (!taskId && taskTitle) {
      const resolveReq = new Request(new URL('/api/ai/tools/resolve-id', request.url), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({ entity: 'task', name: taskTitle, context: { projectId } }),
      });
      const resolveRes = await fetch(resolveReq);
      const resolveData = await resolveRes.json();
      if (!resolveRes.ok) {
        return NextResponse.json({ error: resolveData?.error || 'Failed to resolve task title' }, { status: resolveRes.status });
      }
      // More permissive selection to match update flow behavior on partial titles
      const best = resolveData?.best;
      const candidates = Array.isArray(resolveData?.candidates) ? resolveData.candidates : [];
      const top = candidates[0];
      const second = candidates[1];
      const bestScore = Number(best?.score ?? top?.score ?? 0);
      const scoreGap = (Number(top?.score ?? 0) - Number(second?.score ?? 0)) || 0;
      if (best?.id && bestScore >= 0.2) {
        taskId = String(best.id);
      } else if (candidates.length === 1 && top?.id) {
        taskId = String(top.id);
      } else if (top?.id && bestScore >= 0.15 && scoreGap >= 0.05) {
        taskId = String(top.id);
      } else {
        const message = candidates?.length > 1
          ? 'Multiple tasks found matching that title. Please be more specific.'
          : 'Task not found.';
        return NextResponse.json({ error: message }, { status: 404 });
      }
    }

    // Perform the delete using the core tasks API (handles RBAC)
    const deleteReq = new Request(new URL(`/api/tasks/${taskId}`, request.url), {
      method: 'DELETE',
      headers: request.headers,
    });
    const deleteRes = await fetch(deleteReq);
    const deleteData = await deleteRes.json().catch(() => ({ message: 'Task deleted' }));
    if (!deleteRes.ok) {
      return NextResponse.json({ error: deleteData?.error || deleteData || 'Failed to delete task' }, { status: deleteRes.status });
    }

    return NextResponse.json({ success: true, message: `Task ${taskId} deleted successfully`, taskId });
  } catch (e) {
    console.error('ai/tools/delete-task error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


