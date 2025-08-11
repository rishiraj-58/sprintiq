'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/hooks/usePermissions';

interface SubtaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  assignee?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  } | null;
}

interface SubTasksProps {
  taskId: string;
  workspaceId: string;
}

export function SubTasks({ taskId, workspaceId }: SubTasksProps) {
  const [items, setItems] = useState<SubtaskItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { canEdit } = usePermissions('workspace', workspaceId);

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.isCompleted).length;
    return Math.round((completed / items.length) * 100);
  }, [items]);

  const fetchSubtasks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/tasks/${taskId}/subtasks`);
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtasks();
  }, [taskId]);

  const addSubtask = async () => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add subtask');
      const created = await res.json();
      setItems(prev => [...prev, created]);
      setNewTitle('');
    } catch (e) {
      toast({ title: 'Error', description: 'Could not add sub-task', variant: 'destructive' });
    }
  };

  const toggleComplete = async (id: string, isCompleted: boolean) => {
    try {
      setItems(prev => prev.map(i => i.id === id ? { ...i, isCompleted } : i));
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch (e) {
      toast({ title: 'Error', description: 'Update failed', variant: 'destructive' });
      fetchSubtasks();
    }
  };

  const deleteSubtask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sub-tasks</span>
          <span className="text-sm text-muted-foreground">{items.filter(i=>i.isCompleted).length} of {items.length} completed</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} />
        {canEdit && (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add sub-task"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Button onClick={addSubtask} disabled={!newTitle.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
        )}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sub-tasks yet</p>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md">
                <Checkbox checked={item.isCompleted} onCheckedChange={(v) => toggleComplete(item.id, Boolean(v))} />
                <div className="flex-1 text-sm line-clamp-2">{item.title}</div>
                {item.assignee && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={item.assignee.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {(item.assignee.firstName?.[0]||'')}{(item.assignee.lastName?.[0]||'')}
                    </AvatarFallback>
                  </Avatar>
                )}
                {canEdit && (
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => deleteSubtask(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


