import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { aiMemory } from '@/db/schema';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';

async function ensureTableExists() {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS ai_memory (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar(255) NOT NULL,
      project_id uuid,
      key text NOT NULL,
      value jsonb NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    );`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_ai_memory_user_key_project ON ai_memory (user_id, key, project_id);`);
  } catch {}
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { key, value, projectId } = await request.json();
    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }
    if (value === undefined) {
      return NextResponse.json({ error: 'value is required' }, { status: 400 });
    }
    try { await ensureTableExists(); } catch {}
    const [row] = await db
      .insert(aiMemory)
      .values({ userId: user.id, projectId: projectId ?? null, key, value, createdAt: new Date() })
      .returning();
    return NextResponse.json({ success: true, memory: row });
  } catch (e) {
    console.error('memory POST error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const projectId = searchParams.get('projectId');
    if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 });

    try { await ensureTableExists(); } catch {}
    const where = projectId
      ? and(eq(aiMemory.userId, user.id), eq(aiMemory.key, key), eq(aiMemory.projectId, projectId))
      : and(eq(aiMemory.userId, user.id), eq(aiMemory.key, key), isNull(aiMemory.projectId));

    const rows = await db.select().from(aiMemory).where(where).orderBy(desc(aiMemory.createdAt)).limit(1);
    return NextResponse.json({ memory: rows[0] ?? null });
  } catch (e) {
    console.error('memory GET error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


