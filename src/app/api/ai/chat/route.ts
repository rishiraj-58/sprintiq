import { NextRequest } from 'next/server';
import { buildSystemMessage, generateAIResponse } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, tasks, bugs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getMCPProjectContext } from '@/lib/mcp/client';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { message, projectId, history = [] } = body as {
      message: string;
      projectId?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!message || typeof message !== 'string') {
      return new Response('Invalid message', { status: 400 });
    }

    // Lightweight project/task context for MCP-style grounding
    const context: Record<string, unknown> = { userId: user.id };
    // Try to enrich via MCP if configured
    const mcp = await getMCPProjectContext({ userId: user.id, projectId });
    if (mcp) context.mcp = mcp;
    if (projectId) {
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (project) {
        context.project = project;
        const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
        const projectBugs = await db.select().from(bugs).where(eq(bugs.projectId, projectId));
        context.tasks = projectTasks.slice(0, 20);
        context.bugs = projectBugs.slice(0, 20);
      }
    }

    const system = buildSystemMessage(context);
    const messages = [
      system,
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message } as const,
    ];

    const aiText = await generateAIResponse({ messages });

    // We now avoid auto-creating entities here. Clients should call AI tool endpoints to create items with permission checks.
    return Response.json({ response: aiText, created: null });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


