import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { githubBranches, projectMembers, projectRepositories } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/github/branches/check - Check if branches are linked to a task
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    const repositoryId = searchParams.get('repositoryId');

    if (!taskId || !repositoryId) {
      return NextResponse.json({ error: 'taskId and repositoryId are required' }, { status: 400 });
    }

    console.log(`Checking branches for taskId: ${taskId}, repositoryId: ${repositoryId}`);

    // Get the project ID from the repository
    const repoInfo = await db
      .select({
        projectId: projectRepositories.projectId,
      })
      .from(projectRepositories)
      .where(eq(projectRepositories.id, repositoryId))
      .limit(1);

    if (!repoInfo.length) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Check if user has access to the project
    const projectAccess = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.profileId, userId),
          eq(projectMembers.projectId, repoInfo[0].projectId)
        )
      )
      .limit(1);

    if (!projectAccess.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Now get the linked branches
    const branches = await db
      .select({
        id: githubBranches.id,
        taskId: githubBranches.taskId,
        projectRepositoryId: githubBranches.projectRepositoryId,
        branchName: githubBranches.branchName,
        githubBranchRef: githubBranches.githubBranchRef,
        createdAt: githubBranches.createdAt,
      })
      .from(githubBranches)
      .where(
        and(
          eq(githubBranches.taskId, taskId),
          eq(githubBranches.projectRepositoryId, repositoryId)
        )
      );

    console.log(`Found ${branches.length} linked branches for task ${taskId}`);
    if (branches.length > 0) {
      console.log('Linked branches:', branches.map(b => ({ name: b.branchName, repo: b.projectRepositoryId })));
    }

    return NextResponse.json({
      branches: branches
    });
  } catch (error) {
    console.error('Error checking linked branches:', error);
    return NextResponse.json({ error: 'Failed to check linked branches' }, { status: 500 });
  }
}
