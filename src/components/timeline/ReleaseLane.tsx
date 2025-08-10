'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Calendar, Tag, FileText } from 'lucide-react';

interface Release {
  id: string;
  name: string;
  date: Date;
  notes?: string;
  projectId: string;
}

interface ReleaseLaneProps {
  releases: Release[];
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function ReleaseLane({ releases, startDate, endDate, className }: ReleaseLaneProps) {
  const timelineData = useMemo(() => {
    const totalMs = endDate.getTime() - startDate.getTime();
    const now = new Date();
    
    return releases
      .filter(release => {
        const date = new Date(release.date as unknown as string | number | Date);
        return date >= startDate && date <= endDate;
      })
      .map(release => {
        const date = new Date(release.date as unknown as string | number | Date);
        const leftPercent = ((date.getTime() - startDate.getTime()) / totalMs) * 100;
        
        return {
          ...release,
          date,
          leftPercent: Math.max(0, Math.min(100, leftPercent)),
          isPast: date < now,
          daysFromNow: Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [releases, startDate, endDate]);

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

  const getReleaseColor = (isPast: boolean) => {
    return isPast 
      ? 'border-green-500 bg-green-50 text-green-700'
      : 'border-blue-500 bg-blue-50 text-blue-700';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Release Lane
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

          {/* Release timeline */}
          <div className="relative h-20 bg-gray-50 rounded-lg">
            {/* Background grid */}
            {timeGrid.map((week, index) => (
              <div
                key={index}
                className="absolute top-0 h-full border-l border-gray-200"
                style={{ left: `${week.leftPercent}%` }}
              />
            ))}
            
            {/* Release markers */}
            {timelineData.map((release, index) => (
              <div
                key={release.id}
                className="absolute top-3 transform -translate-x-1/2"
                style={{ left: `${release.leftPercent}%` }}
              >
                <div 
                  className={`
                    px-3 py-1 rounded-full border-2 flex items-center gap-1
                    ${getReleaseColor(release.isPast)}
                    hover:scale-105 transition-transform cursor-pointer
                    whitespace-nowrap text-sm font-medium
                  `}
                  title={`${release.name} - ${release.date.toLocaleDateString()}`}
                >
                  <Tag className="w-3 h-3" />
                  {release.name}
                </div>
                
                {/* Release date */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="text-xs text-gray-500 text-center">
                    {release.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Release list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Release Schedule</h4>
            {timelineData.length > 0 ? (
              <div className="space-y-2">
                {timelineData.map(release => (
                  <div
                    key={release.id}
                    className="flex items-start justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${getReleaseColor(release.isPast)}
                      `}>
                        {release.isPast ? (
                          <Rocket className="w-4 h-4" />
                        ) : (
                          <Tag className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-sm">{release.name}</div>
                        {release.notes && (
                          <div className="text-xs text-gray-600 mt-1 flex items-start gap-1">
                            <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{release.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <Badge 
                        variant={release.isPast ? 'default' : 'secondary'}
                        className="mb-1"
                      >
                        {release.isPast ? 'Released' : 'Planned'}
                      </Badge>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {release.isPast ? (
                          <span className="text-green-600">{Math.abs(release.daysFromNow)} days ago</span>
                        ) : release.daysFromNow === 0 ? (
                          <span className="text-blue-600">Today</span>
                        ) : (
                          <span>{release.daysFromNow} days remaining</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No releases in the selected time range
              </div>
            )}
          </div>

          {/* Release summary */}
          {timelineData.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Release Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Past Releases:</span>
                  <span className="ml-1 font-medium text-green-600">
                    {timelineData.filter(r => r.isPast).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Upcoming Releases:</span>
                  <span className="ml-1 font-medium text-blue-600">
                    {timelineData.filter(r => !r.isPast).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
