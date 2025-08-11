'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Static reports data
const reportData = {
  timeRange: 'last_30_days',
  lastUpdated: '2024-01-18T10:30:00Z',
  
  overview: {
    totalProjects: 12,
    activeProjects: 8,
    completedSprints: 24,
    totalStoryPoints: 486,
    completedStoryPoints: 378,
    teamMembers: 15,
    avgVelocity: 32.5,
    onTimeDelivery: 85
  },

  crossProjectBurndown: {
    totalPoints: 486,
    remainingPoints: 108,
    daysLeft: 14,
    trend: 'on-track',
    dailyData: [
      { day: 1, remaining: 486, ideal: 486 },
      { day: 5, remaining: 450, ideal: 450 },
      { day: 10, remaining: 380, ideal: 380 },
      { day: 15, remaining: 280, ideal: 300 },
      { day: 20, remaining: 180, ideal: 200 },
      { day: 25, remaining: 120, ideal: 120 },
      { day: 30, remaining: 108, ideal: 50 }
    ]
  },

  velocityTrend: {
    average: 32.5,
    trend: 'up',
    change: 8.5,
    sprintData: [
      { sprint: 'Sprint 1', velocity: 28, planned: 30 },
      { sprint: 'Sprint 2', velocity: 35, planned: 32 },
      { sprint: 'Sprint 3', velocity: 29, planned: 28 },
      { sprint: 'Sprint 4', velocity: 38, planned: 35 },
      { sprint: 'Sprint 5', velocity: 41, planned: 38 }
    ]
  },

  resourceHeatmap: [
    { member: 'Sarah Chen', projects: ['Mobile App', 'API Platform'], workload: 95, capacity: 100 },
    { member: 'Mike Rodriguez', projects: ['Mobile App', 'Analytics'], workload: 80, capacity: 100 },
    { member: 'Alex Thompson', projects: ['Security Audit'], workload: 60, capacity: 100 },
    { member: 'Emma Davis', projects: ['Analytics', 'Documentation'], workload: 90, capacity: 100 },
    { member: 'David Kim', projects: ['API Platform'], workload: 75, capacity: 100 },
    { member: 'Lisa Wang', projects: ['API Platform', 'Mobile App'], workload: 85, capacity: 100 },
    { member: 'Tom Wilson', projects: ['Security Audit'], workload: 40, capacity: 100 },
    { member: 'James Lee', projects: ['Analytics'], workload: 70, capacity: 100 }
  ],

  cycleTime: {
    average: 5.2,
    trend: 'down',
    change: -1.3,
    breakdown: [
      { stage: 'To Do → In Progress', average: 0.5, color: 'bg-blue-500' },
      { stage: 'In Progress → Review', average: 2.8, color: 'bg-yellow-500' },
      { stage: 'Review → Testing', average: 1.2, color: 'bg-orange-500' },
      { stage: 'Testing → Done', average: 0.7, color: 'bg-green-500' }
    ]
  },

  projectHealth: [
    { name: 'Mobile App Redesign', health: 'on-track', progress: 75, dueDate: '2024-02-15', risk: 'low' },
    { name: 'API Integration Platform', health: 'at-risk', progress: 45, dueDate: '2024-02-28', risk: 'medium' },
    { name: 'Security Audit', health: 'on-track', progress: 20, dueDate: '2024-03-10', risk: 'low' },
    { name: 'Data Analytics Dashboard', health: 'ahead', progress: 90, dueDate: '2024-01-30', risk: 'low' },
    { name: 'Documentation Update', health: 'delayed', progress: 30, dueDate: '2024-01-25', risk: 'high' }
  ]
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('last_30_days');
  const [refreshing, setRefreshing] = useState(false);

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
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
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
              <div className="text-2xl font-bold">{reportData.overview.activeProjects}</div>
              <div className="text-xs text-muted-foreground">
                {reportData.overview.totalProjects} total projects
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Team Velocity</span>
                {getTrendIcon('up', reportData.velocityTrend.change)}
              </div>
              <div className="text-2xl font-bold">{reportData.overview.avgVelocity}</div>
              <div className="text-xs text-muted-foreground">
                +{reportData.velocityTrend.change} from last period
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Story Points</span>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">
                {reportData.overview.completedStoryPoints}/{reportData.overview.totalStoryPoints}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round((reportData.overview.completedStoryPoints / reportData.overview.totalStoryPoints) * 100)}% completed
              </div>
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
              <div className="text-2xl font-bold">{reportData.overview.onTimeDelivery}%</div>
              <div className="text-xs text-muted-foreground">
                {reportData.overview.completedSprints} sprints completed
              </div>
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
                <div className="text-2xl font-bold text-blue-600">
                  {reportData.crossProjectBurndown.remainingPoints}
                </div>
                <div className="text-xs text-muted-foreground">Remaining Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.crossProjectBurndown.daysLeft}
                </div>
                <div className="text-xs text-muted-foreground">Days Left</div>
              </div>
              <div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  {reportData.crossProjectBurndown.trend}
                </Badge>
              </div>
            </div>
            
            {/* Simplified chart visualization */}
            <div className="h-32 bg-muted/30 rounded-lg flex items-end p-4 gap-1">
              {reportData.crossProjectBurndown.dailyData.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t-sm" 
                    style={{ height: `${(point.remaining / 486) * 80}px` }}
                  />
                  <div 
                    className="w-full bg-gray-300 rounded-t-sm opacity-50" 
                    style={{ height: `${(point.ideal / 486) * 80}px` }}
                  />
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day 30</span>
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
                {reportData.velocityTrend.average}
                {getTrendIcon(reportData.velocityTrend.trend, reportData.velocityTrend.change)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average Story Points per Sprint
              </div>
            </div>
            
            {/* Sprint velocity bars */}
            <div className="space-y-3">
              {reportData.velocityTrend.sprintData.map((sprint, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{sprint.sprint}</span>
                    <span className="font-medium">{sprint.velocity} pts</span>
                  </div>
                  <div className="relative">
                    <Progress value={(sprint.velocity / 45) * 100} className="h-2" />
                    <div 
                      className="absolute top-0 w-0.5 h-2 bg-gray-400"
                      style={{ left: `${(sprint.planned / 45) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
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
            {reportData.resourceHeatmap.map((member, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={undefined} />
                  <AvatarFallback className="text-xs">
                    {member.member.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{member.member}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.workload}% workload
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={member.workload} 
                      className="h-2"
                    />
                    <div className="flex flex-wrap gap-1">
                      {member.projects.map((project, pIndex) => (
                        <Badge key={pIndex} variant="secondary" className="text-xs">
                          {project}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className={`w-4 h-4 rounded ${getWorkloadColor(member.workload)}`} />
              </div>
            ))}
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
                {reportData.cycleTime.average} days
                {getTrendIcon(reportData.cycleTime.trend, reportData.cycleTime.change)}
              </div>
              <div className="text-sm text-muted-foreground">
                Average time from To Do to Done
              </div>
            </div>
            
            <div className="space-y-3">
              {reportData.cycleTime.breakdown.map((stage, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{stage.stage}</span>
                    <span className="font-medium">{stage.average} days</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${(stage.average / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
            {reportData.projectHealth.map((project, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{project.name}</span>
                    {getHealthIcon(project.health)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Due: {new Date(project.dueDate).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <Badge variant="outline" className={getHealthColor(project.health)}>
                    {project.health.replace('-', ' ')}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {project.progress}% complete
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {new Date(reportData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}