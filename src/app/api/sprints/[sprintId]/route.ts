import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { sprints, projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function GET(
  request: Request,
  { params }: { params: { sprintId: string } }
) {
  try {
    const profile = await requireAuth();
    const { sprintId } = params;

    if (!sprintId) return new NextResponse('Sprint ID is required', { status: 400 });

    const [row] = await db
      .select({
        id: sprints.id,
        name: sprints.name,
        description: sprints.description,
        status: sprints.status,
        startDate: sprints.startDate,
        endDate: sprints.endDate,
        projectId: sprints.projectId,
      })
      .from(sprints)
      .where(eq(sprints.id, sprintId));

    if (!row) return new NextResponse('Not found', { status: 404 });

    // Verify workspace membership via project
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
    console.error('GET sprint error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { sprintId: string } }
) {
  try {
    const profile = await requireAuth();
    const { sprintId } = params;
    const updates = await request.json();

    if (!sprintId) return new NextResponse('Sprint ID is required', { status: 400 });

    const [row] = await db
      .select({ id: sprints.id, projectId: sprints.projectId })
      .from(sprints)
      .where(eq(sprints.id, sprintId));

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
      .update(sprints)
      .set({
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.startDate ? { startDate: new Date(updates.startDate) } : {}),
        ...(updates.endDate ? { endDate: new Date(updates.endDate) } : {}),
      })
      .where(eq(sprints.id, sprintId))
      .returning();

    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH sprint error', e);
    if (e instanceof Error && e.message.includes('Not authenticated')) return new NextResponse('Unauthorized', { status: 401 });
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
