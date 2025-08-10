'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import the new visualization components
import { GanttChart } from '@/components/timeline/GanttChart';
import { CalendarView } from '@/components/timeline/CalendarView';
import { BurndownChart } from '@/components/timeline/BurndownChart';
import { CumulativeFlowDiagram } from '@/components/timeline/CumulativeFlowDiagram';
import { MilestoneLane } from '@/components/timeline/MilestoneLane';
import { ReleaseLane } from '@/components/timeline/ReleaseLane';

type TimelineProps = { projectId: string };

export function Timeline({ projectId }: TimelineProps) {
  const [data, setData] = useState<{ 
    tasks: any[]; 
    sprints: any[]; 
    milestones?: any[]; 
    releases?: any[]; 
    events?: any[]; 
    phases?: any[]; 
    capacityWindows?: any[]; 
    policies?: any[] 
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ status?: string; type?: string }>(() => ({}));
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'type' | 'sprint'>('type');
  const [rangeOverride, setRangeOverride] = useState<{ startDate: Date | null; endDate: Date | null }>({ startDate: null, endDate: null });

  useEffect(() => {
    (async () => {
      try {
        const qs = new URLSearchParams();
        if (filters.status) qs.append('status', filters.status);
        if (filters.type) qs.append('type', filters.type);
        const res = await fetch(`/api/projects/${projectId}/timeline${qs.toString() ? `?${qs}` : ''}`);
        const json = await res.json();
        setData(json);
        
        // Set default sprint for burndown chart
        if (json.sprints && json.sprints.length > 0 && !selectedSprintId) {
          setSelectedSprintId(json.sprints[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, filters.status, filters.type, selectedSprintId]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (!data) return { startDate: new Date(), endDate: new Date() };
    
    const allDates = [
      ...(data.tasks || []).map(t => t.dueDate).filter(Boolean),
      ...(data.sprints || []).flatMap(s => [s.startDate, s.endDate]).filter(Boolean),
      ...(data.milestones || []).map(m => m.dueDate).filter(Boolean),
      ...(data.releases || []).map(r => r.date).filter(Boolean),
      ...(data.events || []).map(e => e.date).filter(Boolean),
      ...(data.phases || []).flatMap(p => [p.startDate, p.endDate]).filter(Boolean),
      ...(data.capacityWindows || []).flatMap(c => [c.startDate, c.endDate]).filter(Boolean),
      ...(data.policies || []).flatMap(p => [p.startDate, p.endDate]).filter(Boolean)
    ].map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
    
    if (allDates.length === 0) {
      const now = new Date();
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 2, 0)
      };
    }
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add some padding
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date(maxDate);
    endDate.setDate(endDate.getDate() + 14);
    
    const finalStart = rangeOverride.startDate ?? startDate;
    const finalEnd = rangeOverride.endDate ?? endDate;
    return { startDate: finalStart, endDate: finalEnd };
  }, [data, rangeOverride]);

  // Transform data for visualization components
  const ganttItems = useMemo(() => {
    if (!data) return [];
    
    const items: any[] = [];
    
    // Add sprints
    (data.sprints || []).forEach((sprint: any) => {
      items.push({
        id: sprint.id,
        name: sprint.name,
        startDate: new Date(sprint.startDate),
        endDate: new Date(sprint.endDate),
        type: 'sprint',
        status: sprint.status
      });
    });
    
    // Add tasks with due dates
    (data.tasks || []).filter((task: any) => task.dueDate).forEach((task: any) => {
      const taskDate = new Date(task.dueDate);
      items.push({
        id: task.id,
        name: task.title,
        startDate: new Date(taskDate.getTime() - (1000 * 60 * 60 * 24)), // 1 day before due date
        endDate: taskDate,
        type: 'task',
        status: task.status,
        assignee: task.assignee,
        progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0
      });
    });
    
    // Add milestones
    (data.milestones || []).forEach((milestone: any) => {
      const milestoneDate = new Date(milestone.dueDate);
      items.push({
        id: milestone.id,
        name: milestone.name,
        startDate: milestoneDate,
        endDate: milestoneDate,
        type: 'milestone',
        status: milestone.status
      });
    });
    
    // Add releases
    (data.releases || []).forEach((release: any) => {
      const releaseDate = new Date(release.date);
      items.push({
        id: release.id,
        name: release.name,
        startDate: releaseDate,
        endDate: releaseDate,
        type: 'release',
        status: 'planned'
      });
    });
    
    return items;
  }, [data]);

  // Transform data for calendar view
  const calendarItems = useMemo(() => {
    if (!data) return [];
    
    const items: any[] = [];
    
    // Add tasks with due dates
    (data.tasks || []).filter((task: any) => task.dueDate).forEach((task: any) => {
      items.push({
        id: task.id,
        name: task.title,
        date: new Date(task.dueDate),
        type: 'task',
        status: task.status
      });
    });
    
    // Add milestones
    (data.milestones || []).forEach((milestone: any) => {
      items.push({
        id: milestone.id,
        name: milestone.name,
        date: new Date(milestone.dueDate),
        type: 'milestone',
        status: milestone.status
      });
    });
    
    // Add releases
    (data.releases || []).forEach((release: any) => {
      items.push({
        id: release.id,
        name: release.name,
        date: new Date(release.date),
        type: 'release',
        status: 'planned'
      });
    });
    
    // Add events
    (data.events || []).forEach((event: any) => {
      items.push({
        id: event.id,
        name: event.name,
        date: new Date(event.date),
        type: 'event',
        status: event.kind
      });
    });
    
    return items;
  }, [data]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!data) return <div className="text-sm text-muted-foreground">No data.</div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={filters.type ?? 'all'} onValueChange={(value) => setFilters(f => ({ ...f, type: value === 'all' ? undefined : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="chore">Chore</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.status ?? 'all'} onValueChange={(value) => setFilters(f => ({ ...f, status: value === 'all' ? undefined : value }))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>

        {data.sprints && data.sprints.length > 0 && (
          <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select sprint" />
            </SelectTrigger>
            <SelectContent>
              {data.sprints.map(sprint => (
                <SelectItem key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'type'|'sprint')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="type">Group: Type</SelectItem>
            <SelectItem value="sprint">Group: Sprint</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const spanDays = Math.ceil((timelineRange.endDate.getTime() - timelineRange.startDate.getTime()) / (1000*60*60*24));
            const pad = Math.ceil(spanDays * 0.2);
            const start = new Date(timelineRange.startDate); start.setDate(start.getDate() - pad);
            const end = new Date(timelineRange.endDate); end.setDate(end.getDate() + pad);
            setRangeOverride({ startDate: start, endDate: end });
          }}>Zoom Out</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const spanDays = Math.ceil((timelineRange.endDate.getTime() - timelineRange.startDate.getTime()) / (1000*60*60*24));
            const cut = Math.max(1, Math.floor(spanDays * 0.2));
            const start = new Date(timelineRange.startDate); start.setDate(start.getDate() + cut);
            const end = new Date(timelineRange.endDate); end.setDate(end.getDate() - cut);
            setRangeOverride({ startDate: start, endDate: end });
          }}>Zoom In</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const shift = 7; // days
            const start = new Date(timelineRange.startDate); start.setDate(start.getDate() - shift);
            const end = new Date(timelineRange.endDate); end.setDate(end.getDate() - shift);
            setRangeOverride({ startDate: start, endDate: end });
          }}>Pan ←</Button>
          <Button variant="outline" size="sm" onClick={() => {
            const shift = 7; // days
            const start = new Date(timelineRange.startDate); start.setDate(start.getDate() + shift);
            const end = new Date(timelineRange.endDate); end.setDate(end.getDate() + shift);
            setRangeOverride({ startDate: start, endDate: end });
          }}>Pan →</Button>
        </div>
      </div>

      {/* Timeline Visualizations */}
      <Tabs defaultValue="gantt" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="gantt">Gantt</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
        </TabsList>
        
        <TabsContent value="gantt" className="space-y-4">
          <GanttChart
            items={ganttItems}
            startDate={timelineRange.startDate}
            endDate={timelineRange.endDate}
            groupBy={groupBy}
            sprintOptions={(data.sprints || []).map((s:any)=>({ id: s.id, name: s.name }))}
            onUpdateTaskDueDate={async (taskId, newDue) => {
              await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ dueDate: newDue }), headers: { 'Content-Type': 'application/json' } });
              const res = await fetch(`/api/projects/${projectId}/timeline`);
              const json = await res.json();
              setData(json);
            }}
            onAssignTaskToSprint={async (taskId, sprintId) => {
              await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ sprintId }), headers: { 'Content-Type': 'application/json' } });
              const res = await fetch(`/api/projects/${projectId}/timeline`);
              const json = await res.json();
              setData(json);
            }}
            onUpdateSprintDates={async (sprintId, newStart, newEnd) => {
              await fetch(`/api/sprints/${sprintId}`, { method: 'PATCH', body: JSON.stringify({ startDate: newStart, endDate: newEnd }), headers: { 'Content-Type': 'application/json' } });
              const res = await fetch(`/api/projects/${projectId}/timeline`);
              const json = await res.json();
              setData(json);
            }}
          />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <CalendarView items={calendarItems} />
        </TabsContent>
        
        <TabsContent value="burndown" className="space-y-4">
          <BurndownChart
            sprints={data.sprints || []}
            tasks={data.tasks || []}
            selectedSprintId={selectedSprintId}
          />
        </TabsContent>
        
        <TabsContent value="flow" className="space-y-4">
          <CumulativeFlowDiagram
            tasks={data.tasks || []}
            projectId={projectId}
            dateRange={{ start: timelineRange.startDate, end: timelineRange.endDate }}
          />
        </TabsContent>
        
        <TabsContent value="milestones" className="space-y-4">
          <MilestoneLane
            milestones={data.milestones || []}
            startDate={timelineRange.startDate}
            endDate={timelineRange.endDate}
            onUpdateMilestoneDate={async (milestoneId, newDate) => {
              await fetch(`/api/milestones/${milestoneId}`, { method: 'PATCH', body: JSON.stringify({ dueDate: newDate }), headers: { 'Content-Type': 'application/json' } });
              const res = await fetch(`/api/projects/${projectId}/timeline`);
              const json = await res.json();
              setData(json);
            }}
          />
        </TabsContent>
        
        <TabsContent value="releases" className="space-y-4">
          <ReleaseLane
            releases={data.releases || []}
            startDate={timelineRange.startDate}
            endDate={timelineRange.endDate}
          />
        </TabsContent>
      </Tabs>

      {/* Summary Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-2xl text-blue-600">{(data.sprints || []).length}</div>
              <div className="text-muted-foreground">Sprints</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-2xl text-purple-600">{(data.tasks || []).length}</div>
              <div className="text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-2xl text-yellow-600">{(data.milestones || []).length}</div>
              <div className="text-muted-foreground">Milestones</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-2xl text-red-600">{(data.releases || []).length}</div>
              <div className="text-muted-foreground">Releases</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


