import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { githubIntegrations, projectRepositories, githubActivities, githubBranches, githubPullRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

// GitHub webhook secret for verification
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// Verify GitHub webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured, skipping signature verification');
    return true;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex')}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Process different GitHub webhook events
async function processWebhookEvent(event: string, payload: any) {
  try {
    switch (event) {
      case 'push':
        await processPushEvent(payload);
        break;
      case 'pull_request':
        await processPullRequestEvent(payload);
        break;
      case 'create':
        await processCreateEvent(payload);
        break;
      case 'delete':
        await processDeleteEvent(payload);
        break;
      case 'issues':
        await processIssuesEvent(payload);
        break;
      case 'issue_comment':
        await processIssueCommentEvent(payload);
        break;
      case 'pull_request_review':
        await processPullRequestReviewEvent(payload);
        break;
      case 'check_suite':
        await processCheckSuiteEvent(payload);
        break;
      default:
        console.log(`Unhandled GitHub event: ${event}`);
    }
  } catch (error) {
    console.error(`Error processing ${event} event:`, error);
  }
}

// Process push events (commits, branch updates)
async function processPushEvent(payload: any) {
  const { repository, ref, commits, sender } = payload;

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Extract branch name from ref (e.g., "refs/heads/main" -> "main")
  const branchName = ref.replace('refs/heads/', '');
  
  // Check if this branch is linked to a task
  const linkedBranch = await db
    .select({
      id: githubBranches.id,
      taskId: githubBranches.taskId,
    })
    .from(githubBranches)
    .where(eq(githubBranches.branchName, branchName));

  for (const repo of linkedRepos) {
    // Record the push activity
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: 'push',
      actorLogin: sender.login,
      title: `Push to ${branchName}`,
      description: commits[0]?.message || 'Multiple commits',
      githubUrl: `https://github.com/${repository.full_name}/commit/${commits[0]?.sha || payload.after}`,
      metadata: {
        repository: repository.full_name,
        branch: branchName,
        commits: commits.length,
        author: sender.login,
        message: commits[0]?.message || 'Multiple commits',
        sha: commits[0]?.sha || payload.after,
      },
      githubCreatedAt: new Date(),
    });

    // If branch is linked to a task, update task activity
    if (linkedBranch.length > 0) {
      const branch = linkedBranch[0];
      await db.insert(githubActivities).values({
        projectRepositoryId: repo.id,
        taskId: branch.taskId,
        activityType: 'push',
        actorLogin: sender.login,
        title: `Push to ${branchName}`,
        description: commits[0]?.message || 'Multiple commits',
        githubUrl: `https://github.com/${repository.full_name}/commit/${commits[0]?.sha || payload.after}`,
        metadata: {
          repository: repository.full_name,
          branch: branchName,
          commits: commits.length,
          author: sender.login,
          message: commits[0]?.message || 'Multiple commits',
                  sha: commits[0]?.sha || payload.after,
      },
      githubCreatedAt: new Date(),
      });
    }
  }
}

