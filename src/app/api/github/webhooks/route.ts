import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { githubIntegrations, projectRepositories, githubActivities, githubBranches, githubPullRequests, tasks, externalTaskLinks, comments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
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
      case 'issue_opened':
      case 'issue_closed':
      case 'issue_reopened':
      case 'issue_edited':
        await processIssuesEvent(payload);
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

  console.log(`Processing PR webhook: ${action} - PR #${pull_request.number} - Branch: ${pull_request.head.ref} - Repo: ${repository.full_name}`);

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  console.log(`Found ${linkedRepos.length} linked repositories for GitHub repo ${repository.id}`);

  if (linkedRepos.length === 0) {
    console.log('No linked repositories found, skipping PR processing');
    return;
  }

  // Check if this PR is linked to a task by branch name
  const linkedBranch = await db
    .select({
      id: githubBranches.id,
      taskId: githubBranches.taskId,
      branchName: githubBranches.branchName,
    })
    .from(githubBranches)
    .where(eq(githubBranches.branchName, pull_request.head.ref));

  console.log(`Looking for branch "${pull_request.head.ref}" in linked branches. Found ${linkedBranch.length} matches`);

  if (linkedBranch.length > 0) {
    console.log(`Branch "${pull_request.head.ref}" is linked to task ${linkedBranch[0].taskId}`);
  } else {
    console.log(`Branch "${pull_request.head.ref}" is not linked to any task`);
  }

  // Find the specific project repository for this PR
  const projectRepo = await db
    .select({
      id: projectRepositories.id,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()))
    .limit(1);

  if (projectRepo.length > 0) {
    console.log(`Found project repository ${projectRepo[0].id} for PR`);

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

    console.log(`PR data to save:`, {
      taskId: prData.taskId,
      projectRepositoryId: prData.projectRepositoryId,
      githubPrNumber: prData.githubPrNumber,
      title: prData.title,
      headBranch: prData.headBranch,
      state: prData.state
    });

    if (action === 'opened' || action === 'synchronize' || action === 'reopened' || action === 'closed' || action === 'merged' || action === 'ready_for_review') {
      console.log(`Processing PR #${pull_request.number} with action: ${action}`);
      try {
        // Check if PR already exists for this repository
        const existingPR = await db
          .select()
          .from(githubPullRequests)
          .where(
            and(
              eq(githubPullRequests.projectRepositoryId, prData.projectRepositoryId),
              eq(githubPullRequests.githubPrNumber, prData.githubPrNumber)
            )
          )
          .limit(1);

        if (existingPR.length > 0) {
          // Update existing PR
          await db
            .update(githubPullRequests)
            .set(prData)
            .where(eq(githubPullRequests.id, existingPR[0].id));
          console.log(`Updated existing PR #${pull_request.number} with state: ${prData.state}`);
        } else {
          // Insert new PR
          await db.insert(githubPullRequests).values(prData);
          console.log(`Created new PR #${pull_request.number} with state: ${prData.state}`);
        }

        // Automatically update linked task status when PR is merged
        if (pull_request.merged && linkedBranch.length > 0) {
          const taskId = linkedBranch[0].taskId;
          console.log(`PR #${pull_request.number} merged, updating linked task ${taskId} status to 'done'`);

          try {
            // Update task status to 'done' and record merge timestamp
            await db
              .update(tasks)
              .set({
                status: 'done',
                updatedAt: new Date()
              })
              .where(eq(tasks.id, taskId));

            console.log(`Successfully updated task ${taskId} status to 'done'`);

            // Record task status update activity
            await db.insert(githubActivities).values({
              projectRepositoryId: prData.projectRepositoryId,
              taskId: taskId,
              activityType: 'task_status_update',
              actorLogin: pull_request.merged_by?.login || 'github',
              title: 'Task completed via PR merge',
              description: `Task automatically marked as done when PR #${pull_request.number} was merged`,
              metadata: {
                prNumber: pull_request.number,
                prTitle: pull_request.title,
                mergedBy: pull_request.merged_by?.login,
                mergedAt: pull_request.merged_at,
                autoStatusUpdate: true
              },
              githubCreatedAt: new Date(),
            });
          } catch (error) {
            console.error(`Failed to update task ${taskId} status:`, error);
          }
        }

        console.log(`Successfully processed PR #${pull_request.number}`);
      } catch (error) {
        console.error(`Error saving PR #${pull_request.number}:`, error);
      }
    } else if (action === 'closed' || action === 'merged') {
      // Handle PR closure/merge separately if not already processed above
      console.log(`Processing PR #${pull_request.number} closure/merge with action: ${action}`);
      try {
        const existingPR = await db
          .select()
          .from(githubPullRequests)
          .where(
            and(
              eq(githubPullRequests.projectRepositoryId, prData.projectRepositoryId),
              eq(githubPullRequests.githubPrNumber, prData.githubPrNumber)
            )
          )
          .limit(1);

        if (existingPR.length > 0) {
          // Update PR state for closure/merge
          await db
            .update(githubPullRequests)
            .set({
              state: prData.state,
              githubUpdatedAt: prData.githubUpdatedAt,
              githubMergedAt: prData.githubMergedAt,
            })
            .where(eq(githubPullRequests.id, existingPR[0].id));
          console.log(`Updated PR #${pull_request.number} state to: ${prData.state}`);

          // Automatically update linked task status when PR is merged (even in 'closed' action)
          if (pull_request.merged && linkedBranch.length > 0) {
            const taskId = linkedBranch[0].taskId;
            console.log(`PR #${pull_request.number} merged (via closed action), updating linked task ${taskId} status to 'done'`);

            try {
              await db
                .update(tasks)
                .set({
                  status: 'done',
                  updatedAt: new Date()
                })
                .where(eq(tasks.id, taskId));

              console.log(`Successfully updated task ${taskId} status to 'done'`);

              // Record task status update activity
              await db.insert(githubActivities).values({
                projectRepositoryId: prData.projectRepositoryId,
                taskId: taskId,
                activityType: 'task_status_update',
                actorLogin: pull_request.merged_by?.login || 'github',
                title: 'Task completed via PR merge',
                description: `Task automatically marked as done when PR #${pull_request.number} was merged`,
                metadata: {
                  prNumber: pull_request.number,
                  prTitle: pull_request.title,
                  mergedBy: pull_request.merged_by?.login,
                  autoStatusUpdate: true
                },
                githubCreatedAt: new Date(),
              });
            } catch (error) {
              console.error(`Failed to update task ${taskId} status:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error updating PR #${pull_request.number} state:`, error);
      }
    } else {
      console.log(`Skipping PR save for action: ${action}`);
    }
  } else {
    console.log('No project repository found for this PR');
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
  console.log(`Processing issue webhook: ${payload.action || 'unknown action'}`);

  // Handle different payload structures for issues vs issue_* events
  const issue = payload.issue || payload;
  const action = payload.action || 'unknown';
  const repository = payload.repository;
  const sender = payload.sender;

  if (!issue || !repository) {
    console.log('Missing issue or repository data in webhook payload');
    return;
  }

  console.log(`Processing issue #${issue.number} with action: ${action} in repo: ${repository.full_name}`);

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  console.log(`Found ${linkedRepos.length} linked repositories for issue webhook`);

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
        state: issue.state,
        labels: issue.labels || [],
      },
      githubCreatedAt: new Date(),
    });
  }

  console.log(`Successfully processed issue #${issue.number} webhook`);
}

