import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { ensureCoreSchema } from '@/db/maintenance';
import { notifications } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    const rows = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.recipientId, profile.id), eq(notifications.isRead, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(10);
    const count = rows.length;
    return NextResponse.json({ count, items: rows });
  } catch (e) {
    console.error('unread notifications error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


