'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BurndownData {
  date: string;
  idealRemaining: number;
  actualRemaining: number;
  completed: number;
}

interface Sprint {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  sprintId?: string;
  createdAt: Date;
  updatedAt: Date;
  storyPoints?: number;
}

interface BurndownChartProps {
  sprints: Sprint[];
  tasks: Task[];
  selectedSprintId?: string;
  className?: string;
}

export function BurndownChart({ sprints, tasks, selectedSprintId, className }: BurndownChartProps) {
  const chartData = useMemo(() => {
    const targetSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];
    if (!targetSprint) return [];

    const sprintTasks = tasks.filter(t => t.sprintId === targetSprint.id);
    const totalStoryPoints = sprintTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
    
    const startDate = new Date(targetSprint.startDate);
    const endDate = new Date(targetSprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const data: BurndownData[] = [];
    
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Calculate ideal remaining (linear burndown)
      const idealRemaining = totalStoryPoints * (1 - (i / totalDays));
      
      // Calculate actual remaining based on completed tasks
      const completedTasks = sprintTasks.filter(task => {
        const completedDate = new Date(task.updatedAt);
        return (task.status === 'done' || task.status === 'completed') && 
               completedDate <= currentDate;
      });
      
      const completedPoints = completedTasks.reduce((sum, task) => sum + (task.storyPoints || 1), 0);
      const actualRemaining = Math.max(0, totalStoryPoints - completedPoints);
      
      data.push({
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        idealRemaining: Math.max(0, idealRemaining),
        actualRemaining,
        completed: completedPoints
      });
    }
    
    return data;
  }, [sprints, tasks, selectedSprintId]);

  const selectedSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          Burndown Chart
          {selectedSprint && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({selectedSprint.name})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                label={{ value: 'Story Points', angle: -90, position: 'insideLeft' }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  value.toFixed(1),
                  name === 'idealRemaining' ? 'Ideal Remaining' :
                  name === 'actualRemaining' ? 'Actual Remaining' : 'Completed'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="idealRemaining"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                name="Ideal Remaining"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="actualRemaining"
                stroke="#ef4444"
                strokeWidth={2}
                name="Actual Remaining"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                name="Completed"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No sprint data available
          </div>
        )}
        
        {selectedSprint && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900">
                {tasks.filter(t => t.sprintId === selectedSprint.id).length}
              </div>
              <div className="text-gray-500">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {tasks.filter(t => t.sprintId === selectedSprint.id && (t.status === 'done' || t.status === 'completed')).length}
              </div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">
                {tasks.filter(t => t.sprintId === selectedSprint.id && t.status !== 'done' && t.status !== 'completed').length}
              </div>
              <div className="text-gray-500">Remaining</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
