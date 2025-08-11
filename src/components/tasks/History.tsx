'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface HistoryItem {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  oldAssignee?: { id: string | null; firstName: string | null; lastName: string | null } | null;
  newAssignee?: { id: string | null; firstName: string | null; lastName: string | null } | null;
  createdAt: string | null;
  actor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

export function History({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const relativeTime = (ts: string | null) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const prettyField = (field: string) => {
    const map: Record<string, string> = {
      status: 'Status',
      priority: 'Priority',
      title: 'Title',
      description: 'Description',
      assignee: 'Assignee',
      sprint: 'Sprint',
      dueDate: 'Due Date',
      storyPoints: 'Story Points',
      type: 'Type',
    };
    return map[field] || field;
  };

  const formatValue = (field: string, value: string | null, item?: HistoryItem) => {
    if (value === null || value === '') return '—';
    if (field === 'status') {
      const map: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
      return map[value] || value;
    }
    if (field === 'priority') {
      const map: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
      return map[value] || value;
    }
    if (field === 'assignee') {
      if (value === 'null' || value === null) return 'Unassigned';
      if (item && item.oldAssignee && item.oldAssignee.id === value) {
        return `${item.oldAssignee.firstName || ''} ${item.oldAssignee.lastName || ''}`.trim();
      }
      if (item && item.newAssignee && item.newAssignee.id === value) {
        return `${item.newAssignee.firstName || ''} ${item.newAssignee.lastName || ''}`.trim();
      }
      return value;
    }
    if (field === 'dueDate') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d.toLocaleDateString();
    }
    return value;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tasks/${taskId}/history`);
        if (res.ok) setItems(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [taskId]);

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No history yet</p>
        ) : (
          items.map((i) => (
            <div key={i.id} className="flex items-start gap-3">
              <Avatar className="w-6 h-6">
                <AvatarImage src={i.actor.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(i.actor.firstName?.[0]||'')}{(i.actor.lastName?.[0]||'')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-sm space-y-1">
                {i.field === 'description' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{i.actor.firstName} {i.actor.lastName}</span>
                    <span className="text-muted-foreground">updated</span>
                    <Badge variant="outline">Description</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{i.actor.firstName} {i.actor.lastName}</span>
                    <span className="text-muted-foreground">changed</span>
                    <Badge variant="outline">{prettyField(i.field)}</Badge>
                    <span className="text-muted-foreground">from</span>
                    <code className="px-1 py-0.5 bg-muted rounded">{formatValue(i.field, i.oldValue, i)}</code>
                    <span className="text-muted-foreground">to</span>
                    <code className="px-1 py-0.5 bg-muted rounded">{formatValue(i.field, i.newValue, i)}</code>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">{relativeTime(i.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


