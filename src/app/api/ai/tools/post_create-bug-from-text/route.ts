import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { generateAIResponse } from '@/lib/ai/client';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { projectId, text } = await request.json();
    if (!projectId || !text) {
      return NextResponse.json({ error: 'projectId and text are required' }, { status: 400 });
    }

    const prompt = `Analyze the following text and extract a title, a detailed description, and a priority. The priority must be one of: 'low', 'medium', 'high', 'urgent'. Respond ONLY with a single JSON object. For example: {"title": "...", "description": "...", "priority": "high"}. Text: "${text}"`;
    const llmResponse = await generateAIResponse({ messages: [{ role: 'user', content: prompt }] });
    let parsed: any;
    try {
      parsed = JSON.parse(llmResponse);
    } catch {
      return NextResponse.json({ error: 'LLM returned an invalid JSON structure' }, { status: 502 });
    }
    const title: string | undefined = typeof parsed?.title === 'string' ? parsed.title : undefined;
    const description: string | undefined = typeof parsed?.description === 'string' ? parsed.description : undefined;
    const priority: string | undefined = typeof parsed?.priority === 'string' ? parsed.priority : undefined;
    if (!title || !priority) {
      return NextResponse.json({ error: 'Parsed output missing title or priority' }, { status: 502 });
    }

    // Create bug using existing create-task AI tool
    const fHeaders = new Headers();
    fHeaders.set('Content-Type', 'application/json');
    const cookie = request.headers.get('cookie');
    if (cookie) fHeaders.set('cookie', cookie);
    const auth = request.headers.get('authorization');
    if (auth) fHeaders.set('authorization', auth);
    const res = await fetch(new URL('/api/ai/tools/create-task', request.url), {
      method: 'POST',
      headers: fHeaders,
      body: JSON.stringify({ projectId, title, details: description ?? null, priority, type: 'bug' }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error || 'Failed to create bug' }, { status: res.status });
    }
    return NextResponse.json({ success: true, message: 'Bug created from text', task: data?.task || data });
  } catch (e) {
    console.error('ai/tools/post_create-bug-from-text error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


