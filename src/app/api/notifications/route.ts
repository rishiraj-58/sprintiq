import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { ensureCoreSchema } from '@/db/maintenance';
import { notifications } from '@/db/schema';
import { and, desc, eq, lte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const cursor = url.searchParams.get('cursor'); // createdAt cursor ISO
    const projectId = url.searchParams.get('projectId');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status'); // 'all' | 'unread' | 'read'

    const limit = Math.min(100, Math.max(1, Number(limitParam) || 20));
    const clauses: any[] = [eq(notifications.recipientId, profile.id)];
    if (cursor) clauses.push(lte(notifications.createdAt, new Date(cursor)));
    if (projectId) clauses.push(eq(notifications.projectId, projectId));
    if (type) clauses.push(eq(notifications.type, type));
    if (status === 'unread') clauses.push(eq(notifications.isRead, false));
    if (status === 'read') clauses.push(eq(notifications.isRead, true));

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...clauses))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
    return NextResponse.json(rows);
  } catch (e) {
    console.error('notifications list error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


