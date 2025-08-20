import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { bugId, bugTitle, projectId } = await request.json();

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

    const [deleted] = await db
      .delete(bugs)
      .where(eq(bugs.id, finalBugId!))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Bug deleted successfully', 
      bug: deleted 
    });
  } catch (error) {
    console.error('Delete bug error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

