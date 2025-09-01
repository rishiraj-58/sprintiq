import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { 
  tasks, 
  githubPullRequests, 
  projectRepositories, 
  projects,
  githubActivities
} from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const profile = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const timeframe = searchParams.get('timeframe') || '30'; // days
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(timeframe));

    // Get completed tasks with their GitHub activities in the timeframe
    const completedTasks = await db
      .select({
        taskId: tasks.id,
        taskTitle: tasks.title,
        taskStatus: tasks.status,
        taskCreatedAt: tasks.createdAt,
        taskUpdatedAt: tasks.updatedAt,
        taskCompletedAt: tasks.completedAt,
        prNumber: githubPullRequests.githubPrNumber,
        prCreatedAt: githubPullRequests.githubCreatedAt,
        prMergedAt: githubPullRequests.githubMergedAt,
        prState: githubPullRequests.state
      })
      .from(tasks)
      .leftJoin(githubPullRequests, eq(tasks.id, githubPullRequests.taskId))
      .leftJoin(projectRepositories, eq(githubPullRequests.projectRepositoryId, projectRepositories.id))
      .where(and(
        eq(tasks.projectId, projectId),
        eq(tasks.status, 'done'),
        gte(tasks.updatedAt, daysAgo)
      ))
      .orderBy(tasks.updatedAt);

    // Calculate metrics
    const metrics = {
      totalCompletedTasks: completedTasks.length,
      tasksWithPRs: 0,
      averageCycleTime: 0, // Time from task creation to completion
      averageTimeToMerge: 0, // Time from PR creation to merge
      averageTaskToMerge: 0, // Time from task creation to PR merge
      cycleTimeData: [] as any[],
      timeToMergeData: [] as any[],
      distributionBuckets: {
        cycleTime: {
          '< 1 day': 0,
          '1-3 days': 0,
          '3-7 days': 0,
          '1-2 weeks': 0,
          '> 2 weeks': 0
        },
        timeToMerge: {
          '< 1 hour': 0,
          '1-6 hours': 0,
          '6-24 hours': 0,
          '1-3 days': 0,
          '> 3 days': 0
        }
      }
    };

    let totalCycleTime = 0;
    let totalTimeToMerge = 0;
    let totalTaskToMerge = 0;
    let tasksWithValidCycleTime = 0;
    let tasksWithValidTimeToMerge = 0;
    let tasksWithValidTaskToMerge = 0;

    completedTasks.forEach(task => {
      // Calculate cycle time (task creation to completion)
      if (task.taskCreatedAt && task.taskUpdatedAt) {
        const cycleTimeMs = new Date(task.taskUpdatedAt).getTime() - new Date(task.taskCreatedAt).getTime();
        const cycleTimeDays = cycleTimeMs / (1000 * 60 * 60 * 24);
        
        totalCycleTime += cycleTimeDays;
        tasksWithValidCycleTime++;
        
        metrics.cycleTimeData.push({
          taskId: task.taskId,
          taskTitle: task.taskTitle,
          cycleTimeDays: parseFloat(cycleTimeDays.toFixed(2)),
          createdAt: task.taskCreatedAt,
          completedAt: task.taskUpdatedAt
        });

        // Categorize cycle time
        if (cycleTimeDays < 1) {
          metrics.distributionBuckets.cycleTime['< 1 day']++;
        } else if (cycleTimeDays <= 3) {
          metrics.distributionBuckets.cycleTime['1-3 days']++;
        } else if (cycleTimeDays <= 7) {
          metrics.distributionBuckets.cycleTime['3-7 days']++;
        } else if (cycleTimeDays <= 14) {
          metrics.distributionBuckets.cycleTime['1-2 weeks']++;
        } else {
          metrics.distributionBuckets.cycleTime['> 2 weeks']++;
        }
      }

      // Calculate time to merge (PR creation to merge)
      if (task.prCreatedAt && task.prMergedAt && task.prState === 'merged') {
        metrics.tasksWithPRs++;
        
        const timeToMergeMs = new Date(task.prMergedAt).getTime() - new Date(task.prCreatedAt).getTime();
        const timeToMergeHours = timeToMergeMs / (1000 * 60 * 60);
        const timeToMergeDays = timeToMergeHours / 24;
        
        totalTimeToMerge += timeToMergeDays;
        tasksWithValidTimeToMerge++;
        
        metrics.timeToMergeData.push({
          taskId: task.taskId,
          taskTitle: task.taskTitle,
          prNumber: task.prNumber,
          timeToMergeHours: parseFloat(timeToMergeHours.toFixed(2)),
          timeToMergeDays: parseFloat(timeToMergeDays.toFixed(2)),
          prCreatedAt: task.prCreatedAt,
          prMergedAt: task.prMergedAt
        });

        // Categorize time to merge
        if (timeToMergeHours < 1) {
          metrics.distributionBuckets.timeToMerge['< 1 hour']++;
        } else if (timeToMergeHours <= 6) {
          metrics.distributionBuckets.timeToMerge['1-6 hours']++;
        } else if (timeToMergeHours <= 24) {
          metrics.distributionBuckets.timeToMerge['6-24 hours']++;
        } else if (timeToMergeDays <= 3) {
          metrics.distributionBuckets.timeToMerge['1-3 days']++;
        } else {
          metrics.distributionBuckets.timeToMerge['> 3 days']++;
        }

        // Calculate task creation to merge time
        if (task.taskCreatedAt) {
          const taskToMergeMs = new Date(task.prMergedAt).getTime() - new Date(task.taskCreatedAt).getTime();
          const taskToMergeDays = taskToMergeMs / (1000 * 60 * 60 * 24);
          
          totalTaskToMerge += taskToMergeDays;
          tasksWithValidTaskToMerge++;
        }
      }
    });

    // Calculate averages
    if (tasksWithValidCycleTime > 0) {
      metrics.averageCycleTime = parseFloat((totalCycleTime / tasksWithValidCycleTime).toFixed(2));
    }
    
    if (tasksWithValidTimeToMerge > 0) {
      metrics.averageTimeToMerge = parseFloat((totalTimeToMerge / tasksWithValidTimeToMerge).toFixed(2));
    }
    
    if (tasksWithValidTaskToMerge > 0) {
      metrics.averageTaskToMerge = parseFloat((totalTaskToMerge / tasksWithValidTaskToMerge).toFixed(2));
    }

    // Add additional insights
    const insights = {
      efficiency: {
        tasksWithPRsPercentage: metrics.totalCompletedTasks > 0 ? 
          parseFloat(((metrics.tasksWithPRs / metrics.totalCompletedTasks) * 100).toFixed(1)) : 0,
        fastCycleTimePercentage: tasksWithValidCycleTime > 0 ?
          parseFloat((((metrics.distributionBuckets.cycleTime['< 1 day'] + metrics.distributionBuckets.cycleTime['1-3 days']) / tasksWithValidCycleTime) * 100).toFixed(1)) : 0,
        fastMergePercentage: tasksWithValidTimeToMerge > 0 ?
          parseFloat((((metrics.distributionBuckets.timeToMerge['< 1 hour'] + metrics.distributionBuckets.timeToMerge['1-6 hours']) / tasksWithValidTimeToMerge) * 100).toFixed(1)) : 0
      },
      trends: {
        // Could add week-over-week comparisons here
        timeframeDays: parseInt(timeframe),
        dataQuality: {
          tasksWithCycleTime: tasksWithValidCycleTime,
          tasksWithTimeToMerge: tasksWithValidTimeToMerge,
          completionRate: metrics.totalCompletedTasks > 0 ? 100 : 0
        }
      }
    };

    return NextResponse.json({
      metrics,
      insights,
      metadata: {
        projectId,
        timeframeDays: parseInt(timeframe),
        generatedAt: new Date().toISOString(),
        dataPoints: {
          totalTasks: metrics.totalCompletedTasks,
          tasksWithPRs: metrics.tasksWithPRs,
          validCycleTimeData: tasksWithValidCycleTime,
          validMergeTimeData: tasksWithValidTimeToMerge
        }
      }
    });

  } catch (error) {
    console.error('Error calculating cycle time metrics:', error);
    return NextResponse.json({ 
      error: 'Failed to calculate metrics' 
    }, { status: 500 });
  }
}

