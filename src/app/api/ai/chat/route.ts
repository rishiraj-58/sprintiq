// File: sprintiq/src/app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildSystemMessage, generateAIResponse, type ChatMessage } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth';
import { getMCPProjectContext } from '@/lib/mcp/client';

function isValidRole(role: any): role is 'user' | 'assistant' | 'tool' | 'system' {
  return ['user', 'assistant', 'tool', 'system'].includes(role);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { message, projectId, history: rawHistory = [] } = body as {
      message: string;
      projectId?: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message || typeof message !== 'string') {
      return new Response('Invalid message', { status: 400 });
    }

    const history: ChatMessage[] = rawHistory.filter(
      (m): m is ChatMessage =>
        m && typeof m.role === 'string' && isValidRole(m.role) && typeof m.content === 'string'
    );

    const context: Record<string, unknown> = { userId: user.id };
    if (projectId) context.projectId = projectId;
    // Inject last viewed task memory
    try {
      const mHeaders = new Headers();
      const cookie = req.headers.get('cookie');
      if (cookie) mHeaders.set('cookie', cookie);
      const auth = req.headers.get('authorization');
      if (auth) mHeaders.set('authorization', auth);
      const memRes = await fetch(new URL(`/api/ai/tools/memory?key=last_viewed_task${projectId ? `&projectId=${projectId}` : ''}`, req.url), {
        method: 'GET',
        headers: mHeaders,
      });
      if (memRes.ok) {
        const { memory } = await memRes.json();
        if (memory?.value) context.lastViewedTask = memory.value;
      }
    } catch {}
    const mcp = await getMCPProjectContext({ userId: user.id, projectId });
    if (mcp) context.mcp = mcp;

    // --- Step 1: Classify Intent ---
    const clarificationSystemMsg = buildSystemMessage({}, 'clarify');
    const intentMessages = [clarificationSystemMsg, { role: 'user', content: message } as const];
    const intentResponse = await generateAIResponse({ messages: intentMessages, maxTokens: 50, temperature: 0 });

    let intent: 'read' | 'write' | 'answer' = 'answer';
    try {
      const parsedIntent = JSON.parse(intentResponse);
      if (['read', 'write', 'answer'].includes(parsedIntent.intent)) {
        intent = parsedIntent.intent;
      }
    } catch {
      // If parsing fails, default to a general answer
      intent = 'answer';
    }

    // --- Step 2: Generate Final Response based on Intent ---
    let finalResponse: string;

    if (intent === 'answer') {
      const answerSystemMsg: ChatMessage = { role: 'system', content: 'You are a helpful assistant. Answer the user\'s question.' };
      const answerMessages: ChatMessage[] = [answerSystemMsg, { role: 'user', content: message }];
      finalResponse = await generateAIResponse({ messages: answerMessages });
    } else {
        const executionSystemMsg = buildSystemMessage(context, intent);
        // This now uses the validated `history` array, which satisfies TypeScript
        const executionMessages: ChatMessage[] = [
            executionSystemMsg,
            ...history,
            { role: 'user', content: message },
        ];
        finalResponse = await generateAIResponse({ messages: executionMessages });
    }

    return NextResponse.json({ response: finalResponse });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}