import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import {
  tasks,
  githubActivities,
  externalTaskLinks,
  projectRepositories,
  githubIntegrations,
  projects,
  comments
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GitHubService } from '@/lib/github';

// Helper function to get project repository ID from issue URL
async function getProjectRepositoryId(issueUrl: string): Promise<string | null> {
  try {
    const urlMatch = issueUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
    if (!urlMatch) return null;

    const [, owner, repo] = urlMatch;
    const fullName = `${owner}/${repo}`;

    const repoResult = await db
      .select({ id: projectRepositories.id })
      .from(projectRepositories)
      .where(eq(projectRepositories.repositoryFullName, fullName))
      .limit(1);

    return repoResult.length > 0 ? repoResult[0].id : null;
  } catch (error) {
    console.error('Error getting project repository ID:', error);
    return null;
  }
}

// Sync comments from GitHub issue to SprintIQ task
export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth();
    const { taskId, syncToGitHub = false, commentText } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Get task and its GitHub links
    const taskWithLinks = await db
      .select({
        taskId: tasks.id,
        taskTitle: tasks.title,
        projectId: tasks.projectId,
        workspaceId: projects.workspaceId,
        externalUrl: externalTaskLinks.externalUrl,
        linkType: externalTaskLinks.linkType
      })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(externalTaskLinks, eq(externalTaskLinks.taskId, tasks.id))
      .where(and(
        eq(tasks.id, taskId),
        eq(externalTaskLinks.linkType, 'github_issue')
      ))
      .limit(1);

    if (!taskWithLinks.length) {
      return NextResponse.json({ 
        error: 'Task not found or not linked to GitHub issue' 
      }, { status: 404 });
    }

    const task = taskWithLinks[0];
    
    if (!task.externalUrl) {
      return NextResponse.json({ 
        error: 'Task is not linked to a GitHub issue' 
      }, { status: 400 });
    }

    // Parse GitHub issue URL to get owner, repo, and issue number
    const urlParts = task.externalUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
    if (!urlParts) {
      return NextResponse.json({ 
        error: 'Invalid GitHub issue URL format' 
      }, { status: 400 });
    }

    const [, owner, repo, issueNumber] = urlParts;

    // Get GitHub integration
    const githubIntegration = await db
      .select({ accessToken: githubIntegrations.accessToken })
      .from(githubIntegrations)
      .where(eq(githubIntegrations.workspaceId, task.workspaceId))
      .limit(1);

    if (!githubIntegration.length) {
      return NextResponse.json({ 
        error: 'GitHub integration not found' 
      }, { status: 404 });
    }

    const githubService = new GitHubService(githubIntegration[0].accessToken);

    if (syncToGitHub && commentText) {
      // Sync SprintIQ comment TO GitHub
      try {
        const response = await githubService.createIssueComment(owner, repo, parseInt(issueNumber), commentText);
        
        // Create the comment in SprintIQ as well
        await db.insert(comments).values({
          taskId: taskId,
          authorId: profile.id,
          content: commentText
        });

        // Record the sync activity
        const projectRepositoryId = await getProjectRepositoryId(task.externalUrl);
        if (projectRepositoryId) {
          await db.insert(githubActivities).values({
            projectRepositoryId,
          taskId: taskId,
          activityType: 'github_comment_posted',
          actorLogin: profile.id,
          title: 'Comment posted to GitHub',
          description: 'Comment synced from SprintIQ to GitHub issue',
          metadata: {
            githubCommentId: response.data.id,
            githubUrl: response.data.html_url,
            issueNumber: issueNumber,
            repository: `${owner}/${repo}`
          },
          githubCreatedAt: new Date()
          });
        } else {
          console.warn('Could not find project repository ID for task, skipping activity recording');
        }

        return NextResponse.json({
          success: true,
          message: 'Comment synced to GitHub and saved locally',
          githubCommentId: response.data.id,
          githubUrl: response.data.html_url
        });

      } catch (error) {
        console.error('Error syncing comment to GitHub:', error);
        return NextResponse.json({ 
          error: 'Failed to sync comment to GitHub' 
        }, { status: 500 });
      }
    } else {
      // Sync comments FROM GitHub to SprintIQ
      try {
        const githubComments = await githubService.getIssueComments(owner, repo, parseInt(issueNumber));
        
        // Get existing comments to avoid duplicates (check by content and creation time)
        const existingComments = await db
          .select({
            content: comments.content,
            createdAt: comments.createdAt
          })
          .from(comments)
          .where(eq(comments.taskId, taskId));

        const existingCommentMap = new Map();
        existingComments.forEach(comment => {
          if (comment.createdAt) {
            const key = `${comment.content}-${comment.createdAt.getTime()}`;
            existingCommentMap.set(key, true);
          }
        });

        const newComments = githubComments.data.filter(comment => {
          const key = `${comment.body}-${new Date(comment.created_at).getTime()}`;
          return !existingCommentMap.has(key);
        });

        // Insert new comments from GitHub
        for (const comment of newComments) {
          await db.insert(comments).values({
            taskId: taskId,
            authorId: comment.user?.login || 'github-user',
            content: comment.body || '',
            createdAt: new Date(comment.created_at)
          });
        }

        // Record sync activity
        if (newComments.length > 0) {
          const projectRepositoryId = await getProjectRepositoryId(task.externalUrl);
          if (projectRepositoryId) {
            await db.insert(githubActivities).values({
              projectRepositoryId,
            taskId: taskId,
            activityType: 'github_comments_synced',
            actorLogin: 'system',
            title: 'GitHub comments synced',
            description: `Synced ${newComments.length} new comments from GitHub issue #${issueNumber}`,
            metadata: {
              issueNumber: issueNumber,
              repository: `${owner}/${repo}`,
              syncedCommentsCount: newComments.length,
              totalGithubComments: githubComments.data.length
            },
            githubCreatedAt: new Date()
            });
          } else {
            console.warn('Could not find project repository ID for task, skipping sync activity recording');
          }
        }

        return NextResponse.json({
          success: true,
          message: `Synced ${newComments.length} new comments from GitHub`,
          newCommentsCount: newComments.length,
          totalGithubComments: githubComments.data.length
        });

      } catch (error) {
        console.error('Error syncing comments from GitHub:', error);
        return NextResponse.json({ 
          error: 'Failed to sync comments from GitHub' 
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error in comment sync:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
