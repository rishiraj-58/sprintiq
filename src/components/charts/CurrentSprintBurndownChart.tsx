'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SprintTask {
  id: string;
  title: string;
  status: string;
  storyPoints?: number;
  completedDate?: string;
}

interface CurrentSprintBurndownChartProps {
  sprintName: string;
  startDate: string;
  endDate: string;
  tasks: SprintTask[];
}

export function CurrentSprintBurndownChart({ 
  sprintName, 
  startDate, 
  endDate, 
  tasks 
}: CurrentSprintBurndownChartProps) {
  // Calculate total story points
  const totalStoryPoints = tasks.reduce((total, task) => total + (task.storyPoints || 0), 0);
  
  // For demo purposes, create mock burndown data
  const generateBurndownData = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.min(totalDays, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    
    const data = [];
    
    // Ideal burndown (straight line)
    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(start);
      date.setDate(date.getDate() + day);
      const idealRemaining = totalStoryPoints * (1 - day / totalDays);
      data.push({
        day,
        date: date.toLocaleDateString(),
        ideal: Math.max(0, idealRemaining)
      });
    }
    
    // Actual burndown (with some realistic variation)
    const completedTasks = tasks.filter(task => task.status === 'done');
    const completedPoints = completedTasks.reduce((total, task) => total + (task.storyPoints || 0), 0);
    const actualRemaining = totalStoryPoints - completedPoints;
    
    // Add actual data for passed days
    data.forEach((point, index) => {
      if (index <= daysPassed) {
        // Create realistic burndown with some variation
        const progress = index / totalDays;
        const actualProgress = Math.min(progress * 1.2, completedPoints / totalStoryPoints);
        (point as any).actual = totalStoryPoints * (1 - actualProgress);
      }
    });
    
    return data;
  };

  const burndownData = generateBurndownData();
  const currentRemaining = totalStoryPoints - tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Sprint Burndown: {sprintName}
          <div className="text-sm font-normal text-muted-foreground">
            {currentRemaining} / {totalStoryPoints} points remaining
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full">
          {/* Simple SVG burndown chart */}
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Ideal burndown line */}
            <line 
              x1="40" y1="20" 
              x2="360" y2="180" 
              stroke="#94a3b8" 
              strokeWidth="2" 
              strokeDasharray="5,5"
            />
            
            {/* Actual burndown line (mock data) */}
            <polyline
              points="40,20 80,25 120,35 160,50 200,70 240,95 280,120 320,140 360,165"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
            />
            
            {/* Current point */}
            <circle cx="280" cy="120" r="4" fill="#3b82f6" />
            
            {/* Labels */}
            <text x="40" y="15" fontSize="12" fill="#6b7280">Start</text>
            <text x="320" y="15" fontSize="12" fill="#6b7280">End</text>
            <text x="20" y="25" fontSize="12" fill="#6b7280">{totalStoryPoints}</text>
            <text x="20" y="185" fontSize="12" fill="#6b7280">0</text>
          </svg>
        </div>
        
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-slate-400 border-dashed"></div>
            <span className="text-muted-foreground">Ideal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span className="text-muted-foreground">Actual</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
