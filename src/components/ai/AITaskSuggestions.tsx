'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, Sparkles, Clock, User, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  assigneeId?: string | null;
  storyPoints?: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
}

interface AITaskSuggestionsProps {
  task: Task;
  projectId: string;
  onActionTaken?: (action: string, taskId: string) => void;
}

interface Suggestion {
  id: string;
  type: 'stalled' | 'estimate' | 'overdue' | 'unassigned' | 'priority' | 'comment';
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  severity: 'low' | 'medium' | 'high';
}

export function AITaskSuggestions({ task, projectId, onActionTaken }: AITaskSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [task]);

  const generateSuggestions = () => {
    const newSuggestions: Suggestion[] = [];
    const now = new Date();
    const daysSinceUpdate = task.updatedAt ? Math.floor((now.getTime() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysSinceCreation = task.createdAt ? Math.floor((now.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Task has been stalled (no updates for 7+ days and not completed)
    if (daysSinceUpdate >= 7 && task.status !== 'done' && task.status !== 'completed') {
      newSuggestions.push({
        id: 'stalled',
        type: 'stalled',
        icon: Clock,
        title: 'Task seems stalled',
        description: `No updates for ${daysSinceUpdate} days. Consider reaching out to the assignee or breaking this down.`,
        action: task.assigneeId ? {
          label: 'Ping Assignee',
          onClick: () => handlePingAssignee(task.id, task.assigneeId!)
        } : {
          label: 'Assign Task',
          onClick: () => handleAssignTask(task.id)
        },
        severity: daysSinceUpdate >= 14 ? 'high' : 'medium'
      });
    }

    // Task without story points estimation
    if (!task.storyPoints && task.status === 'todo') {
      const suggestedPoints = estimateStoryPoints(task.title);
      newSuggestions.push({
        id: 'estimate',
        type: 'estimate',
        icon: Lightbulb,
        title: 'Missing story points',
        description: `Consider adding ${suggestedPoints} story points based on the task complexity.`,
        action: {
          label: `Add ${suggestedPoints} pts`,
          onClick: () => handleAddStoryPoints(task.id, suggestedPoints)
        },
        severity: 'low'
      });
    }

    // Overdue task
    if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'done') {
      const daysOverdue = Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      newSuggestions.push({
        id: 'overdue',
        type: 'overdue',
        icon: Clock,
        title: 'Task is overdue',
        description: `${daysOverdue} days past due date. Consider updating the timeline or priority.`,
        action: {
          label: 'Update Due Date',
          onClick: () => handleUpdateDueDate(task.id)
        },
        severity: 'high'
      });
    }

    // Unassigned high priority task
    if (!task.assigneeId && task.priority === 'high') {
      newSuggestions.push({
        id: 'unassigned',
        type: 'unassigned',
        icon: User,
        title: 'High priority task unassigned',
        description: 'This important task needs an owner to ensure it gets completed.',
        action: {
          label: 'Assign Task',
          onClick: () => handleAssignTask(task.id)
        },
        severity: 'medium'
      });
    }

    // Old task without recent activity
    if (daysSinceCreation >= 30 && task.status === 'todo') {
      newSuggestions.push({
        id: 'old-task',
        type: 'priority',
        icon: Sparkles,
        title: 'Old task in backlog',
        description: 'This task has been in the backlog for over a month. Is it still relevant?',
        action: {
          label: 'Review Priority',
          onClick: () => handleReviewPriority(task.id)
        },
        severity: 'low'
      });
    }

    setSuggestions(newSuggestions);
  };

  const estimateStoryPoints = (title: string): number => {
    const complexityKeywords = {
      simple: ['fix', 'update', 'change', 'modify', 'adjust'],
      medium: ['implement', 'create', 'add', 'build', 'develop'],
      complex: ['integrate', 'refactor', 'optimize', 'design', 'architecture']
    };

    const lowerTitle = title.toLowerCase();
    
    if (complexityKeywords.complex.some(keyword => lowerTitle.includes(keyword))) {
      return 8;
    } else if (complexityKeywords.medium.some(keyword => lowerTitle.includes(keyword))) {
      return 3;
    } else {
      return 1;
    }
  };

  const handlePingAssignee = async (taskId: string, assigneeId: string) => {
    // This would integrate with notification system
    console.log('Pinging assignee:', { taskId, assigneeId });
    onActionTaken?.('ping_assignee', taskId);
    setIsOpen(false);
  };

  const handleAssignTask = (taskId: string) => {
    // This would open assignment modal
    console.log('Assigning task:', taskId);
    onActionTaken?.('assign_task', taskId);
    setIsOpen(false);
  };

  const handleAddStoryPoints = async (taskId: string, points: number) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyPoints: points })
      });
      onActionTaken?.('add_story_points', taskId);
      setIsOpen(false);
      // Refresh suggestions after update
      setTimeout(generateSuggestions, 1000);
    } catch (error) {
      console.error('Failed to update story points:', error);
    }
  };

  const handleUpdateDueDate = (taskId: string) => {
    // This would open date picker modal
    console.log('Updating due date:', taskId);
    onActionTaken?.('update_due_date', taskId);
    setIsOpen(false);
  };

  const handleReviewPriority = (taskId: string) => {
    // This would open priority review modal
    console.log('Reviewing priority:', taskId);
    onActionTaken?.('review_priority', taskId);
    setIsOpen(false);
  };

  if (suggestions.length === 0) {
    return null;
  }

  const highestSeverity = suggestions.reduce((max, suggestion) => {
    const severityOrder = { low: 1, medium: 2, high: 3 };
    return severityOrder[suggestion.severity] > severityOrder[max] ? suggestion.severity : max;
  }, 'low' as 'low' | 'medium' | 'high');

  const getIconColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high': return 'text-red-500 hover:text-red-600';
      case 'medium': return 'text-amber-500 hover:text-amber-600';
      case 'low': return 'text-blue-500 hover:text-blue-600';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity ${getIconColor(highestSeverity)}`}
          title={`${suggestions.length} AI suggestion${suggestions.length > 1 ? 's' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Sparkles className="h-4 w-4" />
          {suggestions.length > 1 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-primary">
              {suggestions.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h4 className="font-medium">AI Suggestions</h4>
            <Badge variant="secondary" className="ml-auto">
              {suggestions.length}
            </Badge>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
              <div className="flex items-start gap-3">
                <suggestion.icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${getIconColor(suggestion.severity)}`} />
                <div className="flex-1 space-y-2">
                  <div>
                    <h5 className="font-medium text-sm">{suggestion.title}</h5>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                  {suggestion.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={suggestion.action.onClick}
                      className="h-7 text-xs"
                    >
                      {suggestion.action.label}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
