import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai/client';

function extractJsonBlock(text: string): string | null {
  if (!text) return null;
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fence && fence[1]) return fence[1].trim();
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    return text.slice(first, last + 1);
  }
  return null;
}

function extractBulletedSubtasks(text: string): string[] {
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*\d+\.]/.test(l))
    .map((l) => l.replace(/^[-*\d+\.]+\s*/, ''))
    .filter((s) => s.length > 0)
    .slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { projectId, title } = await request.json();
    if (!projectId || !title) {
      return NextResponse.json({ error: 'projectId and title are required' }, { status: 400 });
    }

    const prompt = `Break down the following high-level task into 6-10 smaller technical sub-tasks for a software team.
Respond ONLY with a JSON object containing a "subtasks" array of strings. Do not include any explanations or code fences.
Example: {"subtasks": ["Create DB schema", "Build API endpoint", "Design UI component"]}.
Task: "${title}"`;

    const llmResponse = await generateAIResponse({ messages: [{ role: 'user', content: prompt }] });
    let subtasks: string[] = [];
    // Try direct JSON
    try {
      const parsed = JSON.parse(llmResponse);
      const raw = parsed?.subtasks;
      if (Array.isArray(raw)) {
        subtasks = raw.map((s: any) => (typeof s === 'string' ? s : typeof s?.title === 'string' ? s.title : '')).filter((s: string) => s.trim().length > 0);
      }
    } catch {}
    // Try code fence / JSON substring
    if (subtasks.length === 0) {
      const block = extractJsonBlock(llmResponse);
      if (block) {
        try {
          const parsed2 = JSON.parse(block);
          const raw2 = parsed2?.subtasks;
          if (Array.isArray(raw2)) {
            subtasks = raw2.map((s: any) => (typeof s === 'string' ? s : typeof s?.title === 'string' ? s.title : '')).filter((s: string) => s.trim().length > 0);
          }
        } catch {}
      }
    }
    // Try bullets fallback
    if (subtasks.length === 0) {
      subtasks = extractBulletedSubtasks(llmResponse);
    }
    // Normalize and limit
    subtasks = Array.from(new Set(subtasks.map((s) => s.trim()))).slice(0, 10);
    if (subtasks.length === 0) {
      return NextResponse.json({ error: 'No subtasks found in LLM output' }, { status: 502 });
    }

    // Create each subtask via existing create-task AI tool to reuse RBAC and validations
    const created: Array<{ id: string; title: string }> = [];
    const failed: Array<{ title: string; error: string }> = [];
    for (const subTitle of subtasks) {
      const fHeaders = new Headers();
      fHeaders.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) fHeaders.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) fHeaders.set('authorization', auth);
      const res = await fetch(new URL('/api/ai/tools/create-task', request.url), {
        method: 'POST',
        headers: fHeaders,
        body: JSON.stringify({ projectId, title: subTitle }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.task?.id) {
        created.push({ id: data.task.id, title: data.task.title });
      } else {
        failed.push({ title: subTitle, error: data?.error || 'create-task failed' });
      }
    }

    return NextResponse.json({ success: true, message: `Task broken down into ${created.length} sub-tasks.`, created, failed });
  } catch (e) {
    console.error('ai/tools/post_breakdown-task error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


