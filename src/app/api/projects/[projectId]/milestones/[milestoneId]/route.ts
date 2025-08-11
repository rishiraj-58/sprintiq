import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, milestones, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string; milestoneId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId, milestoneId } = params;
    const body = await request.json();

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    const [row] = await db
      .update(milestones)
      .set({
        ...(body.name ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(body.date !== undefined ? { dueDate: body.date ? new Date(body.date) : null } : {}),
      })
      .where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)))
      .returning();

    return NextResponse.json(row);
  } catch (e) {
    console.error('PATCH milestone error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string; milestoneId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId, milestoneId } = params;

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, project.workspaceId)));
    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const caps = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!caps.includes('delete')) return new NextResponse('Forbidden', { status: 403 });

    await db.delete(milestones).where(and(eq(milestones.id, milestoneId), eq(milestones.projectId, projectId)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE milestone error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


