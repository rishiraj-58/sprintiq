// File: src/app/api/ai/tools/search-tasks/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, tasks, workspaceMembers } from '@/db/schema';
import { and, eq, ilike, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const projectId = searchParams.get('projectId');
    const limit = Math.min(10, Number(searchParams.get('limit') || 5));

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    let projectIds: string[] = [];
    if (projectId) {
      projectIds = [projectId];
    } else {
      const rows = await db
        .select({ id: projects.id })
        .from(projects)
        .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.profileId, user.id));
      projectIds = rows.map((r) => r.id);
    }

    if (projectIds.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    const foundTasks = await db
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId })
      .from(tasks)
      .where(and(inArray(tasks.projectId, projectIds), ilike(tasks.title, `%${query}%`)))
      .limit(limit);

    return NextResponse.json({ tasks: foundTasks });
  } catch (e) {
    console.error('search-tasks GET error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}