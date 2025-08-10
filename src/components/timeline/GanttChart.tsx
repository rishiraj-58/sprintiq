'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
}

interface GanttChartProps {
  items: GanttItem[];
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function GanttChart({ items, startDate, endDate, className }: GanttChartProps) {
  const { timelineData, totalDays } = useMemo(() => {
    const totalMs = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    
    const timelineData = items.map(item => {
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
    
    return { timelineData, totalDays };
  }, [items, startDate, endDate]);

  const getTypeColor = (type: string, status: string) => {
    if (status === 'completed' || status === 'done') {
      return 'bg-green-500';
    }
    
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

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Gantt Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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

          {/* Gantt items grouped by type */}
          {['sprint', 'milestone', 'release', 'task'].map(type => {
            const typeItems = timelineData.filter(item => item.type === type && item.isVisible);
            
            if (typeItems.length === 0) return null;
            
            return (
              <div key={type} className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700 capitalize">{type}s</h4>
                <div className="space-y-1">
                  {typeItems.map(item => (
                    <div key={item.id} className="relative">
                      {/* Background grid */}
                      <div className="absolute inset-0 h-full">
                        {timeGrid.map((_, index) => (
                          <div
                            key={index}
                            className="absolute top-0 h-full border-l border-gray-100"
                            style={{ left: `${timeGrid[index].leftPercent}%` }}
                          />
                        ))}
                      </div>
                      
                      {/* Item bar */}
                      <div className="relative flex items-center h-10 py-1">
                        <div className="w-32 flex-shrink-0 pr-4 text-sm font-medium truncate">
                          {item.name}
                        </div>
                        
                        <div className="flex-1 relative">
                          <div
                            className={`absolute ${getTypeHeight(item.type)} ${getTypeColor(item.type, item.status)} rounded opacity-80 flex items-center px-2`}
                            style={{
                              left: `${item.leftPercent}%`,
                              width: `${item.widthPercent}%`
                            }}
                          >
                            {/* Progress bar for tasks */}
                            {item.type === 'task' && item.progress !== undefined && (
                              <div
                                className="absolute inset-0 bg-green-600 rounded opacity-30"
                                style={{ width: `${item.progress}%` }}
                              />
                            )}
                            
                            {/* Assignee avatar for tasks */}
                            {item.type === 'task' && item.assignee && (
                              <Avatar className="w-4 h-4 mr-1">
                                <AvatarFallback className="text-xs">
                                  {item.assignee.firstName?.[0]}{item.assignee.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {/* Status badge */}
                            <Badge
                              variant={item.status === 'completed' || item.status === 'done' ? 'default' : 'secondary'}
                              className="text-xs ml-auto"
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
