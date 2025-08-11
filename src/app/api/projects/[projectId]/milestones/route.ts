import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, milestones, workspaceMembers } from '@/db/schema';
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
      .from(milestones)
      .where(eq(milestones.projectId, projectId));
    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET project milestones error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;
    const body = await request.json();

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('create')) return new NextResponse('Forbidden', { status: 403 });

    const [row] = await db
      .insert(milestones)
      .values({
        projectId,
        name: body.name,
        description: body.description,
        dueDate: body.date ? new Date(body.date) : null,
        status: body.status || 'planned',
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error('POST project milestones error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}



