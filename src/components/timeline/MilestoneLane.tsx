'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flag, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: string;
  description?: string;
  projectId: string;
}

interface MilestoneLaneProps {
  milestones: Milestone[];
  startDate: Date;
  endDate: Date;
  className?: string;
  onUpdateMilestoneDate?: (milestoneId: string, newDate: Date) => void;
}

export function MilestoneLane({ milestones, startDate, endDate, className, onUpdateMilestoneDate }: MilestoneLaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<null | { id: string; originX: number; originDate: Date }>(null);
  const timelineData = useMemo(() => {
    const totalMs = endDate.getTime() - startDate.getTime();
    const now = new Date();
    
    return milestones
      .filter(milestone => {
        const due = new Date(milestone.dueDate as unknown as string | number | Date);
        return due >= startDate && due <= endDate;
      })
      .map(milestone => {
        const due = new Date(milestone.dueDate as unknown as string | number | Date);
        const leftPercent = ((due.getTime() - startDate.getTime()) / totalMs) * 100;
        
        return {
          ...milestone,
          dueDate: due,
          leftPercent: Math.max(0, Math.min(100, leftPercent)),
          isOverdue: due < now && milestone.status !== 'completed',
          daysFromNow: Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [milestones, startDate, endDate]);

  const getStatusIcon = (status: string, isOverdue: boolean) => {
    if (isOverdue) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Flag className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string, isOverdue: boolean) => {
    if (isOverdue) return 'border-red-500 bg-red-50';
    
    switch (status) {
      case 'completed':
        return 'border-green-500 bg-green-50';
      case 'in_progress':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  // Generate time grid (weeks)
  const timeGrid = useMemo(() => {
    const weeks = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const weekStart = new Date(current);
      const leftPercent = ((weekStart.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
      
      weeks.push({
        date: new Date(weekStart),
        leftPercent
      });
      
      current.setDate(current.getDate() + 7);
    }
    
    return weeks;
  }, [startDate, endDate]);

  const pxToDays = (dxPx: number) => {
    const el = containerRef.current;
    if (!el) return 0;
    const totalPx = el.clientWidth;
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    return (dxPx / totalPx) * totalDays;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState) return;
    e.preventDefault();
  };

  const onPointerUp = async (e: React.PointerEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.originX;
    const dDays = Math.round(pxToDays(dx));
    const newDate = new Date(dragState.originDate);
    newDate.setDate(newDate.getDate() + dDays);
    if (onUpdateMilestoneDate) {
      await onUpdateMilestoneDate(dragState.id, newDate);
    }
    setDragState(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5" />
          Milestone Lane
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Time header */}
          <div className="relative h-8 border-b">
            {timeGrid.map((week, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-200 text-xs text-gray-500 pl-1"
                style={{ left: `${week.leftPercent}%` }}
              >
                {week.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            ))}
          </div>

          {/* Milestone timeline */}
          <div ref={containerRef} className="relative h-16 bg-gray-50 rounded-lg" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
            {/* Background grid */}
            {timeGrid.map((week, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-200"
                style={{ left: `${week.leftPercent}%` }}
              />
            ))}
            
            {/* Milestone markers */}
            {timelineData.map((milestone, index) => (
              <div
                key={milestone.id}
                className="absolute top-2 transform -translate-x-1/2"
                style={{ left: `${milestone.leftPercent}%` }}
              >
                <div 
                  className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center
                    ${getStatusColor(milestone.status, milestone.isOverdue)}
                    hover:scale-110 transition-transform cursor-pointer
                  `}
                  title={`${milestone.name} - ${milestone.dueDate.toLocaleDateString()}`}
                  onPointerDown={(e) => setDragState({ id: milestone.id, originX: e.clientX, originDate: milestone.dueDate })}
                >
                  {getStatusIcon(milestone.status, milestone.isOverdue)}
                </div>
                
                {/* Milestone name */}
                <div className="absolute top-14 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900 text-center">
                    {milestone.name}
                  </div>
                  <div className="text-xs text-gray-500 text-center">
                    {milestone.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Milestone list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Upcoming Milestones</h4>
            {timelineData.slice(0, 5).map(milestone => (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(milestone.status, milestone.isOverdue)}
                  <div>
                    <div className="font-medium text-sm">{milestone.name}</div>
                    {milestone.description && (
                      <div className="text-xs text-gray-500">{milestone.description}</div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <Badge 
                    variant={milestone.isOverdue ? 'destructive' : 'secondary'}
                    className="mb-1"
                  >
                    {milestone.status}
                  </Badge>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {milestone.isOverdue ? (
                      <span className="text-red-600">{Math.abs(milestone.daysFromNow)} days overdue</span>
                    ) : milestone.daysFromNow === 0 ? (
                      <span className="text-yellow-600">Due today</span>
                    ) : milestone.daysFromNow > 0 ? (
                      <span>{milestone.daysFromNow} days remaining</span>
                    ) : (
                      <span className="text-green-600">Completed</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {timelineData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No milestones in the selected time range
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