// Process issue comment events
async function processIssueCommentEvent(payload: any) {
  const { action, issue, comment, repository, sender } = payload;

  console.log(`Processing issue comment: ${action} on issue #${issue.number} by ${sender.login}`);

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) {
    console.log('No linked repositories found for issue comment');
    return;
  }

  // Find the GitHub issue URL to match with external task links
  const issueUrl = `${repository.html_url}/issues/${issue.number}`;

  // Find linked tasks for this GitHub issue
  const linkedTasks = await db
    .select({
      taskId: externalTaskLinks.taskId,
      taskTitle: tasks.title,
    })
    .from(externalTaskLinks)
    .innerJoin(tasks, eq(externalTaskLinks.taskId, tasks.id))
    .where(and(
      eq(externalTaskLinks.externalUrl, issueUrl),
      eq(externalTaskLinks.linkType, 'github_issue')
    ));

  console.log(`Found ${linkedTasks.length} linked tasks for GitHub issue ${issueUrl}`);

  // Record comment activity and sync to linked tasks
  for (const repo of linkedRepos) {
    // Record the activity
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
        commentBody: comment.body?.substring(0, 200) || '', // Truncate long comments
        syncedToTasks: linkedTasks.length > 0
      },
      githubCreatedAt: new Date(),
    });

    // Sync comment to linked SprintIQ tasks
    for (const linkedTask of linkedTasks) {
      try {
        // Check if this GitHub comment already exists in SprintIQ
        const existingComments = await db
          .select()
          .from(comments)
          .where(and(
            eq(comments.taskId, linkedTask.taskId),
            eq(comments.content, comment.body || ''),
            eq(comments.createdAt, new Date(comment.created_at))
          ))
          .limit(1);

        if (existingComments.length === 0) {
          // Create the comment in SprintIQ
          await db.insert(comments).values({
            taskId: linkedTask.taskId,
            authorId: sender.login, // We'll use GitHub username as author ID for now
            content: comment.body || '',
            createdAt: new Date(comment.created_at)
          });

          console.log(`Synced GitHub comment ${comment.id} to SprintIQ task ${linkedTask.taskId}`);

          // Also record this as task activity
          await db.insert(githubActivities).values({
            projectRepositoryId: repo.id,
            taskId: linkedTask.taskId,
            activityType: 'github_comment_synced',
            actorLogin: sender.login,
            title: 'GitHub comment synced to task',
            description: `Comment from GitHub issue #${issue.number} synced to task`,
            metadata: {
              repository: repository.full_name,
              issueNumber: issue.number,
              commentId: comment.id,
              commentAuthor: sender.login,
              taskTitle: linkedTask.taskTitle
            },
            githubCreatedAt: new Date(),
          });
        } else {
          console.log(`GitHub comment ${comment.id} already exists in SprintIQ task ${linkedTask.taskId}`);
        }
      } catch (error) {
        console.error(`Error syncing comment to task ${linkedTask.taskId}:`, error);
      }
    }
  }

  console.log(`Successfully processed issue comment webhook`);
}

