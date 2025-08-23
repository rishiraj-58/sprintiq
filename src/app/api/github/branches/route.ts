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
import { GitHubService, generateBranchName, getTaskByHumanId } from '@/lib/github';



// GET /api/github/branches - Search for branches in linked repositories
export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const query = searchParams.get('q') || '';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify user has access to project
    const projectMember = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.profileId, userId)
        )
      )
      .limit(1);

    if (!projectMember.length) {
      return NextResponse.json({ error: 'No access to project' }, { status: 403 });
    }

    // Get linked repositories for this project
    const linkedRepos = await db
      .select({
        id: projectRepositories.id,
        repositoryName: projectRepositories.repositoryName,
        repositoryFullName: projectRepositories.repositoryFullName,
        githubRepoId: projectRepositories.githubRepoId,
      })
      .from(projectRepositories)
      .where(eq(projectRepositories.projectId, projectId));

    if (!linkedRepos.length) {
      return NextResponse.json({ branches: [] });
    }

    // Get GitHub integration
    const workspace = await db
      .select({ workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const integration = await db
      .select()
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, workspace[0].workspaceId))
      .limit(1);

    if (!integration.length) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 404 });
    }

    const githubService = new GitHubService(integration[0].accessToken);
    const allBranches: any[] = [];

    // Search branches in each linked repository
    for (const repo of linkedRepos) {
      try {
        const branches = await githubService.getRepositoryBranches(repo.repositoryFullName);

        // Filter branches based on query (case-insensitive)
        const filteredBranches = branches.filter((branch: any) => {
          const branchName = branch.name.toLowerCase();
          const searchTerm = query.toLowerCase();

          // If no query, show all branches
          if (!searchTerm) return true;

          // Check if branch name contains the search term
          return branchName.includes(searchTerm);
        });

        // Add repository info to each branch
        filteredBranches.forEach((branch: any) => {
          allBranches.push({
            ...branch,
            repositoryName: repo.repositoryName,
            repositoryFullName: repo.repositoryFullName,
            projectRepositoryId: repo.id,
            githubRepoId: repo.githubRepoId,
          });
        });
      } catch (error) {
        console.error(`Error fetching branches for ${repo.repositoryFullName}:`, error);
      }
    }

    return NextResponse.json({ branches: allBranches });
  } catch (error) {
    console.error('Error searching branches:', error);
    return NextResponse.json({ error: 'Failed to search branches' }, { status: 500 });
  }
}


