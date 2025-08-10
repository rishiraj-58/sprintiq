import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { milestones, projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const profile = await requireAuth();
    const { milestoneId } = params;

    if (!milestoneId) return new NextResponse('Milestone ID is required', { status: 400 });

    const [row] = await db
      .select({
        id: milestones.id,
        name: milestones.name,
        description: milestones.description,
        status: milestones.status,
        dueDate: milestones.dueDate,
        projectId: milestones.projectId,
      })
      .from(milestones)
      .where(eq(milestones.id, milestoneId));

    if (!row) return new NextResponse('Not found', { status: 404 });

    const [projectRow] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, row.projectId));

    if (!projectRow) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, projectRow.workspaceId)));

    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, row.projectId, 'project');
    if (!capabilities.includes('view')) return new NextResponse('Forbidden', { status: 403 });

    return NextResponse.json(row);
  } catch (e) {
    console.error('GET milestone error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { milestoneId: string } }
) {
  try {
    const profile = await requireAuth();
    const { milestoneId } = params;
    const updates = await request.json();

    if (!milestoneId) return new NextResponse('Milestone ID is required', { status: 400 });

    const [row] = await db
      .select({ id: milestones.id, projectId: milestones.projectId })
      .from(milestones)
      .where(eq(milestones.id, milestoneId));

    if (!row) return new NextResponse('Not found', { status: 404 });

    const [projectRow] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, row.projectId));

    if (!projectRow) return new NextResponse('Project not found', { status: 404 });

    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(eq(workspaceMembers.profileId, profile.id), eq(workspaceMembers.workspaceId, projectRow.workspaceId)));

    if (!membership) return new NextResponse('Forbidden', { status: 403 });

    const capabilities = await PermissionManager.getUserCapabilities(profile.id, row.projectId, 'project');
    if (!capabilities.includes('edit')) return new NextResponse('Forbidden', { status: 403 });

    const [updated] = await db
      .update(milestones)
      .set({
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.dueDate ? { dueDate: new Date(updates.dueDate) } : {}),
      })
      .where(eq(milestones.id, milestoneId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH milestone error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
