import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { ensureCoreSchema } from '@/db/maintenance';
import { notifications } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST() {
  try {
    await ensureCoreSchema();
    const profile = await requireAuth();
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.recipientId, profile.id), eq(notifications.isRead, false)));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('mark all read error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


