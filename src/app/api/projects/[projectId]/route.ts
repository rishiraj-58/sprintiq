import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { projects, workspaceMembers, projectMembers, tasks, comments, taskAttachments, taskSubtasks, taskLinks, taskLabels, taskAuditLogs, taskHistory, milestones, releases, blockers, calendarEvents, policies, capacityWindows, projectPhases, documents, bugs } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
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
    const { 
      name, 
      description, 
      status, 
      visibility, 
      category, 
      currency, 
      startDate, 
      targetEndDate, 
      budget 
    } = body;

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

    // Check if user has edit permission in project context
    const userCapabilities = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!userCapabilities.includes('edit')) {
      return new NextResponse('Forbidden: You do not have permission to edit this project', { status: 403 });
    }

    // Update the project
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (category !== undefined) updateData.category = category;
    if (currency !== undefined) updateData.currency = currency;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (targetEndDate !== undefined) updateData.targetEndDate = targetEndDate ? new Date(targetEndDate) : null;
    if (budget !== undefined) updateData.budget = budget;
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

    // Check if user has delete permission in project context
    const userCapabilities = await PermissionManager.getUserCapabilities(profile.id, projectId, 'project');
    if (!userCapabilities.includes('delete')) {
      return new NextResponse('Forbidden: You do not have permission to delete this project', { status: 403 });
    }

    // Delete related data in a transaction to satisfy FK constraints
    await db.transaction(async (tx) => {
      // Gather task IDs for this project
      const taskIdRows = await tx
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.projectId, projectId));
      const taskIds = taskIdRows.map((t) => t.id);

      if (taskIds.length > 0) {
        // Delete task-scoped tables first (some have cascade, but we ensure cleanup)
        await tx.delete(comments).where(inArray(comments.taskId, taskIds));
        await tx.delete(taskAttachments).where(inArray(taskAttachments.taskId, taskIds));
        await tx.delete(taskSubtasks).where(inArray(taskSubtasks.taskId, taskIds));
        await tx.delete(taskLinks).where(inArray(taskLinks.taskId, taskIds));
        await tx.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds));
        await tx.delete(taskAuditLogs).where(inArray(taskAuditLogs.taskId, taskIds));
        await tx.delete(taskHistory).where(inArray(taskHistory.taskId, taskIds));
        // Finally, delete tasks
        await tx.delete(tasks).where(eq(tasks.projectId, projectId));
      }

      // Delete project-level related records
      await tx.delete(milestones).where(eq(milestones.projectId, projectId));
      await tx.delete(releases).where(eq(releases.projectId, projectId));
      await tx.delete(blockers).where(eq(blockers.projectId, projectId));
      await tx.delete(calendarEvents).where(eq(calendarEvents.projectId, projectId));
      await tx.delete(policies).where(eq(policies.projectId, projectId));
      await tx.delete(capacityWindows).where(eq(capacityWindows.projectId, projectId));
      await tx.delete(projectPhases).where(eq(projectPhases.projectId, projectId));
      await tx.delete(documents).where(eq(documents.projectId, projectId));
      await tx.delete(bugs).where(eq(bugs.projectId, projectId));
      await tx.delete(projectMembers).where(eq(projectMembers.projectId, projectId));

      // Delete the project last
      await tx.delete(projects).where(eq(projects.id, projectId));
    });

    return new NextResponse('Project deleted successfully', { status: 200 });

  } catch (error) {
    console.error('API Error deleting project:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 