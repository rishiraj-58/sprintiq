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

export async function PATCH(req: NextRequest, { params }: { params: { projectId: string } }) {
  await requireAuth();
  const projectId = params.projectId;
  const data = await req.json();
  
  if (!data.id) {
    return Response.json({ error: 'Bug ID is required' }, { status: 400 });
  }

  const updateData: any = {};
  if (data.status !== undefined) updateData.status = data.status;
  if (data.severity !== undefined) updateData.severity = data.severity;
  if (data.assigneeId !== undefined) updateData.assigneeId = data.assigneeId;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  
  // Set resolvedAt timestamp if status is being changed to resolved
  if (data.status === 'resolved' || data.status === 'closed') {
    updateData.resolvedAt = new Date();
  } else if (data.status === 'open' || data.status === 'in-progress') {
    updateData.resolvedAt = null;
  }
  
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(bugs)
    .set(updateData)
    .where(eq(bugs.id, data.id))
    .returning();

  if (!updated) {
    return Response.json({ error: 'Bug not found' }, { status: 404 });
  }

  return Response.json(updated);
}


