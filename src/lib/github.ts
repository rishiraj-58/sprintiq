import { db } from '@/db';
import { projects, tasks, bugs, projectRepositories, githubIntegrations, githubBranches, githubPullRequests, githubActivities, taskLinks } from '@/db/schema';
import { eq, and, desc, max } from 'drizzle-orm';
import { Octokit } from '@octokit/rest';

// GitHub OAuth and API configuration
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
export const GITHUB_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/callback`;

// Helper function to generate project key from project name
export function generateProjectKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10) || 'PROJ';
}

// Helper function to generate human-readable task ID
export function formatTaskId(projectKey: string, taskNumber: number): string {
  return `${projectKey}-${taskNumber}`;
}

// Helper function to parse human-readable task ID
export function parseTaskId(taskId: string): { projectKey: string; taskNumber: number } | null {
  const match = taskId.match(/^([A-Z0-9]+)-(\d+)$/);
  if (!match) return null;
  
  return {
    projectKey: match[1],
    taskNumber: parseInt(match[2], 10),
  };
}

// Get next task number for a project
export async function getNextTaskNumber(projectId: string): Promise<number> {
  const result = await db
    .select({ maxTaskId: max(tasks.projectTaskId) })
    .from(tasks)
    .where(eq(tasks.projectId, projectId));
  
  return (result[0]?.maxTaskId || 0) + 1;
}

// Get next bug number for a project
export async function getNextBugNumber(projectId: string): Promise<number> {
  const result = await db
    .select({ maxBugId: max(bugs.projectBugId) })
    .from(bugs)
    .where(eq(bugs.projectId, projectId));
  
  return (result[0]?.maxBugId || 0) + 1;
}

// Get task by human-readable ID
export async function getTaskByHumanId(humanId: string) {
  const parsed = parseTaskId(humanId);
  if (!parsed) return null;

  const result = await db
    .select({
      task: tasks,
      project: projects,
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(projects.key, parsed.projectKey),
        eq(tasks.projectTaskId, parsed.taskNumber)
      )
    )
    .limit(1);

  return result[0] || null;
}

// Get bug by human-readable ID
export async function getBugByHumanId(humanId: string) {
  const parsed = parseTaskId(humanId);
  if (!parsed) return null;

  const result = await db
    .select({
      bug: bugs,
      project: projects,
    })
    .from(bugs)
    .innerJoin(projects, eq(bugs.projectId, projects.id))
    .where(
      and(
        eq(projects.key, parsed.projectKey),
        eq(bugs.projectBugId, parsed.taskNumber)
      )
    )
    .limit(1);

  return result[0] || null;
}

// GitHub API client
export class GitHubService {
  private octokit: Octokit;

  constructor(accessToken: string) {
    this.octokit = new Octokit({
      auth: accessToken,
    });
  }

  // Get issues for a specific repository
  async getRepositoryIssues(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    try {
      const { data } = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page: 100,
        sort: 'updated',
        direction: 'desc',
      });

      // Filter out pull requests (GitHub treats PRs as issues too)
      const issues = data.filter((item: any) => !item.pull_request);

      return issues.map((issue: any) => ({
        id: issue.id.toString(),
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        htmlUrl: issue.html_url,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        author: issue.user?.login,
        labels: issue.labels?.map((label: any) => ({
          name: label.name,
          color: label.color,
        })) || [],
        assignee: issue.assignee?.login,
        repository: {
          name: repo,
          fullName: `${owner}/${repo}`,
        },
      }));
    } catch (error: any) {
      console.error(`Error fetching issues for ${owner}/${repo}:`, error);
      throw error;
    }
  }

  // Get repositories for an organization or user
  async getOrgRepositories(org: string) {
    try {
      // First try to fetch as organization
      const { data } = await this.octokit.rest.repos.listForOrg({
        org,
        type: 'all',
        sort: 'updated',
        per_page: 100,
      });

      return data.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        defaultBranch: repo.default_branch,
        isPrivate: repo.private,
        htmlUrl: repo.html_url,
      }));
    } catch (error: any) {
      console.error(`Error fetching org repositories for ${org}:`, error);

      // If it's a 404, try fetching as user repositories
      if (error.status === 404 || error.message?.includes('Not Found')) {
        console.log(`Organization ${org} not found, trying as user repositories...`);
        try {
          const { data: userRepos } = await this.octokit.rest.repos.listForAuthenticatedUser({
            type: 'all',
            sort: 'updated',
            per_page: 100,
          });

          return userRepos.map((repo: any) => ({
            id: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            defaultBranch: repo.default_branch,
            isPrivate: repo.private,
            htmlUrl: repo.html_url,
          }));
        } catch (userError) {
          console.error('Error fetching user repositories:', userError);
          throw new Error('Failed to fetch repositories from organization or user account');
        }
      }

      throw new Error('Failed to fetch repositories');
    }
  }

  // Get branches for a specific repository
  async getRepositoryBranches(repositoryFullName: string) {
    try {
      const [owner, repo] = repositoryFullName.split('/');

      const { data } = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      });

      return data.map((branch: any) => ({
        name: branch.name,
        sha: branch.commit.sha,
        protected: branch.protected,
        htmlUrl: `https://github.com/${repositoryFullName}/tree/${branch.name}`,
      }));
    } catch (error) {
      console.error(`Error fetching branches for ${repositoryFullName}:`, error);
      throw new Error('Failed to fetch repository branches');
    }
  }

  // Create a branch
  async createBranch(repo: string, branchName: string, fromBranch: string = 'main') {
    try {
      // Get the latest commit SHA from the base branch
      const { data: baseRef } = await this.octokit.rest.git.getRef({
        owner: repo.split('/')[0],
        repo: repo.split('/')[1],
        ref: `heads/${fromBranch}`,
      });

      // Create the new branch
      const { data: newRef } = await this.octokit.rest.git.createRef({
        owner: repo.split('/')[0],
        repo: repo.split('/')[1],
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });

      return {
        name: branchName,
        ref: newRef.ref,
        sha: newRef.object.sha,
        url: `https://github.com/${repo}/tree/${branchName}`,
      };
    } catch (error) {
      console.error('Error creating branch:', error);
      throw new Error('Failed to create branch');
    }
  }

  // Get pull requests for a repository
  async getPullRequests(repo: string, state: 'open' | 'closed' | 'all' = 'open') {
    try {
      const { data } = await this.octokit.rest.pulls.list({
        owner: repo.split('/')[0],
        repo: repo.split('/')[1],
        state,
        sort: 'updated',
        direction: 'desc',
        per_page: 50,
      });

      return data.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        body: pr.body || '',
        state: pr.state,
        isDraft: pr.draft,
        headBranch: pr.head.ref,
        baseBranch: pr.base.ref,
        authorLogin: pr.user?.login || 'unknown',
        authorAvatarUrl: pr.user?.avatar_url,
        htmlUrl: pr.html_url,
        createdAt: new Date(pr.created_at),
        updatedAt: new Date(pr.updated_at),
        mergedAt: pr.merged_at ? new Date(pr.merged_at) : null,
      }));
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      throw new Error('Failed to fetch pull requests');
    }
  }

  // Get pull request status (checks and reviews)
  async getPullRequestStatus(repo: string, prNumber: number) {
    try {
      const [checksResponse, reviewsResponse] = await Promise.all([
        this.octokit.rest.checks.listForRef({
          owner: repo.split('/')[0],
          repo: repo.split('/')[1],
          ref: `pull/${prNumber}/head`,
        }),
        this.octokit.rest.pulls.listReviews({
          owner: repo.split('/')[0],
          repo: repo.split('/')[1],
          pull_number: prNumber,
        }),
      ]);

      // Determine overall checks status
      let checksStatus = 'pending';
      if (checksResponse.data.check_runs.length > 0) {
        const allPassed = checksResponse.data.check_runs.every(
          (check: any) => check.conclusion === 'success'
        );
        const anyFailed = checksResponse.data.check_runs.some(
          (check: any) => check.conclusion === 'failure'
        );
        
        if (allPassed) checksStatus = 'success';
        else if (anyFailed) checksStatus = 'failure';
      }

      // Determine overall review status
      let reviewStatus = 'pending';
      const reviews = reviewsResponse.data;
      if (reviews.length > 0) {
        const latestReviews = reviews.reduce((acc: any, review: any) => {
          if (!review.user) return acc;
          const userId = review.user.id;
          if (!acc[userId] || new Date(review.submitted_at!) > new Date(acc[userId].submitted_at!)) {
            acc[userId] = review;
          }
          return acc;
        }, {} as Record<number, typeof reviews[0]>);

        const states = Object.values(latestReviews).map((review: any) => review.state);
        if (states.includes('CHANGES_REQUESTED')) {
          reviewStatus = 'changes_requested';
        } else if (states.includes('APPROVED')) {
          reviewStatus = 'approved';
        }
      }

      return {
        checksStatus,
        reviewStatus,
        checks: checksResponse.data.check_runs,
        reviews: reviews,
      };
    } catch (error) {
      console.error('Error fetching PR status:', error);
      return {
        checksStatus: 'pending',
        reviewStatus: 'pending',
        checks: [],
        reviews: [],
      };
    }
  }
}

