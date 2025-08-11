'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Capacity = { memberId: string; name: string; availableHours: number };

export default function SprintPlannerPage() {
  const { currentWorkspace } = useWorkspace();
  const { projects, fetchProjects } = useProject();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [capacity, setCapacity] = useState<Capacity[]>([]);

  useEffect(() => {
    if (currentWorkspace?.id) fetchProjects(currentWorkspace.id);
  }, [currentWorkspace?.id, fetchProjects]);

  useEffect(() => {
    // Fake capacity hints for demo
    setCapacity([
      { memberId: 'u1', name: 'Alice Johnson', availableHours: 24 },
      { memberId: 'u2', name: 'Bob Smith', availableHours: 18 },
      { memberId: 'u3', name: 'Carol Lee', availableHours: 30 },
    ]);
  }, [selectedProjectId]);

  const totalCapacity = useMemo(() => capacity.reduce((sum, c) => sum + c.availableHours, 0), [capacity]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sprint Planner</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>Project</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-4 text-xs text-muted-foreground">Capacity hints update when you pick a project.</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Team Capacity (static)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {capacity.map((c) => (
                <div key={c.memberId} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>{c.name}</div>
                  <div className="text-muted-foreground">{c.availableHours} hrs</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">Total: <span className="font-medium">{totalCapacity} hrs</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Plan Sprint</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-3">Drag tasks into the sprint while keeping below total capacity. (Static demo)</div>
          <Button disabled={!selectedProjectId}>Start Sprint</Button>
        </CardContent>
      </Card>
    </div>
  );
}


