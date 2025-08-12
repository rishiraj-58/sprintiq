"use client";

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, AtSign, UserPlus, MessageSquareText, Bell, CheckCheck } from 'lucide-react';

type Notification = {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  projectId?: string | null;
  taskId?: string | null;
};

function relativeTime(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'mention':
      return <AtSign className="h-4 w-4 text-blue-500" />;
    case 'task_assigned':
      return <UserPlus className="h-4 w-4 text-emerald-600" />;
    case 'comment_added':
      return <MessageSquareText className="h-4 w-4 text-indigo-600" />;
    case 'status_update':
      return <CheckCheck className="h-4 w-4 text-amber-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

export function NotificationDropdown({
  onViewAll,
  onMarkedAll,
}: {
  onViewAll: () => void;
  onMarkedAll?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications/unread', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markAll = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      onMarkedAll?.();
      await load();
    } catch {}
  };

  return (
    <div className="w-80">
      <div className="flex items-center justify-between py-2 px-3">
        <div className="font-medium">Notifications</div>
        <Button size="sm" variant="ghost" onClick={markAll} className="h-7 px-2">
          Mark all as read
        </Button>
      </div>
      <Separator />
      <div className="max-h-80 overflow-auto py-2">
        {loading && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading
          </div>
        )}
        {error && <div className="px-3 py-2 text-sm text-red-500">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">You're all caught up! ✨</div>
        )}
        {!loading && !error && items.slice(0, 7).map((n) => (
          <div key={n.id} className="flex items-start gap-3 px-3 py-2">
            <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <TypeIcon type={n.type} />
                <span>{n.content}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{relativeTime(n.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div className="py-2 px-3">
        <Button onClick={onViewAll} className="w-full" variant="outline" size="sm">
          View all notifications
        </Button>
      </div>
    </div>
  );
}


