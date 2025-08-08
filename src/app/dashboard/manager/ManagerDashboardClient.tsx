'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { useEffect } from 'react';

export function ManagerDashboardClient() {
  const router = useRouter();
  const { currentWorkspace } = useWorkspace();
  const { projects, fetchProjects } = useProject();

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchProjects(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Manager Overview</h2>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard/manager/sprint-planner')}>Plan Sprint</Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard/reports')}>Open Reports</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Sprint Burndown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded bg-muted" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workload Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 rounded bg-muted" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue & Blockers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">No blockers detected.</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-sm text-muted-foreground">No projects found in this workspace.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="rounded border p-3 text-sm">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-muted-foreground">Status: {p.status}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


