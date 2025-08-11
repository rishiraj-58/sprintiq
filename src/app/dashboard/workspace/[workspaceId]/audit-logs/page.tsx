'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Shield,
  User,
  Settings,
  Trash2,
  Plus,
  Edit,
  Eye,
  UserPlus,
  UserMinus,
  FileText,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

// Static audit log data
const auditLogs = [
  {
    id: 'audit_001',
    timestamp: '2024-01-18T10:30:00Z',
    user: {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@company.com',
      avatar: null
    },
    action: 'project_deleted',
    actionType: 'delete',
    description: 'Deleted project "Legacy System Migration"',
    details: {
      projectId: 'proj_456',
      projectName: 'Legacy System Migration'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'high'
  },
  {
    id: 'audit_002',
    timestamp: '2024-01-18T09:15:00Z',
    user: {
      id: 'user_2',
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      avatar: null
    },
    action: 'user_role_changed',
    actionType: 'modify',
    description: 'Changed role for mike@company.com from Member to Manager',
    details: {
      targetUser: 'mike@company.com',
      previousRole: 'member',
      newRole: 'manager'
    },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'medium'
  },
  {
    id: 'audit_003',
    timestamp: '2024-01-18T08:45:00Z',
    user: {
      id: 'user_3',
      name: 'Mike Rodriguez',
      email: 'mike@company.com',
      avatar: null
    },
    action: 'workspace_settings_updated',
    actionType: 'modify',
    description: 'Updated workspace security settings',
    details: {
      changes: ['two_factor_required', 'sso_enabled']
    },
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'medium'
  },
  {
    id: 'audit_004',
    timestamp: '2024-01-17T16:20:00Z',
    user: {
      id: 'user_4',
      name: 'Alex Thompson',
      email: 'alex@company.com',
      avatar: null
    },
    action: 'user_invited',
    actionType: 'create',
    description: 'Invited new user lisa@company.com as Viewer',
    details: {
      invitedEmail: 'lisa@company.com',
      role: 'viewer'
    },
    ipAddress: '192.168.1.115',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    severity: 'low'
  },
  {
    id: 'audit_005',
    timestamp: '2024-01-17T14:30:00Z',
    user: {
      id: 'user_1',
      name: 'John Doe',
      email: 'john@company.com',
      avatar: null
    },
    action: 'project_created',
    actionType: 'create',
    description: 'Created new project "Mobile App v2.0"',
    details: {
      projectId: 'proj_789',
      projectName: 'Mobile App v2.0'
    },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'low'
  },
  {
    id: 'audit_006',
    timestamp: '2024-01-17T11:15:00Z',
    user: {
      id: 'user_5',
      name: 'Emma Davis',
      email: 'emma@company.com',
      avatar: null
    },
    action: 'billing_updated',
    actionType: 'modify',
    description: 'Updated payment method',
    details: {
      paymentMethod: 'Visa ending in 4242'
    },
    ipAddress: '192.168.1.120',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    severity: 'medium'
  },
  {
    id: 'audit_007',
    timestamp: '2024-01-16T15:45:00Z',
    user: {
      id: 'user_2',
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      avatar: null
    },
    action: 'failed_login_attempt',
    actionType: 'security',
    description: 'Failed login attempt from unusual location',
    details: {
      location: 'Tokyo, Japan',
      attempts: 3
    },
    ipAddress: '203.0.113.15',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    severity: 'high'
  },
  {
    id: 'audit_008',
    timestamp: '2024-01-16T12:00:00Z',
    user: {
      id: 'user_6',
      name: 'David Kim',
      email: 'david@company.com',
      avatar: null
    },
    action: 'integration_connected',
    actionType: 'create',
    description: 'Connected Slack integration',
    details: {
      integration: 'Slack',
      workspace: 'company-team'
    },
    ipAddress: '192.168.1.125',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    severity: 'low'
  }
];

const actionTypes = ['all', 'create', 'modify', 'delete', 'security'];
const severityLevels = ['all', 'low', 'medium', 'high'];

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7_days');

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'modify':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'security':
        return <Shield className="h-4 w-4 text-orange-600" />;
      default:
        return <Eye className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchQuery || 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    
    return matchesSearch && matchesAction && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Security and activity logs for your workspace
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search logs by user, action, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Action: {actionFilter === 'all' ? 'All' : actionFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Action</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {actionTypes.map((type) => (
                  <DropdownMenuItem 
                    key={type} 
                    onClick={() => setActionFilter(type)}
                    className="capitalize"
                  >
                    {type === 'all' ? 'All Actions' : type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Severity: {severityFilter === 'all' ? 'All' : severityFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Severity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {severityLevels.map((level) => (
                  <DropdownMenuItem 
                    key={level} 
                    onClick={() => setSeverityFilter(level)}
                    className="capitalize"
                  >
                    {level === 'all' ? 'All Levels' : level}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Last 7 days
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Date Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Last 24 hours</DropdownMenuItem>
                <DropdownMenuItem>Last 7 days</DropdownMenuItem>
                <DropdownMenuItem>Last 30 days</DropdownMenuItem>
                <DropdownMenuItem>Last 90 days</DropdownMenuItem>
                <DropdownMenuItem>Custom range</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Timeline</span>
            <Badge variant="outline">
              {filteredLogs.length} events
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {filteredLogs.map((log, index) => {
              const timestamp = formatTimestamp(log.timestamp);
              
              return (
                <div key={log.id}>
                  <div className="p-6 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Action Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.actionType)}
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={log.user.avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {log.user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {log.user.name}
                            </span>
                            <Badge variant="outline" className={getSeverityBadgeColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{timestamp.date}</div>
                            <div>{timestamp.time}</div>
                          </div>
                        </div>

                        <p className="text-sm">{log.description}</p>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            {log.ipAddress}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Event ID: {log.id}
                          </div>
                        </div>

                        {/* Additional Details */}
                        {Object.keys(log.details).length > 0 && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-md text-xs">
                            <div className="font-medium mb-1">Details:</div>
                            <div className="space-y-1">
                              {Object.entries(log.details).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="w-24 text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                                  </span>
                                  <span className="font-mono">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < filteredLogs.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>

          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <div className="space-y-3">
                <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-medium">No audit logs found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your search criteria or date range
                  </p>
                </div>
              </div>
            </div>
          )}

          {filteredLogs.length > 0 && (
            <div className="p-6 border-t">
              <Button variant="outline" className="w-full">
                Load More Events
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}