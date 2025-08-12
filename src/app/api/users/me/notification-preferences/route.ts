import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { userNotificationPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const profile = await requireAuth();
    const [prefs] = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, profile.id));
    return NextResponse.json(
      prefs || { mention: true, taskAssigned: true, statusUpdate: false, commentAdded: true }
    );
  } catch (e) {
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const profile = await requireAuth();
    const body = await req.json();
    const values: any = {};
    if (typeof body.mention === 'boolean') values.mention = body.mention;
    if (typeof body.taskAssigned === 'boolean') values.taskAssigned = body.taskAssigned;
    if (typeof body.statusUpdate === 'boolean') values.statusUpdate = body.statusUpdate;
    if (typeof body.commentAdded === 'boolean') values.commentAdded = body.commentAdded;
    const [existing] = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, profile.id));
    if (existing) {
      await db.update(userNotificationPreferences).set(values).where(eq(userNotificationPreferences.userId, profile.id));
    } else {
      await db.insert(userNotificationPreferences).values({ userId: profile.id, ...values });
    }
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


