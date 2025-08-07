import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { comments, tasks, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { PermissionManager } from '@/lib/permissions';

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return new NextResponse('Comment content is required', { status: 400 });
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
      return new NextResponse('Forbidden: You do not have permission to comment', { status: 403 });
    }

    // Create the comment
    const [newComment] = await db
      .insert(comments)
      .values({
        content: content.trim(),
        taskId,
        authorId: profile.id,
      })
      .returning();

    // Return the comment with author details
    const [commentWithAuthor] = await db
      .select({
        id: comments.id,
        content: comments.content,
        taskId: comments.taskId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(comments)
      .innerJoin(profiles, eq(comments.authorId, profiles.id))
      .where(eq(comments.id, newComment.id));

    return NextResponse.json(commentWithAuthor, { status: 201 });

  } catch (error) {
    console.error('API Error creating comment:', error);
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
      return new NextResponse('Forbidden: You do not have permission to view comments', { status: 403 });
    }

    // Fetch all comments for the task with author details
    const taskComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        taskId: comments.taskId,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        author: {
          id: profiles.id,
          firstName: profiles.firstName,
          lastName: profiles.lastName,
          email: profiles.email,
          avatarUrl: profiles.avatarUrl,
        },
      })
      .from(comments)
      .innerJoin(profiles, eq(comments.authorId, profiles.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json(taskComments);

  } catch (error) {
    console.error('API Error fetching comments:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
