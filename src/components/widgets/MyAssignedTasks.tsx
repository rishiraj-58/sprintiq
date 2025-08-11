'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  projectId: string;
}

interface MyAssignedTasksProps {
  tasks: Task[];
  userId?: string;
}

// Static data for demo
const staticTasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Implement user authentication flow',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-01-20',
    projectId: 'proj-1'
  },
  {
    id: 'TASK-002',
    title: 'Design dashboard mockups',
    status: 'to-do',
    priority: 'medium',
    dueDate: '2024-01-22',
    projectId: 'proj-1'
  },
  {
    id: 'TASK-003',
    title: 'Review pull request #47',
    status: 'to-do',
    priority: 'low',
    projectId: 'proj-1'
  },
  {
    id: 'TASK-004',
    title: 'Update API documentation',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2024-01-18',
    projectId: 'proj-1'
  }
];

const statusIcons = {
  'to-do': Clock,
  'in-progress': AlertTriangle,
  'done': CheckCircle,
  'blocked': AlertTriangle
};

const statusColors = {
  'to-do': 'text-slate-500',
  'in-progress': 'text-blue-600',
  'done': 'text-green-600',
  'blocked': 'text-red-600'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
};

export function MyAssignedTasks({ tasks = staticTasks }: MyAssignedTasksProps) {
  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Due today';
    if (diffInDays === 1) return 'Due tomorrow';
    if (diffInDays < 0) return `Overdue by ${Math.abs(diffInDays)} day(s)`;
    return `Due in ${diffInDays} day(s)`;
  };

  // Filter out completed tasks and limit to 5 most important
  const activeTasks = tasks
    .filter(task => task.status !== 'done')
    .sort((a, b) => {
      // Sort by: overdue first, then by priority, then by due date
      const aOverdue = isOverdue(a.dueDate);
      const bOverdue = isOverdue(b.dueDate);
      
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      return 0;
    })
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Assigned Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTasks.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground">No pending tasks assigned to you.</p>
          </div>
        ) : (
          <>
            {activeTasks.map((task) => {
              const StatusIcon = statusIcons[task.status as keyof typeof statusIcons];
              const statusColor = statusColors[task.status as keyof typeof statusColors];
              const overdue = isOverdue(task.dueDate);
              
              return (
                <div key={task.id} className="space-y-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1">
                      <StatusIcon className={`h-4 w-4 mt-0.5 ${statusColor}`} />
                      <div className="flex-1 min-w-0">
                        <Link 
                          href={`/tasks/${task.id}`}
                          className="text-sm font-medium hover:underline line-clamp-2"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${priorityColors[task.priority]}`}
                          >
                            {task.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {task.dueDate && (
                    <div className={`text-xs ${overdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDueDate(task.dueDate)}
                    </div>
                  )}
                </div>
              );
            })}
            
            <div className="pt-2 border-t">
              <Link href={`/projects/${tasks[0]?.projectId}/tasks`}>
                <Button variant="ghost" size="sm" className="w-full text-xs">
                  View All Tasks
                </Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
