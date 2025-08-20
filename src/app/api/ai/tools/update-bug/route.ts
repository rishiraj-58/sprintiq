import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs } from '@/db/schema';
import { and, eq, ilike } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { bugId, bugTitle, projectId, status, severity, assigneeName, assigneeId } = await request.json();

    if (!bugId && !bugTitle) {
      return NextResponse.json({ error: 'bugId or bugTitle is required' }, { status: 400 });
    }

    // Resolve bug by title if needed
    let finalBugId: string | undefined = bugId;
    if (!finalBugId && bugTitle) {
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      const cookie = request.headers.get('cookie');
      if (cookie) headers.set('cookie', cookie);
      const auth = request.headers.get('authorization');
      if (auth) headers.set('authorization', auth);
      
      const res = await fetch(new URL('/api/ai/tools/resolve-id', request.url), {
        method: 'POST',
        headers,
        body: JSON.stringify({ entity: 'bug', name: bugTitle, context: { projectId } }),
      });
      const data = await res.json();
      if (!res.ok || !data?.best?.id) {
        return NextResponse.json({ error: data?.error || 'Failed to resolve bug by title' }, { status: res.status || 404 });
      }
      finalBugId = String(data.best.id);
    }

    // Resolve assignee by name if provided
    let finalAssigneeId: string | undefined | null = assigneeId;
    if (assigneeName !== undefined) {
      if (assigneeName && !assigneeId) {
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
        if (res.ok && data?.best?.id) {
          finalAssigneeId = String(data.best.id);
        }
      } else if (!assigneeName) {
        finalAssigneeId = null; // Explicitly unassign
      }
    }

    // Build update object
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (severity !== undefined) updateData.severity = severity;
    if (finalAssigneeId !== undefined) updateData.assigneeId = finalAssigneeId;
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
    }
    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(bugs)
      .set(updateData)
      .where(eq(bugs.id, finalBugId!))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Bug updated successfully', 
      bug: updated 
    });
  } catch (error) {
    console.error('Update bug error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

