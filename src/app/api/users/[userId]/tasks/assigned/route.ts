import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const profile = await requireAuth();
    const { userId } = params;

    if (!userId) {
      return new NextResponse('userId is required', { status: 400 });
    }

    // Only allow fetching your own assigned tasks for now
    if (profile.id !== userId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const results = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        projectId: tasks.projectId,
        projectName: projects.name,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.assigneeId, userId)));

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/users/[userId]/tasks/assigned failed', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


