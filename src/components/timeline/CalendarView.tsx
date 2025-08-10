'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarItem {
  id: string;
  name: string;
  date: Date;
  type: 'sprint' | 'task' | 'milestone' | 'release' | 'event';
  status: string;
  dueDate?: Date;
  endDate?: Date;
}

interface CalendarViewProps {
  items: CalendarItem[];
  className?: string;
}

export function CalendarView({ items, className }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { monthData, monthName } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dayItems = items.filter(item => {
        const itemDate = new Date(item.date);
        return (
          itemDate.getDate() === current.getDate() &&
          itemDate.getMonth() === current.getMonth() &&
          itemDate.getFullYear() === current.getFullYear()
        );
      });
      
      days.push({
        date: new Date(current),
        items: dayItems,
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return {
      monthData: days,
      monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  }, [currentDate, items]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sprint': return 'bg-blue-100 text-blue-800';
      case 'task': return 'bg-purple-100 text-purple-800';
      case 'milestone': return 'bg-yellow-100 text-yellow-800';
      case 'release': return 'bg-red-100 text-red-800';
      case 'event': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendar View</CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[150px] text-center">{monthName}</span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="h-8 flex items-center justify-center font-medium text-sm text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {monthData.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[120px] p-1 border border-gray-200 rounded
                ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              <div className={`text-sm font-medium mb-1 ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {day.items.slice(0, 3).map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className={`
                      text-xs px-1 py-0.5 rounded truncate
                      ${getTypeColor(item.type)}
                    `}
                    title={`${item.name} (${item.type})`}
                  >
                    {item.name}
                  </div>
                ))}
                
                {day.items.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{day.items.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['sprint', 'task', 'milestone', 'release', 'event'].map(type => (
            <Badge key={type} className={getTypeColor(type)} variant="secondary">
              {type}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
