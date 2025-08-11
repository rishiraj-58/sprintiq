'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Bug, Calendar, Target } from 'lucide-react';

interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

interface Task {
  id: string;
  status: string;
  storyPoints?: number;
  createdAt: string;
  type?: string;
}

interface KeyMetricsProps {
  activeSprint?: Sprint;
  tasks: Task[];
}

export function KeyMetrics({ activeSprint, tasks }: KeyMetricsProps) {
  // Calculate metrics
  const sprintTasks = tasks.filter(task => task.status !== 'backlog');
  const completedTasks = sprintTasks.filter(task => task.status === 'done');
  const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  const completedStoryPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
  const sprintProgress = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;

  // Calculate bugs created in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentBugs = tasks.filter(task => 
    task.type === 'bug' && new Date(task.createdAt) > sevenDaysAgo
  ).length;

  // Calculate days remaining in sprint
  const daysRemaining = activeSprint ? Math.max(0, Math.ceil(
    (new Date(activeSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )) : 0;

  const metrics = [
    {
      title: 'Sprint Progress',
      value: `${Math.round(sprintProgress)}%`,
      description: `${completedStoryPoints} of ${totalStoryPoints} points`,
      icon: Target,
      color: 'text-blue-600',
      progress: sprintProgress
    },
    {
      title: 'Tasks Completed',
      value: completedTasks.length.toString(),
      description: `${completedTasks.length} of ${sprintTasks.length} tasks`,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'New Bugs (7d)',
      value: recentBugs.toString(),
      description: 'Bugs reported this week',
      icon: Bug,
      color: recentBugs > 5 ? 'text-red-600' : 'text-orange-600'
    },
    {
      title: 'Days Remaining',
      value: daysRemaining.toString(),
      description: activeSprint ? `Until ${activeSprint.name} ends` : 'No active sprint',
      icon: Calendar,
      color: daysRemaining < 3 ? 'text-red-600' : 'text-slate-600'
    }
  ];

  return (
    <div className="grid gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              {metric.progress !== undefined && (
                <Progress value={metric.progress} className="mt-2 h-2" />
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
