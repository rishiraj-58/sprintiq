'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import PersonalReportsPage from './PersonalReportsPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  RefreshCw,
  FileSpreadsheet,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useParams } from 'next/navigation';

type ApiResponse = {
  metrics: {
    activeProjects: number;
    teamVelocityAverage: number;
    totalPointsDelivered: number;
    onTimeDeliveryPercent: number;
    workspaceCycleTimeDays: number;
  };
  burndown: Array<{ date: string; plannedPoints: number; remainingPoints: number }>;
  heatmap: {
    users: Array<{
      id: string;
      name: string;
      totals: { activeTasks: number; activePoints: number; completedTasks: number; completedPoints: number };
      perProject: Array<{ projectId: string; projectName: string; activeTasks: number; activePoints: number; completedTasks: number; completedPoints: number }>;
    }>;
    projects: Array<{ id: string; name: string }>;
  };
  projectHealth: { onTrack: number; atRisk: number; delayed: number; ahead: number };
  range: { start: string; end: string };
};

function AdminReportsView() {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) || (typeof window !== 'undefined' ? localStorage.getItem('siq:lastWorkspaceId') || '' : '');
  const [timeRange, setTimeRange] = useState<'last_7_days' | 'last_30_days' | 'last_90_days' | 'last_6_months'>('last_30_days');
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    if (timeRange === 'last_7_days') start.setDate(end.getDate() - 6);
    else if (timeRange === 'last_30_days') start.setDate(end.getDate() - 29);
    else if (timeRange === 'last_90_days') start.setDate(end.getDate() - 89);
    else start.setMonth(end.getMonth() - 6);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [timeRange]);

  const load = async () => {
    if (!workspaceId) return;
    setRefreshing(true);
    setError(null);
    try {
      const start = resolvedRange.start.toISOString();
      const end = resolvedRange.end.toISOString();
      const res = await fetch(`/api/workspaces/${workspaceId}/reports?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, timeRange]);

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'on-track':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'delayed':
        return <Clock className="h-4 w-4 text-red-500" />;
      case 'ahead':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'on-track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ahead':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 95) return 'bg-red-500';
    if (workload >= 80) return 'bg-yellow-500';
    if (workload >= 60) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getTrendIcon = (trend: string, change?: number) => {
    if (trend === 'up' || (change && change > 0)) {
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    }
    if (trend === 'down' || (change && change < 0)) {
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const handleRefresh = async () => {
    await load();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Cross-project insights and performance analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Last 30 days
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Time Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTimeRange('last_7_days')}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('last_30_days')}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('last_90_days')}>
                Last 90 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTimeRange('last_6_months')}>
                Last 6 months
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Export as PDF Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Active Projects</span>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{data?.metrics.activeProjects ?? 0}</div>
              <div className="text-xs text-muted-foreground">
                {(data?.heatmap.projects.length ?? 0)} total projects
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Team Velocity</span>
                {getTrendIcon('up', undefined)}
              </div>
              <div className="text-2xl font-bold">{Math.round((data?.metrics.teamVelocityAverage ?? 0) * 10) / 10}</div>
              <div className="text-xs text-muted-foreground">Average story points per sprint</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Points Delivered</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{data?.metrics.totalPointsDelivered ?? 0}</div>
              <div className="text-xs text-muted-foreground">in selected range</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">On-Time Delivery</span>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{Math.round((data?.metrics.onTimeDeliveryPercent ?? 0))}%</div>
              <div className="text-xs text-muted-foreground">of tasks completed on time</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cross-Project Burndown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Cross-Project Burndown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{(data?.burndown.slice(-1)[0]?.remainingPoints ?? 0)}</div>
                <div className="text-xs text-muted-foreground">Remaining Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{Math.max(0, Math.round(((data?.range?.end ? new Date(data.range.end) : new Date()).getTime() - (data?.range?.start ? new Date(data.range.start) : new Date()).getTime()) / (1000*60*60*24)) + 1)}</div>
                <div className="text-xs text-muted-foreground">Days Left</div>
              </div>
              <div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">on-track</Badge>
              </div>
            </div>
            
            {/* Simplified chart visualization with extra bottom padding to avoid overlap */}
            <div className="h-40 bg-muted/30 rounded-lg flex items-end p-4 pb-8 gap-1">
              {(data?.burndown ?? []).map((point, index, arr) => {
                const maxPlanned = Math.max(1, ...arr.map((x) => x.plannedPoints));
                const totalDays = Math.max(1, arr.length);
                const ideal = arr.length > 1 ? (arr[0].plannedPoints * (totalDays - 1 - index)) / (totalDays - 1) : arr[0]?.plannedPoints ?? 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${(point.remainingPoints / maxPlanned) * 100}%`, maxHeight: '120px' }} />
                    <div className="w-full bg-gray-300 rounded-t-sm opacity-50" style={{ height: `${(ideal / maxPlanned) * 100}%`, maxHeight: '120px' }} />
                  </div>
                );
              })}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <span>Day 1</span>
              <span>Day {Math.ceil(((data?.burndown?.length ?? 1) + 1) / 2)}</span>
              <span>Day {data?.burndown?.length ?? 1}</span>
            </div>
          </CardContent>
        </Card>

        {/* Team Velocity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Workspace Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                {Math.round((data?.metrics.teamVelocityAverage ?? 0) * 10) / 10}
                {getTrendIcon('neutral', undefined)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average Story Points per Sprint
              </div>
            </div>
            
            {/* Sprint velocity bars (aggregate view: show last few sprints across projects) */}
            <div className="space-y-3">
              {(data ? [] : []).map(() => null)}
              <div className="text-xs text-muted-foreground">Last 3 sprints averaged across projects</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resource Allocation Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(data?.heatmap.users ?? []).map((member) => {
              const initials = member.name.split(' ').map((n) => n[0]).join('');
              const workload = member.totals.activePoints + member.totals.completedPoints;
              const projects = member.perProject.map((p) => p.projectName);
              return (
                <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={undefined} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{member.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.totals.completedTasks} completed, {member.totals.activeTasks} active
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Progress value={Math.min(100, workload)} className="h-2" />
                      <div className="flex flex-wrap gap-1">
                        {projects.map((project, pIndex) => (
                          <Badge key={pIndex} variant="secondary" className="text-xs">
                            {project}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cycle Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Task Cycle Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold flex items-center justify-center gap-2">
                {Math.round((data?.metrics.workspaceCycleTimeDays ?? 0) * 10) / 10} days
                {getTrendIcon('neutral', undefined)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average time from To Do to Done
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Computed from status history across tasks</div>
          </CardContent>
        </Card>

        {/* Project Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Project Health Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Ahead</span>
                <Badge variant="outline" className={getHealthColor('ahead')}>{data?.projectHealth.ahead ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">On Track</span>
                <Badge variant="outline" className={getHealthColor('on-track')}>{data?.projectHealth.onTrack ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">At Risk</span>
                <Badge variant="outline" className={getHealthColor('at-risk')}>{data?.projectHealth.atRisk ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm">Delayed</span>
                <Badge variant="outline" className={getHealthColor('delayed')}>{data?.projectHealth.delayed ?? 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        {data ? (
          <>Range: {new Date(data.range.start).toLocaleDateString()} → {new Date(data.range.end).toLocaleDateString()}</>
        ) : (
          'Loading...'
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const lastWorkspaceId = (typeof window !== 'undefined' && localStorage.getItem('siq:lastWorkspaceId')) || undefined;
  const perms = usePermissions('workspace', lastWorkspaceId || undefined);
  const isMember = (perms.canCreate || perms.canEdit) && !(perms.canManageMembers || perms.canManageSettings);
  return isMember ? <PersonalReportsPage /> : <AdminReportsView />;
}