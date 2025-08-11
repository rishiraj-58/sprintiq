'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SprintData {
  sprintName: string;
  completedPoints: number;
  totalPoints: number;
  sprintNumber: number;
}

interface VelocityChartProps {
  sprintData: SprintData[];
}

export function VelocityChart({ sprintData }: VelocityChartProps) {
  // Calculate rolling average (last 3 sprints)
  const calculateRollingAverage = (data: SprintData[], index: number, window: number = 3) => {
    const start = Math.max(0, index - window + 1);
    const slice = data.slice(start, index + 1);
    const sum = slice.reduce((acc, sprint) => acc + sprint.completedPoints, 0);
    return sum / slice.length;
  };

  const maxPoints = Math.max(...sprintData.map(s => s.completedPoints), 40);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Team Velocity
          <div className="text-sm font-normal text-muted-foreground">
            Story points per sprint
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          <svg className="w-full h-full" viewBox="0 0 500 240">
            {/* Grid lines */}
            <defs>
              <pattern id="velocity-grid" width="50" height="24" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 24" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#velocity-grid)" />
            
            {/* Y-axis labels */}
            {[0, 10, 20, 30, 40].map((value, index) => (
              <g key={value}>
                <text 
                  x="25" 
                  y={220 - (value / maxPoints) * 200} 
                  fontSize="10" 
                  fill="#6b7280" 
                  textAnchor="end"
                >
                  {value}
                </text>
                <line
                  x1="30"
                  y1={220 - (value / maxPoints) * 200}
                  x2="470"
                  y2={220 - (value / maxPoints) * 200}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              </g>
            ))}
            
            {/* Velocity bars */}
            {sprintData.map((sprint, index) => {
              const barWidth = 30;
              const x = 50 + index * 60;
              const barHeight = (sprint.completedPoints / maxPoints) * 200;
              const y = 220 - barHeight;
              
              return (
                <g key={sprint.sprintNumber}>
                  {/* Completed points bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill="#3b82f6"
                    opacity="0.8"
                  />
                  
                  {/* Total points outline */}
                  <rect
                    x={x}
                    y={220 - (sprint.totalPoints / maxPoints) * 200}
                    width={barWidth}
                    height={(sprint.totalPoints / maxPoints) * 200}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                  />
                  
                  {/* Sprint label */}
                  <text
                    x={x + barWidth / 2}
                    y={235}
                    fontSize="9"
                    fill="#6b7280"
                    textAnchor="middle"
                    transform={`rotate(-45, ${x + barWidth / 2}, 235)`}
                  >
                    {sprint.sprintName}
                  </text>
                  
                  {/* Value label */}
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="10"
                    fill="#1f2937"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {sprint.completedPoints}
                  </text>
                </g>
              );
            })}
            
            {/* Rolling average line */}
            <polyline
              points={sprintData.map((sprint, index) => {
                const x = 50 + index * 60 + 15; // Center of bar
                const avgPoints = calculateRollingAverage(sprintData, index);
                const y = 220 - (avgPoints / maxPoints) * 200;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              opacity="0.8"
            />
            
            {/* Rolling average points */}
            {sprintData.map((sprint, index) => {
              const x = 50 + index * 60 + 15;
              const avgPoints = calculateRollingAverage(sprintData, index);
              const y = 220 - (avgPoints / maxPoints) * 200;
              
              return (
                <circle
                  key={`avg-${index}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#f59e0b"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 opacity-80"></div>
            <span className="text-muted-foreground">Completed Points</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 border border-slate-400 border-dashed"></div>
            <span className="text-muted-foreground">Planned Points</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-amber-500"></div>
            <span className="text-muted-foreground">3-Sprint Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
