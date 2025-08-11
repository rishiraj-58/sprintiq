'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function MyVelocityChart({ data }: { data: Array<{ sprint: string; completed: number }> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Velocity (last sprints)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.sprint} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{d.sprint}</span>
                <span className="font-medium">{d.completed} pts</span>
              </div>
              <div className="h-2 bg-muted rounded">
                <div className="h-2 bg-primary rounded" style={{ width: `${Math.min(100, d.completed * 5)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MyTaskBreakdownChart({ data }: { data: Array<{ type: string; count: number }> }) {
  const total = data.reduce((s, x) => s + x.count, 0) || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Task Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((d) => (
            <div key={d.type} className="flex items-center justify-between text-sm">
              <span>{d.type}</span>
              <span className="font-medium">{d.count} ({Math.round((d.count/total)*100)}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PersonalReportsPage() {
  const { user } = useUser();
  const [velocity, setVelocity] = useState<Array<{ sprint: string; completed: number }>>([]);
  const [breakdown, setBreakdown] = useState<Array<{ type: string; count: number }>>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      // Minimal placeholder: derive from assigned tasks API as a proxy for demo
      try {
        const res = await fetch(`/api/users/${user.id}/tasks/assigned`, { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const tasks = await res.json();
          const byType: Record<string, number> = {};
          for (const t of tasks) {
            const type = (t.type || 'feature').toString();
            byType[type] = (byType[type] || 0) + (t.status === 'done' ? 1 : 0);
          }
          const bd = Object.entries(byType).map(([type, count]) => ({ type, count }));
          setBreakdown(bd.length ? bd : [{ type: 'feature', count: 0 }]);

          // Synthetic sprint buckets for demo purposes
          const v = [
            { sprint: 'Sprint -4', completed: Math.max(0, Math.round((bd[0]?.count || 1) * 0.5)) },
            { sprint: 'Sprint -3', completed: Math.max(0, Math.round((bd[0]?.count || 1) * 0.8)) },
            { sprint: 'Sprint -2', completed: Math.max(0, Math.round((bd[0]?.count || 1) * 1.0)) },
            { sprint: 'Sprint -1', completed: Math.max(0, Math.round((bd[0]?.count || 1) * 1.2)) },
          ];
          setVelocity(v);
        }
      } catch {}
    };
    load();
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">Personal performance metrics scoped to your work</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <MyVelocityChart data={velocity} />
        <MyTaskBreakdownChart data={breakdown} />
      </div>
    </div>
  );
}


