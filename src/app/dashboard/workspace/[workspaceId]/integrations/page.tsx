'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  Settings, 
  Plus,
  CheckCircle2,
  Circle,
  ExternalLink,
  Zap,
  MessageSquare,
  Code,
  Paintbrush,
  BarChart3,
  Shield,
  Mail,
  Video,
  FileText,
  GitBranch,
  Cloud,
  Smartphone,
  Calendar
} from 'lucide-react';

// Static integrations data
const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates directly in your Slack channels',
    icon: MessageSquare,
    category: 'communication',
    connected: true,
    connectionDate: '2024-01-15',
    features: ['Notifications', 'Task Updates', 'Daily Standups'],
    config: {
      workspace: 'company-team',
      channels: ['#general', '#dev-team', '#sprint-updates']
    },
    popular: true
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync commits, pull requests, and issues with your projects',
    icon: GitBranch,
    category: 'development',
    connected: true,
    connectionDate: '2024-01-10',
    features: ['Commit Tracking', 'PR Integration', 'Issue Sync'],
    config: {
      organization: 'company-org',
      repositories: ['mobile-app', 'api-platform', 'web-dashboard']
    },
    popular: true
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Embed design files and prototypes in your project documentation',
    icon: Paintbrush,
    category: 'design',
    connected: false,
    features: ['Design Embeds', 'Version Tracking', 'Comment Sync'],
    popular: true
  },
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track project performance and user engagement metrics',
    icon: BarChart3,
    category: 'analytics',
    connected: false,
    features: ['Performance Metrics', 'User Analytics', 'Custom Dashboards'],
    popular: false
  },
  {
    id: 'zoom',
    name: 'Zoom',
    description: 'Schedule and manage team meetings directly from Sprint IQ',
    icon: Video,
    category: 'communication',
    connected: true,
    connectionDate: '2024-01-08',
    features: ['Meeting Scheduling', 'Recording Integration', 'Calendar Sync'],
    config: {
      account: 'john.doe@company.com',
      defaultMeetingLength: 30
    },
    popular: false
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Attach and manage files from Google Drive in your tasks',
    icon: Cloud,
    category: 'storage',
    connected: false,
    features: ['File Attachments', 'Real-time Collaboration', 'Version History'],
    popular: true
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Automatically create bug reports from application errors',
    icon: Shield,
    category: 'monitoring',
    connected: false,
    features: ['Error Tracking', 'Performance Monitoring', 'Auto Bug Creation'],
    popular: false
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Sync customer feedback and campaign data with project insights',
    icon: Mail,
    category: 'marketing',
    connected: false,
    features: ['Campaign Analytics', 'Customer Feedback', 'A/B Test Results'],
    popular: false
  },
  {
    id: 'microsoft_teams',
    name: 'Microsoft Teams',
    description: 'Collaborate and get notifications in Microsoft Teams',
    icon: MessageSquare,
    category: 'communication',
    connected: false,
    features: ['Channel Notifications', 'File Sharing', 'Meeting Integration'],
    popular: true
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync project milestones and deadlines with your calendar',
    icon: Calendar,
    category: 'productivity',
    connected: true,
    connectionDate: '2024-01-12',
    features: ['Milestone Sync', 'Deadline Reminders', 'Team Availability'],
    config: {
      calendar: 'primary',
      reminderTime: 15
    },
    popular: true
  }
];

const categories = [
  { id: 'all', name: 'All Categories', count: integrations.length },
  { id: 'communication', name: 'Communication', count: integrations.filter(i => i.category === 'communication').length },
  { id: 'development', name: 'Development', count: integrations.filter(i => i.category === 'development').length },
  { id: 'design', name: 'Design', count: integrations.filter(i => i.category === 'design').length },
  { id: 'analytics', name: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
  { id: 'storage', name: 'Storage', count: integrations.filter(i => i.category === 'storage').length },
  { id: 'monitoring', name: 'Monitoring', count: integrations.filter(i => i.category === 'monitoring').length },
  { id: 'productivity', name: 'Productivity', count: integrations.filter(i => i.category === 'productivity').length },
  { id: 'marketing', name: 'Marketing', count: integrations.filter(i => i.category === 'marketing').length }
];

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication':
        return <MessageSquare className="h-4 w-4" />;
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'design':
        return <Paintbrush className="h-4 w-4" />;
      case 'analytics':
        return <BarChart3 className="h-4 w-4" />;
      case 'storage':
        return <Cloud className="h-4 w-4" />;
      case 'monitoring':
        return <Shield className="h-4 w-4" />;
      case 'productivity':
        return <Calendar className="h-4 w-4" />;
      case 'marketing':
        return <Mail className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'connected' && integration.connected) ||
      (statusFilter === 'available' && !integration.connected);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect Sprint IQ with your favorite tools and services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            {connectedCount} Connected
          </Badge>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Request Integration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Connected</span>
              </div>
              <div className="text-2xl font-bold">{connectedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Circle className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">Available</span>
              </div>
              <div className="text-2xl font-bold">{integrations.length - connectedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Categories</span>
              </div>
              <div className="text-2xl font-bold">{categories.length - 1}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Popular</span>
              </div>
              <div className="text-2xl font-bold">{integrations.filter(i => i.popular).length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Category: {categories.find(c => c.id === categoryFilter)?.name || 'All'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id} 
                    onClick={() => setCategoryFilter(category.id)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {getCategoryIcon(category.id)}
                      {category.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Circle className="h-4 w-4" />
                  Status: {statusFilter === 'all' ? 'All' : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  All Integrations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('connected')}>
                  Connected Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('available')}>
                  Available Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => {
          const Icon = integration.icon;
          
          return (
            <Card key={integration.id} className="relative overflow-hidden hover:shadow-md transition-all">
              {integration.popular && (
                <div className="absolute top-3 right-3">
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {integration.category}
                      </Badge>
                      {integration.connected ? (
                        <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Circle className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{integration.description}</p>
                
                {/* Features */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Features
                  </h4>
                  <ul className="space-y-1">
                    {integration.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="text-xs flex items-center gap-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Connection Info */}
                {integration.connected && integration.config && (
                  <div className="p-3 bg-muted/50 rounded-md text-xs space-y-1">
                    <div className="font-medium">Configuration:</div>
                    {Object.entries(integration.config).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground capitalize">{key}:</span>
                        <span className="font-mono">
                          {Array.isArray(value) ? `${value.length} items` : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t space-y-2">
                  {integration.connected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Settings className="h-3 w-3" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full gap-1">
                      <Plus className="h-3 w-3" />
                      Connect
                    </Button>
                  )}
                  
                  {integration.connected && integration.connectionDate && (
                    <p className="text-xs text-muted-foreground text-center">
                      Connected on {new Date(integration.connectionDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <Card className="p-12 text-center">
          <div className="space-y-3">
            <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No integrations found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Request Custom Integration */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">Don't see the integration you need?</h3>
              <p className="text-sm text-muted-foreground">
                Request a custom integration or browse our marketplace for community-built connections
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Browse Marketplace</Button>
              <Button>Request Integration</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
