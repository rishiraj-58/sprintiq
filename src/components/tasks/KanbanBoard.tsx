'use client';

import { useEffect } from 'react';
import { useTask } from '@/stores/hooks/useTask';
import { TaskCard } from './TaskCard';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, isLoading, error, fetchTasks } = useTask();

  useEffect(() => {
    if (projectId) {
      fetchTasks(projectId);
    }
  }, [projectId, fetchTasks]);

  const todoTasks = tasks.filter(task => task.status === 'todo');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const doneTasks = tasks.filter(task => task.status === 'done');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error loading tasks</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const columns = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: todoTasks,
      color: 'secondary' as const,
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      tasks: inProgressTasks,
      color: 'default' as const,
    },
    {
      id: 'done',
      title: 'Done',
      tasks: doneTasks,
      color: 'outline' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          {/* Column Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{column.title}</h3>
            <Badge variant={column.color} className="text-xs">
              {column.tasks.length}
            </Badge>
          </div>

          {/* Column Content */}
          <div className="space-y-3 min-h-[200px]">
            {column.tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            ) : (
              column.tasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  assignee={task.assignee} 
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}