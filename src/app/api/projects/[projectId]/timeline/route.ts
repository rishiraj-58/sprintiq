import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, sprints } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    const projectTasks = await db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status, dueDate: tasks.dueDate })
      .from(tasks)
      .where(eq(tasks.projectId, projectId));

    const projectSprints = await db
      .select({ id: sprints.id, name: sprints.name, startDate: sprints.startDate, endDate: sprints.endDate, status: sprints.status })
      .from(sprints)
      .where(eq(sprints.projectId, projectId));

    return NextResponse.json({ tasks: projectTasks, sprints: projectSprints });
  } catch (e) {
    console.error('timeline error', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


