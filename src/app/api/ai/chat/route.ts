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

    // Optional: When AI outputs JSON with type task/bug, create it
    // Expect a code-fenced JSON block; attempt to extract
    const jsonMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/);
    let created: any = null;
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed?.type === 'task' && projectId) {
          const [t] = await db
            .insert(tasks)
            .values({
              title: parsed.title?.slice(0, 200) || 'AI Task',
              description: parsed.details ?? null,
              status: parsed.status ?? 'todo',
              priority: parsed.priority ?? 'medium',
              projectId,
              assigneeId: parsed.assigneeId ?? null,
              creatorId: user.id,
            })
            .returning();
          created = { kind: 'task', item: t };
        } else if (parsed?.type === 'bug' && projectId) {
          const [b] = await db
            .insert(bugs)
            .values({
              title: parsed.title?.slice(0, 200) || 'AI Bug',
              description: parsed.details ?? null,
              status: parsed.status ?? 'open',
              severity: parsed.severity ?? 'medium',
              projectId,
              reporterId: user.id,
              assigneeId: parsed.assigneeId ?? null,
            })
            .returning();
          created = { kind: 'bug', item: b };
        }
      } catch {}
    }

    return Response.json({ response: aiText, created });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