// Process pull request review events
async function processPullRequestReviewEvent(payload: any) {
  const { action, pull_request, review, repository, sender } = payload;

  console.log(`Processing PR review: ${action} - PR #${pull_request.number} - Review state: ${review.state}`);

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) {
    console.log('No linked repositories found for PR review');
    return;
  }

  // Update PR review status if we find a matching PR
  const projectRepo = await db
    .select({ id: projectRepositories.id })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()))
    .limit(1);

  if (projectRepo.length > 0) {
    const existingPR = await db
      .select()
      .from(githubPullRequests)
      .where(
        and(
          eq(githubPullRequests.projectRepositoryId, projectRepo[0].id),
          eq(githubPullRequests.githubPrNumber, pull_request.number)
        )
      )
      .limit(1);

    if (existingPR.length > 0) {
      // Update PR review status based on the review state
      let reviewStatus = 'pending';
      if (review.state === 'APPROVED') {
        reviewStatus = 'approved';
      } else if (review.state === 'CHANGES_REQUESTED') {
        reviewStatus = 'changes_requested';
      } else if (review.state === 'COMMENTED') {
        reviewStatus = 'pending'; // Keep as pending for comments
      }

      await db
        .update(githubPullRequests)
        .set({
          reviewStatus: reviewStatus,
          githubUpdatedAt: new Date(),
        })
        .where(eq(githubPullRequests.id, existingPR[0].id));

      console.log(`Updated PR #${pull_request.number} review status to: ${reviewStatus}`);
    }
  }

  // Record review activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `review_${action}`,
      actorLogin: sender.login,
      title: `PR Review ${review.state.replace('_', ' ').toLowerCase()}`,
      description: review.body?.substring(0, 200) || `Review ${review.state.toLowerCase()}`,
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

  console.log(`Processing check suite: ${action} - Status: ${check_suite.status}, Conclusion: ${check_suite.conclusion} - Branch: ${check_suite.head_branch}`);

  // Find linked project repositories for this repository
  const linkedRepos = await db
    .select({
      id: projectRepositories.id,
      projectId: projectRepositories.projectId,
    })
    .from(projectRepositories)
    .where(eq(projectRepositories.githubRepoId, repository.id.toString()));

  if (linkedRepos.length === 0) {
    console.log('No linked repositories found for check suite');
    return;
  }

  // Update PR checks status if this check suite is for a branch with an open PR
  if (check_suite.head_branch) {
    const projectRepo = await db
      .select({ id: projectRepositories.id })
      .from(projectRepositories)
      .where(eq(projectRepositories.githubRepoId, repository.id.toString()))
      .limit(1);

    if (projectRepo.length > 0) {
      // Find PRs with this branch as head branch
      const prsWithBranch = await db
        .select()
        .from(githubPullRequests)
        .where(
          and(
            eq(githubPullRequests.projectRepositoryId, projectRepo[0].id),
            eq(githubPullRequests.headBranch, check_suite.head_branch),
            eq(githubPullRequests.state, 'open') // Only update open PRs
          )
        );

      for (const pr of prsWithBranch) {
        // Determine checks status based on check suite conclusion
        let checksStatus = 'pending';
        if (check_suite.conclusion === 'success') {
          checksStatus = 'success';
        } else if (check_suite.conclusion === 'failure' || check_suite.conclusion === 'timed_out') {
          checksStatus = 'failure';
        } else if (check_suite.status === 'in_progress' || check_suite.status === 'queued') {
          checksStatus = 'pending';
        }

        await db
          .update(githubPullRequests)
          .set({
            checksStatus: checksStatus,
            githubUpdatedAt: new Date(),
          })
          .where(eq(githubPullRequests.id, pr.id));

        console.log(`Updated PR #${pr.githubPrNumber} checks status to: ${checksStatus} (conclusion: ${check_suite.conclusion})`);
      }
    }
  }

  // Record check suite activity
  for (const repo of linkedRepos) {
    await db.insert(githubActivities).values({
      projectRepositoryId: repo.id,
      activityType: `check_suite_${action}`,
      actorLogin: sender.login,
      title: `CI/CD ${check_suite.conclusion?.replace('_', ' ') || check_suite.status}`,
      description: `Check suite completed with ${check_suite.conclusion || check_suite.status} on branch ${check_suite.head_branch}`,
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
