'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Task {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
}

interface CFDData {
  date: string;
  todo: number;
  inProgress: number;
  done: number;
  total: number;
}

interface CumulativeFlowDiagramProps {
  tasks: Task[];
  projectId: string;
  dateRange?: { start: Date; end: Date };
  className?: string;
}

export function CumulativeFlowDiagram({ 
  tasks, 
  projectId, 
  dateRange,
  className 
}: CumulativeFlowDiagramProps) {
  const chartData = useMemo(() => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    
    if (projectTasks.length === 0) return [];
    
    // Determine date range
    const startDate = dateRange?.start || new Date(Math.min(...projectTasks.map(t => t.createdAt.getTime())));
    const endDate = dateRange?.end || new Date();
    
    const data: CFDData[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const currentDateStr = current.toISOString().split('T')[0];
      
      // Count tasks in each status at this point in time
      const todoCount = projectTasks.filter(task => {
        const taskCreated = new Date(task.createdAt);
        const taskUpdated = new Date(task.updatedAt);
        
        // Task was created by this date
        if (taskCreated > current) return false;
        
        // If task was updated after this date and is not todo, it was todo at this time
        if (taskUpdated > current) {
          return true; // Assume it was todo initially
        }
        
        // Otherwise, check current status
        return task.status === 'todo' || task.status === 'pending';
      }).length;
      
      const inProgressCount = projectTasks.filter(task => {
        const taskCreated = new Date(task.createdAt);
        const taskUpdated = new Date(task.updatedAt);
        
        if (taskCreated > current) return false;
        
        if (taskUpdated > current) {
          return false; // Was still todo
        }
        
        return task.status === 'in_progress' || task.status === 'in-progress';
      }).length;
      
      const doneCount = projectTasks.filter(task => {
        const taskCreated = new Date(task.createdAt);
        const taskUpdated = new Date(task.updatedAt);
        
        if (taskCreated > current) return false;
        
        if (taskUpdated > current) {
          return false; // Was not done yet
        }
        
        return task.status === 'done' || task.status === 'completed';
      }).length;
      
      const totalTasks = projectTasks.filter(task => {
        const taskCreated = new Date(task.createdAt);
        return taskCreated <= current;
      }).length;
      
      data.push({
        date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        todo: todoCount,
        inProgress: inProgressCount,
        done: doneCount,
        total: totalTasks
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return data;
  }, [tasks, projectId, dateRange]);

  // Calculate current metrics
  const currentMetrics = useMemo(() => {
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const total = projectTasks.length;
    const todo = projectTasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
    const inProgress = projectTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
    const done = projectTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    
    return { total, todo, inProgress, done };
  }, [tasks, projectId]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Cumulative Flow Diagram</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'Number of Tasks', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    value,
                    name === 'todo' ? 'To Do' :
                    name === 'inProgress' ? 'In Progress' : 'Done'
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="done"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#22c55e"
                  name="Done"
                />
                <Area
                  type="monotone"
                  dataKey="inProgress"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="In Progress"
                />
                <Area
                  type="monotone"
                  dataKey="todo"
                  stackId="1"
                  stroke="#6b7280"
                  fill="#6b7280"
                  name="To Do"
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Current metrics */}
            <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-gray-900">{currentMetrics.total}</div>
                <div className="text-gray-500">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-gray-600">{currentMetrics.todo}</div>
                <div className="text-gray-500">To Do</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-yellow-600">{currentMetrics.inProgress}</div>
                <div className="text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{currentMetrics.done}</div>
                <div className="text-gray-500">Done</div>
              </div>
            </div>
            
            {/* Flow metrics */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Flow Insights</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500">Work in Progress:</span>
                  <span className="ml-1 font-medium">{currentMetrics.inProgress} tasks</span>
                </div>
                <div>
                  <span className="text-gray-500">Completion Rate:</span>
                  <span className="ml-1 font-medium">
                    {currentMetrics.total > 0 ? Math.round((currentMetrics.done / currentMetrics.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No task data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
