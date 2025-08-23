import { db } from '../src/db/index.ts';
import { githubPullRequests, tasks } from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

async function checkPRState() {
  try {
    console.log('Checking PR state in database...');

    // Find the specific PR
    const prs = await db
      .select({
        id: githubPullRequests.id,
        taskId: githubPullRequests.taskId,
        githubPrNumber: githubPullRequests.githubPrNumber,
        title: githubPullRequests.title,
        state: githubPullRequests.state,
        headBranch: githubPullRequests.headBranch,
        projectRepositoryId: githubPullRequests.projectRepositoryId,
        githubCreatedAt: githubPullRequests.githubCreatedAt,
        githubUpdatedAt: githubPullRequests.githubUpdatedAt,
        githubMergedAt: githubPullRequests.githubMergedAt,
      })
      .from(githubPullRequests)
      .where(eq(githubPullRequests.githubPrNumber, 2));

    console.log(`Found ${prs.length} PRs with number 2:`);
    prs.forEach(pr => {
      console.log(`  PR ID: ${pr.id}`);
      console.log(`  Task ID: ${pr.taskId}`);
      console.log(`  Title: ${pr.title}`);
      console.log(`  State: ${pr.state}`);
      console.log(`  Head Branch: ${pr.headBranch}`);
      console.log(`  Project Repo ID: ${pr.projectRepositoryId}`);
      console.log(`  Created: ${pr.githubCreatedAt}`);
      console.log(`  Updated: ${pr.githubUpdatedAt}`);
      console.log(`  Merged: ${pr.githubMergedAt}`);
      console.log('---');
    });

    // Check if there's a specific task
    const taskId = 'c8591ab3-30d2-4095-9ef5-2808d806c607';
    const taskPRs = await db
      .select({
        id: githubPullRequests.id,
        githubPrNumber: githubPullRequests.githubPrNumber,
        title: githubPullRequests.title,
        state: githubPullRequests.state,
        headBranch: githubPullRequests.headBranch,
      })
      .from(githubPullRequests)
      .where(eq(githubPullRequests.taskId, taskId));

    console.log(`\nFound ${taskPRs.length} PRs for task ${taskId}:`);
    taskPRs.forEach(pr => {
      console.log(`  PR #${pr.githubPrNumber}: "${pr.title}" - State: ${pr.state} - Head: ${pr.headBranch}`);
    });

  } catch (error) {
    console.error('Error checking PR state:', error);
  }
}

checkPRState();
