import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, releases, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    const rows = await db
      .select()
      .from(releases)
      .where(eq(releases.projectId, projectId));

    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET project releases error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