// Process pull request events
async function processPullRequestEvent(payload: any) {
  const { action, pull_request, repository, sender } = payload;

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Check if this PR is linked to a task by branch name
  const linkedBranch = await db
    .select({
      id: githubBranches.id,
      taskId: githubBranches.taskId,
    })
    .from(githubBranches)
    .where(eq(githubBranches.branchName, pull_request.head.ref));

  // Find the specific project repository for this PR
  const projectRepo = await db
    .select({
      id: projectRepositories.id,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()))
    .limit(1);

  if (projectRepo.length > 0) {
    // Update or create PR record
    const prData = {
      taskId: linkedBranch[0]?.taskId || null,
      projectRepositoryId: projectRepo[0].id,
      githubPrNumber: pull_request.number,
      title: pull_request.title,
      body: pull_request.body || '',
      state: pull_request.state,
      isDraft: pull_request.draft || false,
      headBranch: pull_request.head.ref,
      baseBranch: pull_request.base.ref,
      authorLogin: pull_request.user.login,
      githubCreatedAt: new Date(pull_request.created_at),
      githubUpdatedAt: new Date(pull_request.updated_at),
      githubMergedAt: pull_request.merged_at ? new Date(pull_request.merged_at) : null,
      checksStatus: 'pending',
      reviewStatus: 'pending',
    };

    if (action === 'opened' || action === 'synchronize') {
      // Insert or update PR
      await db
        .insert(githubPullRequests)
        .values(prData)
        .onConflictDoUpdate({
          target: githubPullRequests.githubPrNumber,
          set: prData,
        });
    }
  }

  // Record the PR activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      taskId: linkedBranch[0]?.taskId || null,
      activityType: `pull_request_${action}`,
      actorLogin: sender.login,
      title: `PR ${action}: ${pull_request.title}`,
      description: pull_request.body || '',
      githubUrl: pull_request.html_url,
      metadata: {
        repository: repository.full_name,
        prNumber: pull_request.number,
        title: pull_request.title,
        author: sender.login,
        action: action,
        url: pull_request.html_url,
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process branch creation events
async function processCreateEvent(payload: any) {
  if (payload.ref_type !== 'branch') return;

  const { repository, ref, sender } = payload;

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record branch creation activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: 'branch_created',
      actorLogin: sender.login,
      title: `Branch created: ${ref}`,
      description: `New branch ${ref} created in ${repository.full_name}`,
      githubUrl: `https://github.com/${repository.full_name}/tree/${ref}`,
      metadata: {
        repository: repository.full_name,
        branch: ref,
        author: sender.login,
        sha: payload.sha,
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process branch deletion events
async function processDeleteEvent(payload: any) {
  if (payload.ref_type !== 'branch') return;

  const { repository, ref, sender } = payload;

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record branch deletion activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: 'branch_deleted',
      actorLogin: sender.login,
      title: `Branch deleted: ${ref}`,
      description: `Branch ${ref} deleted from ${repository.full_name}`,
      githubUrl: `https://github.com/${repository.full_name}`,
      metadata: {
        repository: repository.full_name,
        branch: ref,
        author: sender.login,
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process issue events
async function processIssuesEvent(payload: any) {
  const { action, issue, repository, sender } = payload;
  
  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record issue activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `issue_${action}`,
      actorLogin: sender.login,
      title: `Issue ${action}: ${issue.title}`,
      description: issue.body || '',
      githubUrl: issue.html_url,
      metadata: {
        repository: repository.full_name,
        issueNumber: issue.number,
        title: issue.title,
        author: sender.login,
        action: action,
        url: issue.html_url,
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process issue comment events
async function processIssueCommentEvent(payload: any) {
  const { action, issue, comment, repository, sender } = payload;
  
  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record comment activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `comment_${action}`,
      actorLogin: sender.login,
      title: `Issue comment ${action}`,
      description: comment.body?.substring(0, 200) || '',
      metadata: {
        repository: repository.full_name,
        issueNumber: issue.number,
        commentAuthor: sender.login,
        action: action,
        commentBody: comment.body.substring(0, 200), // Truncate long comments
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process pull request review events
async function processPullRequestReviewEvent(payload: any) {
  const { action, pull_request, review, repository, sender } = payload;
  
  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record review activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `review_${action}`,
      actorLogin: sender.login,
      title: `PR Review ${action}`,
      description: review.body?.substring(0, 200) || '',
      metadata: {
        repository: repository.full_name,
        prNumber: pull_request.number,
        reviewAuthor: sender.login,
        action: action,
        state: review.state,
        body: review.body?.substring(0, 200) || '',
      },
      githubCreatedAt: new Date(),
    });
  }
}

// Process check suite events (CI/CD status)
async function processCheckSuiteEvent(payload: any) {
  const { action, check_suite, repository, sender } = payload;
  
  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) return;

  // Record check suite activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `check_suite_${action}`,
      actorLogin: sender.login,
      title: `Check Suite ${action}`,
      description: `Check suite ${check_suite.status} with conclusion ${check_suite.conclusion}`,
      metadata: {
        repository: repository.full_name,
        checkSuiteId: check_suite.id,
        status: check_suite.status,
        conclusion: check_suite.conclusion,
        headBranch: check_suite.head_branch,
        headSha: check_suite.head_sha,
      },
      githubCreatedAt: new Date(),
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    if (!event) {
      return new NextResponse('Missing GitHub event header', { status: 400 });
    }

    // Verify webhook signature
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse the payload
    const payload = JSON.parse(body);
    
    console.log(`Processing GitHub webhook: ${event} (${deliveryId})`);

    // Process the webhook event
    await processWebhookEvent(event, payload);

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
