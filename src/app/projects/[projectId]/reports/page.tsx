'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Filter, Download, RefreshCw } from 'lucide-react';
import { VelocityChart } from '@/components/charts/VelocityChart';
import { CumulativeFlowChart } from '@/components/charts/CumulativeFlowChart';
import { CycleTimeChart } from '@/components/charts/CycleTimeChart';
import { WorkloadDistributionChart } from '@/components/charts/WorkloadDistributionChart';

// Static data for demo
const mockVelocityData = [
  { sprintName: 'Sprint 1', completedPoints: 18, totalPoints: 25, sprintNumber: 1 },
  { sprintName: 'Sprint 2', completedPoints: 22, totalPoints: 24, sprintNumber: 2 },
  { sprintName: 'Sprint 3', completedPoints: 28, totalPoints: 30, sprintNumber: 3 },
  { sprintName: 'Sprint 4', completedPoints: 25, totalPoints: 28, sprintNumber: 4 },
  { sprintName: 'Sprint 5', completedPoints: 32, totalPoints: 35, sprintNumber: 5 },
  { sprintName: 'Sprint 6', completedPoints: 29, totalPoints: 32, sprintNumber: 6 }
];

const mockFlowData = [
  { date: '2024-01-01', backlog: 50, todo: 15, inProgress: 8, done: 25 },
  { date: '2024-01-03', backlog: 48, todo: 12, inProgress: 10, done: 28 },
  { date: '2024-01-05', backlog: 45, todo: 14, inProgress: 9, done: 32 },
  { date: '2024-01-07', backlog: 43, todo: 11, inProgress: 12, done: 35 },
  { date: '2024-01-09', backlog: 40, todo: 13, inProgress: 8, done: 38 },
  { date: '2024-01-11', backlog: 38, todo: 10, inProgress: 11, done: 42 },
  { date: '2024-01-13', backlog: 35, todo: 12, inProgress: 7, done: 45 },
  { date: '2024-01-15', backlog: 32, todo: 9, inProgress: 10, done: 48 }
];

const mockCycleTimeData = [
  { id: 'TASK-001', title: 'User authentication', cycleTime: 3.5, completedDate: '2024-01-10', storyPoints: 5 },
  { id: 'TASK-002', title: 'Dashboard layout', cycleTime: 2.0, completedDate: '2024-01-11', storyPoints: 3 },
  { id: 'TASK-003', title: 'API integration', cycleTime: 5.5, completedDate: '2024-01-12', storyPoints: 8 },
  { id: 'TASK-004', title: 'Bug fix - login', cycleTime: 1.5, completedDate: '2024-01-13', storyPoints: 2 },
  { id: 'TASK-005', title: 'Payment system', cycleTime: 8.0, completedDate: '2024-01-14', storyPoints: 13 },
  { id: 'TASK-006', title: 'User profile', cycleTime: 4.0, completedDate: '2024-01-15', storyPoints: 5 },
  { id: 'TASK-007', title: 'Search feature', cycleTime: 3.0, completedDate: '2024-01-16', storyPoints: 3 }
];

const mockWorkloadData = [
  {
    id: 'user-1',
    name: 'Sarah Chen',
    avatar: '',
    completedTasks: 8,
    completedPoints: 24,
    activeTasks: 3,
    activePoints: 12
  },
  {
    id: 'user-2',
    name: 'Mike Johnson',
    avatar: '',
    completedTasks: 6,
    completedPoints: 18,
    activeTasks: 2,
    activePoints: 8
  },
  {
    id: 'user-3',
    name: 'Alex Rivera',
    avatar: '',
    completedTasks: 5,
    completedPoints: 15,
    activeTasks: 4,
    activePoints: 15
  },
  {
    id: 'user-4',
    name: 'David Park',
    avatar: '',
    completedTasks: 7,
    completedPoints: 21,
    activeTasks: 2,
    activePoints: 6
  }
];

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  
  // Filter state
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedSprints, setSelectedSprints] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshData = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExportReports = () => {
    console.log('Exporting reports with filters:', {
      dateRange,
      selectedSprints,
      customStartDate,
      customEndDate
    });
    // In real app, this would generate and download a report
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Analytics</h1>
          <p className="text-muted-foreground">
            Analyze project trends, team performance, and delivery metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportReports}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Global Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last-7-days">Last 7 days</SelectItem>
                  <SelectItem value="last-30-days">Last 30 days</SelectItem>
                  <SelectItem value="last-90-days">Last 90 days</SelectItem>
                  <SelectItem value="current-quarter">Current quarter</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sprints</Label>
              <Select value={selectedSprints} onValueChange={setSelectedSprints}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprints" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sprints</SelectItem>
                  <SelectItem value="active">Active sprint only</SelectItem>
                  <SelectItem value="completed">Completed sprints</SelectItem>
                  <SelectItem value="last-3">Last 3 sprints</SelectItem>
                  <SelectItem value="last-6">Last 6 sprints</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                    <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                    <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </>
            )}
          </div>
          
          {(dateRange !== 'last-30-days' || selectedSprints !== 'all') && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Active Filters:</strong> {' '}
                {dateRange !== 'last-30-days' && `Date: ${dateRange.replace('-', ' ')}`}
                {dateRange !== 'last-30-days' && selectedSprints !== 'all' && ', '}
                {selectedSprints !== 'all' && `Sprints: ${selectedSprints.replace('-', ' ')}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Velocity Chart */}
        <VelocityChart sprintData={mockVelocityData} />

        {/* Cumulative Flow Diagram */}
        <CumulativeFlowChart flowData={mockFlowData} />

        {/* Cycle Time Chart */}
        <CycleTimeChart cycleData={mockCycleTimeData} />

        {/* Workload Distribution */}
        <WorkloadDistributionChart workloadData={mockWorkloadData} />
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {(mockVelocityData.reduce((sum, s) => sum + s.completedPoints, 0) / mockVelocityData.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Velocity</div>
              <div className="text-xs text-muted-foreground">points per sprint</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(mockCycleTimeData.reduce((sum, t) => sum + t.cycleTime, 0) / mockCycleTimeData.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Cycle Time</div>
              <div className="text-xs text-muted-foreground">days per task</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {mockWorkloadData.reduce((sum, m) => sum + m.completedPoints, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Points Delivered</div>
              <div className="text-xs text-muted-foreground">this period</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((mockVelocityData.reduce((sum, s) => sum + s.completedPoints, 0) / mockVelocityData.reduce((sum, s) => sum + s.totalPoints, 0)) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Delivery Efficiency</div>
              <div className="text-xs text-muted-foreground">completed vs planned</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


