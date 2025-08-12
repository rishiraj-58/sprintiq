"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
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

type ApiResponse = {
  metrics: {
    averageVelocity: number;
    averageCycleTimeDays: number;
    totalPointsDelivered: number;
    deliveryEfficiencyPercent: number;
  };
  velocity: Array<{ sprintId: string; sprintName: string; completedPoints: number; totalPoints: number; startDate: string | null; endDate: string | null }>;
  cumulativeFlow: Array<{ date: string; backlog: number; todo: number; inProgress: number; done: number }>;
  workload: Array<{ id: string; name: string; completedTasks: number; completedPoints: number; activeTasks: number; activePoints: number }>;
  range: { start: string; end: string };
};

export default function ProjectReportsPage() {
  const params = useParams();
  const projectId = params?.projectId as string;
  
  // Filter state
  const [dateRange, setDateRange] = useState('last-30-days');
  const [selectedSprints, setSelectedSprints] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedRange = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (dateRange === 'last-7-days') start.setDate(end.getDate() - 6);
    else if (dateRange === 'last-30-days') start.setDate(end.getDate() - 29);
    else if (dateRange === 'last-90-days') start.setDate(end.getDate() - 89);
    else if (dateRange === 'current-quarter') {
      const month = end.getMonth();
      const quarterStartMonth = Math.floor(month / 3) * 3;
      start = new Date(end.getFullYear(), quarterStartMonth, 1);
    } else if (dateRange === 'custom') {
      start = customStartDate ? new Date(customStartDate) : start;
      return { start, end: customEndDate ? new Date(customEndDate) : end };
    }
    return { start, end };
  }, [dateRange, customStartDate, customEndDate]);

  const fetchReports = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start: resolvedRange.start.toISOString().slice(0, 10),
        end: resolvedRange.end.toISOString().slice(0, 10),
      });
      const res = await fetch(`/api/projects/${projectId}/reports?${params.toString()}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) throw new Error(await res.text());
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e?.message || 'Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, resolvedRange.start, resolvedRange.end]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefreshData = () => {
    fetchReports();
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

      {/* Error banner */}
      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">{error}</div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Velocity Chart */}
        <VelocityChart
          sprintData={(data?.velocity ?? []).map((v, idx) => ({
            sprintName: v.sprintName,
            completedPoints: v.completedPoints,
            totalPoints: v.totalPoints,
            sprintNumber: idx + 1,
          }))}
        />

        {/* Cumulative Flow Diagram */}
        <CumulativeFlowChart flowData={data?.cumulativeFlow ?? []} />

        {/* Cycle Time Chart */}
        <CycleTimeChart
          cycleData={(() => {
            // For now, we show only the average line derived from metrics and omit points.
            // Enhance later if per-task cycle breakdown is needed client-side.
            const avg = data?.metrics.averageCycleTimeDays ?? 0;
            if (!avg) return [];
            // Fabricate a simple series to visualize the average reference line.
            return [
              { id: 'avg-1', title: 'Average', cycleTime: avg, completedDate: resolvedRange.start.toISOString() },
              { id: 'avg-2', title: 'Average', cycleTime: avg, completedDate: resolvedRange.end.toISOString() },
            ];
          })()}
        />

        {/* Workload Distribution */}
        <WorkloadDistributionChart workloadData={data?.workload ?? []} />
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
                {(data?.metrics.averageVelocity ?? 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Velocity</div>
              <div className="text-xs text-muted-foreground">points per sprint</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {(data?.metrics.averageCycleTimeDays ?? 0).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Average Cycle Time</div>
              <div className="text-xs text-muted-foreground">days per task</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data?.metrics.totalPointsDelivered ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Points Delivered</div>
              <div className="text-xs text-muted-foreground">this period</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((data?.metrics.deliveryEfficiencyPercent ?? 0))}%
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


