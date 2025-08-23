import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { 
  tasks, 
  projects, 
  projectRepositories, 
  githubIntegrations, 
  githubBranches,
  projectMembers 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GitHubService, generateBranchName, getTaskByHumanId } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, repositoryId, branchName } = body;

    if (!taskId || !repositoryId) {
      return NextResponse.json({ error: 'taskId and repositoryId are required' }, { status: 400 });
    }

    // Get task and verify access
    const taskResult = await db
      .select({
        task: tasks,
        project: projects,
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!taskResult.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { task, project } = taskResult[0];

    // Verify user has access to project
    const projectMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, project.id),
          eq(projectMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!projectMember.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Get repository and GitHub integration
    const repoResult = await db
      .select({
        repository: projectRepositories,
        integration: githubIntegrations,
      })
      .from(projectRepositories)
      .innerJoin(githubIntegrations, eq(projectRepositories.githubIntegrationId, githubIntegrations.id))
      .where(eq(projectRepositories.id, repositoryId))
      .limit(1);

    if (!repoResult.length) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    const { repository, integration } = repoResult[0];

    // Generate branch name if not provided
    const humanTaskId = `${project.key}-${task.projectTaskId}`;
    const finalBranchName = branchName || generateBranchName(humanTaskId, task.title);

    // Create branch via GitHub API
    const githubService = new GitHubService(integration.accessToken);
    const branch = await githubService.createBranch(
      repository.repositoryFullName,
      finalBranchName,
      repository.defaultBranch
    );

    // Save branch to database
    const [createdBranch] = await db
      .insert(githubBranches)
      .values({
        taskId: task.id,
        projectRepositoryId: repository.id,
        branchName: finalBranchName,
        githubBranchRef: branch.ref,
        createdById: userId,
      })
      .returning();

    return NextResponse.json({
      branch: {
        id: createdBranch.id,
        name: finalBranchName,
        url: branch.url,
        taskId: humanTaskId,
      },
    });
  } catch (error: any) {
    console.error('Error creating branch:', error);
    
    if (error.message.includes('Reference already exists')) {
      return NextResponse.json({ error: 'Branch already exists' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
