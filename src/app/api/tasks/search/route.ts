import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, workspaceMembers } from '@/db/schema';
import { and, eq, ilike } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(request: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const q = searchParams.get('q') || '';
    if (!projectId) return new NextResponse('Project ID is required', { status: 400 });

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, project.workspaceId);
    if (!capabilities.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    const results = await db
      .select({ id: tasks.id, title: tasks.title, status: tasks.status })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), ilike(tasks.title, `%${q}%`)));

    return NextResponse.json(results);
  } catch (e) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


