'use client';

import Link from 'next/link';
import { type Task } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTask } from '@/stores/hooks/useTask';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/ui/use-toast';

interface TaskCardProps {
  task: Task;
  assignee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  onEdit?: (task: Task) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

export function TaskCard({ task, assignee, onEdit, selectMode = false, selected = false, onToggleSelect }: TaskCardProps) {
  const { updateTask, deleteTask } = useTask();
  const { currentWorkspace } = useWorkspace();
  const { canEdit, canDelete } = usePermissions('workspace', currentWorkspace?.id);
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'done':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateTask(task.id, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Task status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    }
  };

  const CardInner = (
      <Card className={`hover:shadow-md transition-shadow ${selectMode ? 'cursor-default' : 'cursor-pointer'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-medium line-clamp-2">
              {task.title}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && canEdit && (
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onEdit(task); }}>
                    Edit
                  </DropdownMenuItem>
                )}
                {canEdit && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleStatusChange('todo'); }}>
                      Move to To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleStatusChange('in_progress'); }}>
                      Move to In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleStatusChange('done'); }}>
                      Move to Done
                    </DropdownMenuItem>
                  </>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleDelete(); }} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      <CardContent className="pt-0">
        {selectMode && (
          <div className="mb-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleSelect && onToggleSelect(task.id)}
              />
              Select
            </label>
          </div>
        )}
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
              {task.priority}
            </Badge>
            <Badge variant={getStatusColor(task.status)} className="text-xs">
              {task.status === 'todo' ? 'To Do' : 
               task.status === 'in_progress' ? 'In Progress' : 
               'Done'}
            </Badge>
          </div>
          
          {assignee ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={assignee.avatarUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {assignee.firstName?.[0]}{assignee.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {assignee.firstName} {assignee.lastName}
              </span>
            </div>
          ) : task.assigneeId ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          ) : null}
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          Created {new Date(task.createdAt || '').toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  if (selectMode) {
    return (
      <div onClick={() => onToggleSelect && onToggleSelect(task.id)}>
        {CardInner}
      </div>
    );
  }

  return (
    <Link href={`/tasks/${task.id}`} className="block">
      {CardInner}
    </Link>
  );
}