// Helper function to generate suggested branch name
export function generateBranchName(taskId: string, title: string): string {
  const cleanTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/-+$/, '');
    
  return `feature/${taskId.toLowerCase()}-${cleanTitle}`;
}

// Helper function to extract task IDs from text (PR descriptions, commit messages)
export function extractTaskIds(text: string): string[] {
  const taskIdRegex = /\b[A-Z0-9]+-\d+\b/g;
  return text.match(taskIdRegex) || [];
}

// Database helpers for GitHub integration

export async function getWorkspaceGithubIntegration(workspaceId: string) {
  const integration = await db
    .select()
    .from(githubIntegrations)
    .where(eq(githubIntegrations.workspaceId, workspaceId))
    .limit(1);
  
  return integration[0] || null;
}

export async function getProjectRepositories(projectId: string) {
  const repos = await db
    .select({
      repository: projectRepositories,
      integration: githubIntegrations,
    })
    .from(projectRepositories)
    .innerJoin(githubIntegrations, eq(projectRepositories.githubIntegrationId, githubIntegrations.id))
    .where(eq(projectRepositories.projectId, projectId));
  
  return repos;
}

export async function getTaskBranches(taskId: string) {
  const branches = await db
    .select({
      branch: githubBranches,
      repository: projectRepositories,
    })
    .from(githubBranches)
    .innerJoin(projectRepositories, eq(githubBranches.projectRepositoryId, projectRepositories.id))
    .where(eq(githubBranches.taskId, taskId));
  
  return branches;
}

export async function getTaskPullRequests(taskId: string) {
  const prs = await db
    .select({
      pullRequest: githubPullRequests,
      repository: projectRepositories,
    })
    .from(githubPullRequests)
    .innerJoin(projectRepositories, eq(githubPullRequests.projectRepositoryId, projectRepositories.id))
    .where(eq(githubPullRequests.taskId, taskId))
    .orderBy(desc(githubPullRequests.githubCreatedAt));
  
  return prs;
}

export async function getTaskGithubActivities(taskId: string) {
  const activities = await db
    .select({
      activity: githubActivities,
      repository: projectRepositories,
    })
    .from(githubActivities)
    .innerJoin(projectRepositories, eq(githubActivities.projectRepositoryId, projectRepositories.id))
    .where(eq(githubActivities.taskId, taskId))
    .orderBy(desc(githubActivities.githubCreatedAt));
  
  return activities;
}
