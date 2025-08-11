'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTask } from '@/stores/hooks/useTask';

export function MemberDashboardClient() {
  const { tasks } = useTask();
  const myTasks = tasks.slice(0, 5);
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">My Work</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Today</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm list-disc pl-5 space-y-1">
              {myTasks.map(t => (<li key={t.id}>{t.title}</li>))}
              {myTasks.length === 0 && <li className="text-muted-foreground">No tasks</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Blockers</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">None reported</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">No recent updates</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



