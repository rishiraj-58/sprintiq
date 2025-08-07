import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { bugs } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(_: NextRequest, { params }: { params: { projectId: string } }) {
  await requireAuth();
  const projectId = params.projectId;
  const rows = await db.select().from(bugs).where(eq(bugs.projectId, projectId));
  return Response.json(rows);
}

export async function POST(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await requireAuth();
  const projectId = params.projectId;
  const data = await req.json();
  const [created] = await db
    .insert(bugs)
    .values({
      title: data.title,
      description: data.description ?? null,
      status: data.status ?? 'open',
      severity: data.severity ?? 'medium',
      projectId,
      reporterId: user.id,
      assigneeId: data.assigneeId ?? null,
    })
    .returning();
  return Response.json(created, { status: 201 });
}


