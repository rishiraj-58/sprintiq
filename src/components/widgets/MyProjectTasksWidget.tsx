'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ProjectTaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

export function MyProjectTasksWidget({ projectId }: { projectId: string }) {
  const { user } = useUser();
  const [rows, setRows] = useState<ProjectTaskRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.id || !projectId) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/tasks?projectId=${projectId}&assigneeId=${user.id}&status=todo`);
        if (res.ok) {
          const data = await res.json();
          setRows(data);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id, projectId]);

  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    };
    return map[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">My Open Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No open tasks assigned to you.</div>
        ) : (
          <div className="space-y-2">
            {rows.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded border p-2">
                <div className="min-w-0">
                  <Link href={`/tasks/${t.id}`} className="text-sm font-medium hover:underline line-clamp-1">{t.title}</Link>
                  <div className="text-xs text-muted-foreground">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No due date'}
                  </div>
                </div>
                <Badge variant="outline" className={priorityBadge(t.priority)}>{t.priority}</Badge>
              </div>
            ))}
            {rows.length > 5 && (
              <div className="text-right">
                <Link href={`/projects/${projectId}/tasks`} className="text-xs text-primary hover:underline">View all</Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


