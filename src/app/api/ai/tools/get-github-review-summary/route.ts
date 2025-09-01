import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, githubPullRequests, projectRepositories, githubIntegrations, workspaceMembers, projects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GitHubService } from '@/lib/github';

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth();
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Get the task and its project to verify access
    const taskWithProject = await db
      .select({
        taskId: tasks.id,
        taskTitle: tasks.title,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!taskWithProject.length) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskWithProject[0];

    // Get linked PRs for this task
    const linkedPRs = await db
      .select({
        id: githubPullRequests.id,
        githubPrNumber: githubPullRequests.githubPrNumber,
        title: githubPullRequests.title,
        repositoryName: projectRepositories.repositoryName,
        repositoryFullName: projectRepositories.repositoryFullName
      })
      .from(githubPullRequests)
      .innerJoin(projectRepositories, eq(githubPullRequests.projectRepositoryId, projectRepositories.id))
      .where(eq(githubPullRequests.taskId, taskId));

    if (!linkedPRs.length) {
      return NextResponse.json({ 
        summary: 'No pull requests found for this task.',
        details: 'This task does not have any linked GitHub pull requests to review.'
      });
    }

    // Get GitHub integration to fetch review comments
    const githubIntegration = await db
      .select({ 
        accessToken: githubIntegrations.accessToken 
      })
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, task.workspaceId))
      .limit(1);

    if (!githubIntegration.length) {
      return NextResponse.json({ error: 'GitHub integration not found' }, { status: 404 });
    }

    const githubService = new GitHubService(githubIntegration[0].accessToken);
    
    // Collect all review comments across linked PRs
    const allReviewData = [];
    
    for (const pr of linkedPRs) {
      try {
        const [owner, repo] = pr.repositoryFullName.split('/');
        
        // Get PR reviews
        const reviews = await githubService.getPullRequestReviews(owner, repo, pr.githubPrNumber);

        // Get review comments (code-specific comments)
        const reviewComments = await githubService.getPullRequestReviewComments(owner, repo, pr.githubPrNumber);

        // Get general PR comments
        const prComments = await githubService.getPullRequestComments(owner, repo, pr.githubPrNumber);

        allReviewData.push({
          prNumber: pr.githubPrNumber,
          prTitle: pr.title,
          repository: pr.repositoryName,
          reviews: reviews.data,
          reviewComments: reviewComments.data,
          prComments: prComments.data
        });

      } catch (error) {
        console.error(`Error fetching review data for PR #${pr.githubPrNumber}:`, error);
      }
    }

    // Format the data for AI analysis
    const reviewContent = allReviewData.map(pr => {
      const reviewText = pr.reviews.map(review => 
        `Review by ${review.user?.login} (${review.state}): ${review.body || 'No comment'}`
      ).join('\n');
      
      const codeComments = pr.reviewComments.map(comment => 
        `Code comment by ${comment.user?.login}: ${comment.body}`
      ).join('\n');
      
      const generalComments = pr.prComments.map(comment => 
        `Comment by ${comment.user?.login}: ${comment.body}`
      ).join('\n');

      return `PR #${pr.prNumber}: ${pr.prTitle} (${pr.repository})
      
Reviews:
${reviewText}

Code Comments:
${codeComments}

General Comments:
${generalComments}

---`;
    }).join('\n\n');

    if (!reviewContent.trim()) {
      return NextResponse.json({
        summary: 'No review activity found.',
        details: 'The linked pull requests do not have any reviews or comments yet.'
      });
    }

    // Use your AI service to generate summary
    // For now, return the structured data
    return NextResponse.json({
      summary: `Found ${allReviewData.length} pull request(s) with review activity for task: ${task.taskTitle}`,
      details: reviewContent,
      pullRequests: allReviewData.map(pr => ({
        number: pr.prNumber,
        title: pr.prTitle,
        repository: pr.repository,
        reviewCount: pr.reviews.length,
        codeCommentCount: pr.reviewComments.length,
        generalCommentCount: pr.prComments.length
      }))
    });

  } catch (error) {
    console.error('Error generating review summary:', error);
    return NextResponse.json({ error: 'Failed to generate review summary' }, { status: 500 });
  }
}
