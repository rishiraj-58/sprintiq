import { notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, projects, workspaceMembers, profiles } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { TaskDetailClientPage } from './TaskDetailClientPage';

interface TaskDetailPageProps {
  params: {
    taskId: string;
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  try {
    const profile = await requireAuth();
    const { taskId } = params;

    if (!taskId) {
      notFound();
    }

    // Create aliases for profiles table to join twice
    const assigneeProfiles = alias(profiles, 'assignee_profiles');
    const creatorProfiles = alias(profiles, 'creator_profiles');

    // Fetch the task with assignee and creator details
    const [taskWithDetails] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        dueDate: tasks.dueDate,
        workspaceId: projects.workspaceId,
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
        },
        assignee: {
          id: assigneeProfiles.id,
          firstName: assigneeProfiles.firstName,
          lastName: assigneeProfiles.lastName,
          email: assigneeProfiles.email,
          avatarUrl: assigneeProfiles.avatarUrl,
        },
        creator: {
          id: creatorProfiles.id,
          firstName: creatorProfiles.firstName,
          lastName: creatorProfiles.lastName,
          email: creatorProfiles.email,
          avatarUrl: creatorProfiles.avatarUrl,
        },
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(assigneeProfiles, eq(tasks.assigneeId, assigneeProfiles.id)) // Assignee (optional)
      .leftJoin(creatorProfiles, eq(tasks.creatorId, creatorProfiles.id)) // Creator
      .where(eq(tasks.id, taskId));

    if (!taskWithDetails) {
      notFound();
    }

    // Check if the user is a member of the workspace that the task belongs to
    const [membership] = await db
      .select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.profileId, profile.id),
          eq(workspaceMembers.workspaceId, taskWithDetails.workspaceId)
        )
      );

    if (!membership) {
      notFound();
    }

    return <TaskDetailClientPage task={taskWithDetails} />;

  } catch (error) {
    console.error('Error fetching task:', error);
    notFound();
  }
}
