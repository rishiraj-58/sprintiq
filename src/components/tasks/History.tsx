'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HistoryItem {
  id: string;
  action: string;
  details: string | null;
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
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{i.actor.firstName} {i.actor.lastName}</span>
                  <span className="text-muted-foreground">{i.action}</span>
                </div>
                {i.details && (
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">{i.details}</pre>
                )}
                <div className="text-xs text-muted-foreground mt-1">{i.createdAt ? new Date(i.createdAt).toLocaleString() : ''}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}


