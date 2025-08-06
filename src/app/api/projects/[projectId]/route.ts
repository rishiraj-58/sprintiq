import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, workspaceMembers } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

// GET - Fetch a specific project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Fetch the project
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if the user is a member of the workspace that the project belongs to
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, project.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    return NextResponse.json(project);

  } catch (error) {
    console.error('API Error fetching project:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// PATCH - Update a specific project
export async function PATCH(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;
    const body = await request.json();
    const { name, description, status } = body;

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Fetch the project first
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if the user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, project.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check if user has edit permission
    const userCapabilities = await PermissionManager.getUserCapabilities(profile.id, project.workspaceId);
    if (!userCapabilities.includes('edit')) {
      return new NextResponse('Forbidden: You do not have permission to edit this project', { status: 403 });
    }

    // Update the project
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    updateData.updatedAt = new Date();

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('API Error updating project:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE - Delete a specific project
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const profile = await requireAuth();
    const { projectId } = params;

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Fetch the project first
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if the user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, project.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check if user has delete permission
    const userCapabilities = await PermissionManager.getUserCapabilities(profile.id, project.workspaceId);
    if (!userCapabilities.includes('delete')) {
      return new NextResponse('Forbidden: You do not have permission to delete this project', { status: 403 });
    }

    // Delete the project
    await db
      .delete(projects)
      .where(eq(projects.id, projectId));

    return new NextResponse('Project deleted successfully', { status: 200 });

  } catch (error) {
    console.error('API Error deleting project:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 