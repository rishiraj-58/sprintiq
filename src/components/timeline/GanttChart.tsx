'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface GanttItem {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  type: 'sprint' | 'task' | 'milestone' | 'release';
  status: string;
  assignee?: { firstName: string; lastName: string };
  progress?: number;
  dependencies?: string[];
  sprintId?: string | null;
}

interface SprintOption { id: string; name: string }

interface GanttChartProps {
  items: GanttItem[];
  startDate: Date;
  endDate: Date;
  className?: string;
  groupBy?: 'type' | 'sprint';
  sprintOptions?: SprintOption[];
  onUpdateTaskDueDate?: (taskId: string, newDueDate: Date) => void;
  onAssignTaskToSprint?: (taskId: string, sprintId: string | null) => void;
  onUpdateSprintDates?: (sprintId: string, newStart: Date, newEnd: Date) => void;
}

type ComputedItem = GanttItem & { leftPercent: number; widthPercent: number; isVisible: boolean };

export function GanttChart({ items, startDate, endDate, className, groupBy = 'type', sprintOptions = [], onUpdateTaskDueDate, onAssignTaskToSprint, onUpdateSprintDates }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<null | { itemId: string; type: 'sprint-left' | 'sprint-right' | 'task'; originX: number; originStart: Date; originEnd: Date }>(null);

  const { timelineData } = useMemo(() => {
    const totalMs = endDate.getTime() - startDate.getTime();
    
    const timelineData: ComputedItem[] = items.map(item => {
      const itemStartMs = Math.max(item.startDate.getTime(), startDate.getTime());
      const itemEndMs = Math.min(item.endDate.getTime(), endDate.getTime());
      
      const leftPercent = ((itemStartMs - startDate.getTime()) / totalMs) * 100;
      const widthPercent = ((itemEndMs - itemStartMs) / totalMs) * 100;
      
      return {
        ...item,
        leftPercent: Math.max(0, leftPercent),
        widthPercent: Math.max(1, widthPercent),
        isVisible: itemEndMs > itemStartMs
      };
    });
    
    return { timelineData };
  }, [items, startDate, endDate]);

  const getTypeColor = (type: string, status: string) => {
    if (status === 'completed' || status === 'done') return 'bg-green-500';
    switch (type) {
      case 'sprint': return 'bg-blue-500';
      case 'task': return 'bg-purple-500';
      case 'milestone': return 'bg-yellow-500';
      case 'release': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeHeight = (type: string) => {
    switch (type) {
      case 'sprint': return 'h-8';
      case 'milestone': return 'h-4';
      case 'release': return 'h-4';
      default: return 'h-6';
    }
  };

  const pxToDays = (dxPx: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const totalPx = el.clientWidth;
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const days = (dxPx / totalPx) * totalDays;
    return days;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.preventDefault();
    const dx = e.clientX - dragState.originX;
    const dDays = Math.round(pxToDays(dx));

    if (dragState.type === 'task' && onUpdateTaskDueDate) {
      const newDue = new Date(dragState.originEnd);
      newDue.setDate(newDue.getDate() + dDays);
      // Optimistic UI is skipped; call at pointerup
    }
    if ((dragState.type === 'sprint-left' || dragState.type === 'sprint-right') && onUpdateSprintDates) {
      // handled on pointerup
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.originX;
    const dDays = Math.round(pxToDays(dx));

    if (dragState.type === 'task' && onUpdateTaskDueDate) {
      const newDue = new Date(dragState.originEnd);
      newDue.setDate(newDue.getDate() + dDays);
      onUpdateTaskDueDate(dragState.itemId, newDue);
    }
    if (onUpdateSprintDates && (dragState.type === 'sprint-left' || dragState.type === 'sprint-right')) {
      const newStart = new Date(dragState.originStart);
      const newEnd = new Date(dragState.originEnd);
      if (dragState.type === 'sprint-left') newStart.setDate(newStart.getDate() + dDays);
      if (dragState.type === 'sprint-right') newEnd.setDate(newEnd.getDate() + dDays);
      onUpdateSprintDates(dragState.itemId, newStart, newEnd);
    }
    setDragState(null);
  };

  // Generate time grid (weeks)
  const timeGrid = useMemo(() => {
    const weeks = [] as { date: Date; leftPercent: number }[];
    const current = new Date(startDate);
    while (current <= endDate) {
      const weekStart = new Date(current);
      const leftPercent = ((weekStart.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
      weeks.push({ date: new Date(weekStart), leftPercent });
      current.setDate(current.getDate() + 7);
    }
    return weeks;
  }, [startDate, endDate]);

  // Group items
  const groups = useMemo(() => {
    if (groupBy === 'sprint') {
      const bySprint = new Map<string, ComputedItem[]>();
      // include sprint bars
      timelineData.filter(i => i.type === 'sprint').forEach(s => {
        bySprint.set(s.id, [s]);
      });
      // tasks grouped under their sprintId or 'unassigned'
      timelineData.filter(i => i.type === 'task').forEach(t => {
        const key = t.sprintId || 'unassigned';
        if (!bySprint.has(key)) bySprint.set(key, []);
        bySprint.get(key)!.push(t);
      });
      return Array.from(bySprint.entries()).map(([key, items]) => ({ key, title: key === 'unassigned' ? 'Unassigned' : (items.find(i => i.type==='sprint' && i.id===key)?.name || 'Sprint'), items }));
    }
    // default: type groups
    const order: Array<GanttItem['type']> = ['sprint','milestone','release','task'];
    return order.map(type => ({ key: type, title: type.charAt(0).toUpperCase()+type.slice(1)+'s', items: timelineData.filter(i => i.type === type && i.isVisible) }));
  }, [timelineData, groupBy]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="space-y-6" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
          {/* Time header */}
          <div className="relative h-8 border-b">
            {timeGrid.map((week, index) => (
              <div key={index} className="absolute top-0 h-full border-l border-gray-200 text-xs text-gray-500 pl-1" style={{ left: `${week.leftPercent}%` }}>
                {week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Groups */}
          {groups.map(group => (
            <div key={group.key} className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">{group.title}</h4>
              <div className="space-y-1">
                {group.items.map(item => (
                  <div key={item.id} className="relative">
                    {/* Background grid */}
                    <div className="absolute inset-0 h-full">
                      {timeGrid.map((_, index) => (
                        <div key={index} className="absolute top-0 h-full border-l border-gray-100" style={{ left: `${timeGrid[index].leftPercent}%` }} />
                      ))}
                    </div>

                    {/* Item bar */}
                    <div className="relative flex items-center h-10 py-1">
                      <div className="w-32 flex-shrink-0 pr-4 text-sm font-medium truncate">{item.name}</div>
                      <div className="flex-1 relative">
                        <div
                          className={`absolute ${getTypeHeight(item.type)} ${getTypeColor(item.type, item.status)} rounded opacity-80 flex items-center px-2`}
                          style={{ left: `${item.leftPercent}%`, width: `${item.widthPercent}%` }}
                          onPointerDown={(e) => {
                            if (item.type === 'task') setDragState({ itemId: item.id, type: 'task', originX: e.clientX, originStart: item.startDate, originEnd: item.endDate });
                          }}
                        >
                          {/* Sprint resize handles */}
                          {item.type === 'sprint' && (
                            <>
                              <div className="absolute left-0 top-0 h-full w-2 cursor-ew-resize" onPointerDown={(e) => { e.stopPropagation(); setDragState({ itemId: item.id, type: 'sprint-left', originX: e.clientX, originStart: item.startDate, originEnd: item.endDate }); }} />
                              <div className="absolute right-0 top-0 h-full w-2 cursor-ew-resize" onPointerDown={(e) => { e.stopPropagation(); setDragState({ itemId: item.id, type: 'sprint-right', originX: e.clientX, originStart: item.startDate, originEnd: item.endDate }); }} />
                            </>
                          )}

                          {/* Progress bar for tasks */}
                          {item.type === 'task' && item.progress !== undefined && (
                            <div className="absolute inset-0 bg-green-600 rounded opacity-30" style={{ width: `${item.progress}%` }} />
                          )}

                          {/* Assignee avatar for tasks */}
                          {item.type === 'task' && item.assignee && (
                            <Avatar className="w-4 h-4 mr-1"><AvatarFallback className="text-xs">{item.assignee.firstName?.[0]}{item.assignee.lastName?.[0]}</AvatarFallback></Avatar>
                          )}

                          {/* Actions menu for tasks */}
                          {item.type === 'task' && (
                            <div className="ml-auto">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/90">⋮</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onUpdateTaskDueDate && onUpdateTaskDueDate(item.id, new Date(item.endDate))}>Set due date to today</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onUpdateTaskDueDate && onUpdateTaskDueDate(item.id, new Date(Date.now() + 24*60*60*1000))}>Set due date to tomorrow</DropdownMenuItem>
                                  <DropdownMenuItem disabled>—</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAssignTaskToSprint && onAssignTaskToSprint(item.id, null)}>Remove from sprint</DropdownMenuItem>
                                  {sprintOptions.map(s => (
                                    <DropdownMenuItem key={s.id} onClick={() => onAssignTaskToSprint && onAssignTaskToSprint(item.id, s.id)}>Move to {s.name}</DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}

                          {/* Status badge */}
                          <Badge variant={item.status === 'completed' || item.status === 'done' ? 'default' : 'secondary'} className="text-xs ml-2">{item.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
