'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  HardDrive, 
  FolderOpen, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Calendar,
  Activity
} from 'lucide-react';

// Static usage data
const usageData = {
  planName: 'Pro',
  billingCycle: 'monthly',
  resetDate: '2024-02-15',
  metrics: [
    {
      id: 'seats',
      name: 'Team Members',
      description: 'Active users in your workspace',
      icon: Users,
      current: 15,
      limit: 20,
      unit: 'members',
      status: 'healthy',
      trend: '+2 this month'
    },
    {
      id: 'storage',
      name: 'File Storage',
      description: 'Total storage used across all projects',
      icon: HardDrive,
      current: 30.5,
      limit: 100,
      unit: 'GB',
      status: 'healthy',
      trend: '+5.2 GB this month'
    },
    {
      id: 'projects',
      name: 'Active Projects',
      description: 'Projects currently in development',
      icon: FolderOpen,
      current: 8,
      limit: 10,
      unit: 'projects',
      status: 'warning',
      trend: '+1 this month'
    },
    {
      id: 'ai_credits',
      name: 'AI Credits',
      description: 'AI-powered features and suggestions',
      icon: Zap,
      current: 1850,
      limit: 2000,
      unit: 'credits',
      status: 'warning',
      trend: '+150 this week'
    }
  ],
  breakdown: {
    storageByType: [
      { type: 'Images & Media', usage: 18.2, percentage: 60 },
      { type: 'Documents', usage: 8.1, percentage: 27 },
      { type: 'Attachments', usage: 4.2, percentage: 13 }
    ],
    topProjects: [
      { name: 'Mobile App Redesign', storage: 12.3, members: 5 },
      { name: 'API Platform', storage: 8.7, members: 3 },
      { name: 'Analytics Dashboard', storage: 6.1, members: 4 },
      { name: 'Security Audit', storage: 3.4, members: 2 }
    ]
  }
};

export default function UsagePage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage & Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your resource consumption and plan limits
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-sm text-muted-foreground">Current Plan</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
              {usageData.planName}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Resets {usageData.resetDate}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {usageData.metrics.map((metric) => {
          const Icon = metric.icon;
          const percentage = (metric.current / metric.limit) * 100;
          const isNearLimit = percentage >= 80;
          
          return (
            <Card key={metric.id} className={`${isNearLimit ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {getStatusIcon(metric.status)}
                </div>
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metric.description}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {metric.current.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {metric.limit.toLocaleString()} {metric.unit}
                    </span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {metric.trend}
                    </span>
                  </div>
                </div>
                
                {isNearLimit && (
                  <div className="pt-2 border-t">
                    <Button size="sm" variant="outline" className="w-full text-xs">
                      Upgrade Plan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Storage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageData.breakdown.storageByType.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.type}</span>
                  <span className="text-muted-foreground">{item.usage} GB</span>
                </div>
                <Progress value={item.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-right">
                  {item.percentage}% of total storage
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                View Detailed Storage Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Projects by Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Resource Usage by Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {usageData.breakdown.topProjects.map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{project.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-3 w-3" />
                        {project.storage} GB
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.members} members
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <Button variant="outline" size="sm" className="w-full">
                View All Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Trends & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usage Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg bg-blue-50/50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Storage Optimization</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Consider archiving old project files to free up 8.3 GB of storage space.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-yellow-50/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Approaching Limits</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You're close to your project and AI credit limits. Consider upgrading your plan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Need more resources?</h4>
                <p className="text-sm text-muted-foreground">
                  Upgrade to Enterprise for unlimited projects and enhanced features.
                </p>
              </div>
              <Button>Upgrade Plan</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}