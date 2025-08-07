import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { taskAttachments, tasks, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;
    const { name, fileUrl, fileType, fileSize, s3Key } = await request.json();

    if (!name || !fileUrl || !fileType || !fileSize || !s3Key) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Get the task to check workspace membership and permissions
    const [task] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Check if user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, task.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('edit')) {
      return new NextResponse('Forbidden: You do not have permission to add attachments', { status: 403 });
    }

    // Create the attachment record
    const [newAttachment] = await db
      .insert(taskAttachments)
      .values({
        name,
        taskId,
        uploaderId: profile.id,
        fileUrl,
        fileType,
        fileSize: parseInt(fileSize.toString()),
        s3Key,
      })
      .returning();

    // Return the attachment with uploader details
    const [attachmentWithUploader] = await db
      .select({
        id: taskAttachments.id,
        name: taskAttachments.name,
        taskId: taskAttachments.taskId,
        fileUrl: taskAttachments.fileUrl,
        fileType: taskAttachments.fileType,
        fileSize: taskAttachments.fileSize,
        s3Key: taskAttachments.s3Key,
        createdAt: taskAttachments.createdAt,
        uploader: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(taskAttachments)
      .innerJoin(profiles, eq(taskAttachments.uploaderId, profiles.id))
      .where(eq(taskAttachments.id, newAttachment.id));

    return NextResponse.json(attachmentWithUploader, { status: 201 });

  } catch (error) {
    console.error('API Error creating task attachment:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    // Get the task to check workspace membership and permissions
    const [task] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId));

    if (!task) {
      return new NextResponse('Task not found', { status: 404 });
    }

    // Check if user is a member of the workspace
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, task.workspaceId)
        )
      );

    if (!membership) {
      return new NextResponse('Forbidden: You are not a member of this workspace', { status: 403 });
    }

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, task.workspaceId);
    if (!capabilities.includes('view')) {
      return new NextResponse('Forbidden: You do not have permission to view attachments', { status: 403 });
    }

    // Fetch all attachments for the task with uploader details
    const attachments = await db
      .select({
        id: taskAttachments.id,
        name: taskAttachments.name,
        taskId: taskAttachments.taskId,
        fileUrl: taskAttachments.fileUrl,
        fileType: taskAttachments.fileType,
        fileSize: taskAttachments.fileSize,
        s3Key: taskAttachments.s3Key,
        createdAt: taskAttachments.createdAt,
        uploader: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(taskAttachments)
      .innerJoin(profiles, eq(taskAttachments.uploaderId, profiles.id))
      .where(eq(taskAttachments.taskId, taskId))
      .orderBy(taskAttachments.createdAt);

    return NextResponse.json(attachments);

  } catch (error) {
    console.error('API Error fetching task attachments:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
