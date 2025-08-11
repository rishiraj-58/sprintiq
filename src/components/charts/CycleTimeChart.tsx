'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TaskCycleData {
  id: string;
  title: string;
  cycleTime: number; // in days
  completedDate: string;
  storyPoints?: number;
}

interface CycleTimeChartProps {
  cycleData: TaskCycleData[];
}

export function CycleTimeChart({ cycleData }: CycleTimeChartProps) {
  if (!cycleData || cycleData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cycle Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No cycle time data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCycleTime = Math.max(...cycleData.map(d => d.cycleTime));
  const avgCycleTime = cycleData.reduce((sum, d) => sum + d.cycleTime, 0) / cycleData.length;
  
  // Group by story points for color coding
  const getPointColor = (points?: number) => {
    if (!points) return '#94a3b8';
    if (points <= 3) return '#22c55e';
    if (points <= 8) return '#3b82f6';
    return '#ef4444';
  };

  const getPointSize = (points?: number) => {
    if (!points) return 4;
    return Math.min(3 + points, 10);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Cycle Time Analysis
          <div className="text-sm font-normal text-muted-foreground">
            Time to complete tasks
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 500 240">
            {/* Grid lines */}
            <defs>
              <pattern id="cycle-grid" width="50" height="30" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cycle-grid)" />
            
            {/* Y-axis labels (cycle time) */}
            {[0, Math.ceil(maxCycleTime * 0.25), Math.ceil(maxCycleTime * 0.5), Math.ceil(maxCycleTime * 0.75), Math.ceil(maxCycleTime)].map((value, index) => (
              <g key={value}>
                <text 
                  x="25" 
                  y={200 - (value / maxCycleTime) * 160} 
                  fontSize="10" 
                  fill="#6b7280" 
                  textAnchor="end"
                >
                  {value}d
                </text>
                <line
                  x1="30"
                  y1={200 - (value / maxCycleTime) * 160}
                  x2="470"
                  y2={200 - (value / maxCycleTime) * 160}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              </g>
            ))}
            
            {/* Average line */}
            <line
              x1="30"
              y1={200 - (avgCycleTime / maxCycleTime) * 160}
              x2="470"
              y2={200 - (avgCycleTime / maxCycleTime) * 160}
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x="475"
              y={200 - (avgCycleTime / maxCycleTime) * 160 + 4}
              fontSize="10"
              fill="#f59e0b"
              textAnchor="start"
            >
              Avg: {avgCycleTime.toFixed(1)}d
            </text>
            
            {/* Data points */}
            {cycleData.map((task, index) => {
              const x = 50 + (index / (cycleData.length - 1)) * 400;
              const y = 200 - (task.cycleTime / maxCycleTime) * 160;
              const color = getPointColor(task.storyPoints);
              const size = getPointSize(task.storyPoints);
              
              return (
                <g key={task.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={size}
                    fill={color}
                    opacity="0.7"
                    stroke="white"
                    strokeWidth="1"
                  />
                  
                  {/* Hover info - simplified for static version */}
                  <title>
                    {task.title}: {task.cycleTime} days
                    {task.storyPoints ? ` (${task.storyPoints} pts)` : ''}
                  </title>
                </g>
              );
            })}
            
            {/* X-axis labels (task completion order) */}
            <text x="50" y="225" fontSize="10" fill="#6b7280" textAnchor="middle">
              Recent
            </text>
            <text x="450" y="225" fontSize="10" fill="#6b7280" textAnchor="middle">
              Latest
            </text>
          </svg>
        </div>
        
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-0.5 bg-amber-500 border-dashed"></div>
              <span className="text-muted-foreground">Average: {avgCycleTime.toFixed(1)} days</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Small (1-3 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Medium (4-8 pts)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-muted-foreground">Large (9+ pts)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
