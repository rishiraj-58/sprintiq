import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PermissionManager } from '@/lib/permissions';

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const { title, description, status, priority, projectId, assigneeId, type, storyPoints } = await request.json();

    if (!title || !projectId) {
      return new NextResponse('Title and project ID are required', { status: 400 });
    }

    // Get the project to check workspace membership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if user is a member of the workspace
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

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, project.workspaceId);
    if (!capabilities.includes('create')) {
      return new NextResponse('Forbidden: You do not have permission to create tasks', { status: 403 });
    }

    // Get the next project_task_id for this project
    const [lastTask] = await db
      .select({ projectTaskId: tasks.projectTaskId })
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(tasks.projectTaskId)
      .limit(1);
    
    const nextProjectTaskId = lastTask ? lastTask.projectTaskId + 1 : 1;

    // Create the task
    const [newTask] = await db
      .insert(tasks)
      .values({
        projectTaskId: nextProjectTaskId,
        title,
        description,
        type: type || 'feature',
        status: status || 'todo',
        priority: priority || 'medium',
        projectId,
        storyPoints: typeof storyPoints === 'number' ? storyPoints : null,
        assigneeId,
        creatorId: profile.id,
      })
      .returning();

    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('API Error creating task:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const profile = await requireAuth();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const type = searchParams.get('type');
    const sprintId = searchParams.get('sprintId');

    if (!projectId) {
      return new NextResponse('Project ID is required', { status: 400 });
    }

    // Get the project to check workspace membership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Check if user is a member of the workspace
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

    // Check permissions
    const capabilities = await PermissionManager.getUserCapabilities(profile.id, project.workspaceId);
    if (!capabilities.includes('view')) {
      return new NextResponse('Forbidden: You do not have permission to view tasks', { status: 403 });
    }

    // Build filter conditions
    const filterConditions = [eq(tasks.projectId, projectId)];
    
    if (status) {
      filterConditions.push(eq(tasks.status, status));
    }
    
    if (priority) {
      filterConditions.push(eq(tasks.priority, priority));
    }
    
    if (assigneeId) {
      if (assigneeId === 'unassigned') {
        filterConditions.push(eq(tasks.assigneeId, null as any));
      } else {
        filterConditions.push(eq(tasks.assigneeId, assigneeId));
      }
    }
    if (type) {
      filterConditions.push(eq(tasks.type, type));
    }
    if (sprintId) {
      if (sprintId === 'null') {
        filterConditions.push(eq(tasks.sprintId, null as any));
      } else {
        filterConditions.push(eq(tasks.sprintId, sprintId));
      }
    }

    // Fetch all tasks for the project with assignee details
    const assigneeProfiles = alias(profiles, 'assignee_profiles');
    
    const projectTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        type: tasks.type,
        priority: tasks.priority,
        projectId: tasks.projectId,
        storyPoints: tasks.storyPoints,
        sprintId: tasks.sprintId,
        assigneeId: tasks.assigneeId,
        creatorId: tasks.creatorId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        dueDate: tasks.dueDate,
        assignee: {
          id: assigneeProfiles.id,
          firstName: assigneeProfiles.firstName,
          lastName: assigneeProfiles.lastName,
          email: assigneeProfiles.email,
          avatarUrl: assigneeProfiles.avatarUrl,
        },
      })
      .from(tasks)
      .leftJoin(assigneeProfiles, eq(tasks.assigneeId, assigneeProfiles.id))
      .where(and(...filterConditions));

    return NextResponse.json(projectTasks);

  } catch (error) {
    console.error('API Error fetching tasks:', error);
    if (error instanceof Error && error.message.includes('Not authenticated')) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}