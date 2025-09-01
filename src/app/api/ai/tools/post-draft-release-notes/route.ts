import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { tasks, githubPullRequests, projects, projectRepositories } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const profile = await requireAuth();
    const { projectId, sprintId, dateRange } = await request.json();

    if (!projectId && !sprintId && !dateRange) {
      return NextResponse.json({ 
        error: 'Either projectId, sprintId, or dateRange is required' 
      }, { status: 400 });
    }

    let whereCondition;
    let timeframe = '';

    if (sprintId) {
      // TODO: Implement sprint-based filtering when sprint schema is available
      whereCondition = eq(tasks.sprintId, sprintId);
      timeframe = `Sprint ${sprintId}`;
    } else if (dateRange) {
      const { startDate, endDate } = dateRange;
      whereCondition = and(
        gte(tasks.updatedAt, new Date(startDate)),
        sql`${tasks.updatedAt} <= ${new Date(endDate)}`
      );
      timeframe = `${startDate} to ${endDate}`;
    } else {
      // Default to last 2 weeks for the project
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      whereCondition = and(
        eq(tasks.projectId, projectId),
        gte(tasks.updatedAt, twoWeeksAgo)
      );
      timeframe = 'Last 2 weeks';
    }

    // Get completed tasks with their linked merged PRs
    const completedTasks = await db
      .select({
        taskId: tasks.id,
        taskTitle: tasks.title,
        taskDescription: tasks.description,
        taskStatus: tasks.status,
        taskType: tasks.type,
        taskPriority: tasks.priority,
        taskUpdatedAt: tasks.updatedAt,
        prNumber: githubPullRequests.githubPrNumber,
        prTitle: githubPullRequests.title,
        prState: githubPullRequests.state,
        prMergedAt: githubPullRequests.githubMergedAt,
        repositoryName: projectRepositories.repositoryName,
        projectName: projects.name
      })
      .from(tasks)
      .leftJoin(githubPullRequests, eq(tasks.id, githubPullRequests.taskId))
      .leftJoin(projectRepositories, eq(githubPullRequests.projectRepositoryId, projectRepositories.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(
        whereCondition,
        eq(tasks.status, 'done')
      ))
      .orderBy(tasks.updatedAt);

    if (!completedTasks.length) {
      return NextResponse.json({
        releaseNotes: `# Release Notes - ${timeframe}\n\nNo completed tasks found for this period.`,
        summary: 'No completed tasks found',
        taskCount: 0,
        prCount: 0
      });
    }

    // Group tasks by type and priority
    const tasksByType: {
      feature: any[];
      bug: any[];
      improvement: any[];
      chore: any[];
      other: any[];
      [key: string]: any[];
    } = {
      feature: [],
      bug: [],
      improvement: [],
      chore: [],
      other: []
    };

    const mergedPRs: any[] = [];
    const tasksWithoutPRs: any[] = [];

    completedTasks.forEach(task => {
      const taskType = task.taskType?.toLowerCase() || 'other';
      const category = tasksByType[taskType] ? taskType : 'other';
      
      const taskInfo = {
        id: task.taskId,
        title: task.taskTitle,
        description: task.taskDescription,
        priority: task.taskPriority,
        prNumber: task.prNumber,
        prTitle: task.prTitle,
        repository: task.repositoryName,
        mergedAt: task.prMergedAt
      };

      tasksByType[category].push(taskInfo);

      if (task.prNumber && task.prMergedAt) {
        mergedPRs.push(taskInfo);
      } else {
        tasksWithoutPRs.push(taskInfo);
      }
    });

    // Generate structured release notes
    const projectName = completedTasks[0]?.projectName || 'Project';
    
    let releaseNotes = `# ${projectName} Release Notes - ${timeframe}\n\n`;
    releaseNotes += `## Summary\n\n`;
    releaseNotes += `This release includes ${completedTasks.length} completed tasks`;
    if (mergedPRs.length > 0) {
      releaseNotes += ` with ${mergedPRs.length} merged pull requests`;
    }
    releaseNotes += `.\n\n`;

    // Features
    if (tasksByType.feature.length > 0) {
      releaseNotes += `## 🚀 New Features\n\n`;
      tasksByType.feature.forEach(task => {
        releaseNotes += `- **${task.title}**`;
        if (task.prNumber) {
          releaseNotes += ` ([#${task.prNumber}](${task.repository}))`;
        }
        releaseNotes += `\n`;
        if (task.description) {
          releaseNotes += `  ${task.description}\n`;
        }
      });
      releaseNotes += `\n`;
    }

    // Bug fixes
    if (tasksByType.bug.length > 0) {
      releaseNotes += `## 🐛 Bug Fixes\n\n`;
      tasksByType.bug.forEach(task => {
        releaseNotes += `- **${task.title}**`;
        if (task.prNumber) {
          releaseNotes += ` ([#${task.prNumber}](${task.repository}))`;
        }
        releaseNotes += `\n`;
        if (task.description) {
          releaseNotes += `  ${task.description}\n`;
        }
      });
      releaseNotes += `\n`;
    }

    // Improvements
    if (tasksByType.improvement.length > 0) {
      releaseNotes += `## ✨ Improvements\n\n`;
      tasksByType.improvement.forEach(task => {
        releaseNotes += `- **${task.title}**`;
        if (task.prNumber) {
          releaseNotes += ` ([#${task.prNumber}](${task.repository}))`;
        }
        releaseNotes += `\n`;
        if (task.description) {
          releaseNotes += `  ${task.description}\n`;
        }
      });
      releaseNotes += `\n`;
    }

    // Other changes
    const otherTasks = [...tasksByType.chore, ...tasksByType.other];
    if (otherTasks.length > 0) {
      releaseNotes += `## 🔧 Other Changes\n\n`;
      otherTasks.forEach(task => {
        releaseNotes += `- **${task.title}**`;
        if (task.prNumber) {
          releaseNotes += ` ([#${task.prNumber}](${task.repository}))`;
        }
        releaseNotes += `\n`;
      });
      releaseNotes += `\n`;
    }

    // Add metadata
    releaseNotes += `---\n\n`;
    releaseNotes += `**Release Statistics:**\n`;
    releaseNotes += `- Total completed tasks: ${completedTasks.length}\n`;
    releaseNotes += `- Merged pull requests: ${mergedPRs.length}\n`;
    releaseNotes += `- Features: ${tasksByType.feature.length}\n`;
    releaseNotes += `- Bug fixes: ${tasksByType.bug.length}\n`;
    releaseNotes += `- Improvements: ${tasksByType.improvement.length}\n`;
    releaseNotes += `- Other changes: ${otherTasks.length}\n`;

    return NextResponse.json({
      releaseNotes,
      summary: `Generated release notes for ${completedTasks.length} completed tasks`,
      taskCount: completedTasks.length,
      prCount: mergedPRs.length,
      breakdown: {
        features: tasksByType.feature.length,
        bugFixes: tasksByType.bug.length,
        improvements: tasksByType.improvement.length,
        other: otherTasks.length
      },
      timeframe
    });

  } catch (error) {
    console.error('Error generating release notes:', error);
    return NextResponse.json({ error: 'Failed to generate release notes' }, { status: 500 });
  }
}
