// File: src/app/api/ai/tools/search-tasks/route.ts

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, tasks, workspaceMembers } from '@/db/schema';
import { and, eq, ilike, inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const query: string = String(body.query || '').trim();
    const projectId: string | undefined = body.projectId;
    const limit = Math.min(10, Math.max(1, Number(body.limit) || 5));

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    let projectIds: string[] = [];

    if (projectId) {
      // If a project is specified, only search within it.
      projectIds = [projectId];
    } else {
      // If no project is specified, find all projects the user has access to.
      const rows = await db
        .select({ id: projects.id })
        .from(projects)
        .innerJoin(workspaceMembers, eq(projects.workspaceId, workspaceMembers.workspaceId))
        .where(eq(workspaceMembers.profileId, user.id));
      projectIds = rows.map((r) => r.id as string);
    }

    if (projectIds.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Use the `ilike` search to find all matching tasks
    const foundTasks = await db
      .select({ id: tasks.id, title: tasks.title, projectId: tasks.projectId })
      .from(tasks)
      .where(and(inArray(tasks.projectId, projectIds), ilike(tasks.title, `%${query}%`)))
      .limit(limit);

    // Return the list of tasks found
    return NextResponse.json({ tasks: foundTasks });
  } catch (e) {
    console.error('search-tasks error', e);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}