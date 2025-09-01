import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { projectId, projectName, title, description, severity, assigneeName, assigneeId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Resolve project by name if needed
    let finalProjectId: string | undefined = projectId;
    if (!finalProjectId && projectName) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) headers.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) headers.set('authorization', auth);
      
      const res = await fetch(new URL('/api/ai/tools/resolve-id', request.url), {
        method: 'POST',
        headers,
        body: JSON.stringify({ entity: 'project', name: projectName }),
      });
      const data = await res.json();
      if (res.ok && data?.best?.id) {
        finalProjectId = String(data.best.id);
      }
    }

    if (!finalProjectId) {
      return NextResponse.json({ error: 'projectId or projectName is required' }, { status: 400 });
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
        body: JSON.stringify({ name: assigneeName, context: { projectId: finalProjectId } }),
      });
      const data = await res.json();
      if (res.ok && data?.best?.id) {
        finalAssigneeId = String(data.best.id);
      }
    }

    // Get the next project bug ID
    const lastBug = await db
      .select()
      .from(bugs)
      .where(eq(bugs.projectId, finalProjectId))
      .orderBy(desc(bugs.projectBugId))
      .limit(1);

    const nextProjectBugId = lastBug.length > 0 ? lastBug[0].projectBugId + 1 : 1;

    const [created] = await db
      .insert(bugs)
      .values({
        projectBugId: nextProjectBugId,
        title: title.trim(),
        description: description?.trim() || null,
        status: 'open',
        severity: severity || 'medium',
        projectId: finalProjectId,
        reporterId: user.id,
        assigneeId: finalAssigneeId || null,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      message: 'Bug created successfully', 
      bug: created 
    });
  } catch (error) {
    console.error('Create bug error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}