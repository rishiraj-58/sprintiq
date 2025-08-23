import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import {
  tasks,
  projects,
  projectRepositories,
  githubIntegrations,
  githubBranches,
  projectMembers,
  githubActivities
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/github/link-branch - Link an existing branch to a task
export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, projectRepositoryId, branchName, githubBranchRef } = await request.json();

    if (!taskId || !projectRepositoryId || !branchName || !githubBranchRef) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has access to the task
    const task = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        title: tasks.title,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access to the project
    const projectMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, task[0].projectId),
          eq(projectMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!projectMember.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Get repository details to construct the GitHub URL
    const repoDetails = await db
      .select({ repositoryFullName: projectRepositories.repositoryFullName })
      .from(projectRepositories)
      .where(eq(projectRepositories.id, projectRepositoryId))
      .limit(1);

    if (!repoDetails.length) {
      console.error(`Repository details not found for projectRepositoryId: ${projectRepositoryId}`);
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    const repositoryFullName = repoDetails[0].repositoryFullName;

    // Check if branch is already linked to this task
    const existingLink = await db
      .select()
      .from(githubBranches)
      .where(
        and(
          eq(githubBranches.taskId, taskId),
          eq(githubBranches.branchName, branchName)
        )
      )
      .limit(1);

    let createdLink;

    if (existingLink.length > 0) {
      console.log(`Branch ${branchName} is already linked to task ${taskId}. Using existing link.`);

      // Don't return 409 immediately - ensure activity exists first
      createdLink = existingLink[0];

      // Check if activity already exists for this branch link
      const existingActivity = await db
        .select()
        .from(githubActivities)
        .where(
          and(
            eq(githubActivities.taskId, taskId),
            eq(githubActivities.activityType, 'branch_linked'),
            eq(githubActivities.projectRepositoryId, projectRepositoryId)
          )
        )
        .limit(1);

      if (existingActivity.length > 0) {
        console.log(`Branch linking activity already exists: ${existingActivity[0].id}`);
        return NextResponse.json({
          branch: {
            id: existingLink[0].id,
            name: branchName,
            taskId: taskId,
          },
        });
      }
    } else {
      // Create the branch link
      [createdLink] = await db
        .insert(githubBranches)
        .values({
          taskId: taskId,
          projectRepositoryId: projectRepositoryId,
          branchName: branchName,
          githubBranchRef: githubBranchRef,
          createdById: userId,
        })
        .returning();

      console.log(`Branch link created for task ${taskId}: ${branchName}`);
    }

    console.log(`Creating/ensuring branch linking activity for task ${taskId}: ${branchName}`);

    // Log the branch linking activity (ensure it exists)
    try {
      // Check if activity already exists
      const existingActivity = await db
        .select()
        .from(githubActivities)
        .where(
          and(
            eq(githubActivities.taskId, taskId),
            eq(githubActivities.activityType, 'branch_linked'),
            eq(githubActivities.projectRepositoryId, projectRepositoryId)
          )
        )
        .limit(1);

      if (existingActivity.length > 0) {
        console.log(`Branch linking activity already exists: ${existingActivity[0].id}`);
      } else {
        const [activity] = await db.insert(githubActivities).values({
          projectRepositoryId: projectRepositoryId,
          taskId: taskId,
          activityType: 'branch_linked',
          actorLogin: 'SprintIQ', // Since this is done through SprintIQ, not a GitHub user
          title: `Branch linked: ${branchName}`,
          description: `Branch ${branchName} was linked to task ${task[0].title}`,
          githubUrl: `https://github.com/${repositoryFullName}/tree/${branchName}`,
          metadata: {
            branch: branchName,
            taskId: taskId,
            taskTitle: task[0].title,
            linkedBy: userId,
            action: 'linked',
          },
          githubCreatedAt: new Date(),
        }).returning();

        console.log(`Branch linking activity created successfully: ${activity.id}`);
      }
    } catch (activityError) {
      console.error('Error creating branch linking activity:', activityError);
    }

    return NextResponse.json({
      branch: {
        id: createdLink.id,
        name: branchName,
        taskId: taskId,
      },
    });
  } catch (error) {
    console.error('Error linking branch:', error);
    return NextResponse.json({ error: 'Failed to link branch' }, { status: 500 });
  }
}
