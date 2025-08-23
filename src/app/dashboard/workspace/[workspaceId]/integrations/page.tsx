'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Calendar,
  X
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
  const [githubIntegration, setGithubIntegration] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableRepositories, setAvailableRepositories] = useState<any[]>([]);
  const [linkedRepositories, setLinkedRepositories] = useState<any[]>([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [showRepositoryManager, setShowRepositoryManager] = useState(false);
  
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const workspaceId = params.workspaceId as string;

  // Check for success messages from OAuth callback
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'github_connected') {
      toast({
        title: 'GitHub Connected',
        description: 'Successfully connected GitHub to your workspace.',
      });
      // Remove query params from URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect GitHub integration.',
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, toast]);

  // Fetch GitHub integration status and repositories
  useEffect(() => {
    const fetchGithubIntegration = async () => {
      try {
        const res = await fetch(`/api/github/status?workspace_id=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setGithubIntegration(data.integration);
        }
      } catch (error) {
        console.error('Error fetching GitHub integration:', error);
      }
    };

    if (workspaceId) {
      fetchGithubIntegration();
    }
  }, [workspaceId]);

  // Fetch repositories when GitHub integration is available
  const loadRepositories = async () => {
    if (!githubIntegration) return;

    try {
      setRepositoriesLoading(true);

      // Fetch available repositories
      const reposRes = await fetch(`/api/github/repositories?workspace_id=${workspaceId}`);
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setAvailableRepositories(reposData.repositories || []);
      }
    } catch (error) {
      console.error('Error loading repositories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load GitHub repositories.',
        variant: 'destructive',
      });
    } finally {
      setRepositoriesLoading(false);
    }
  };

  useEffect(() => {
    if (githubIntegration && showRepositoryManager) {
      loadRepositories();
    }
  }, [githubIntegration, showRepositoryManager]);

  const handleGithubConnect = async () => {
    setIsConnecting(true);
    try {
      window.location.href = `/api/github/auth?workspace_id=${workspaceId}`;
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Failed to initiate GitHub connection.',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  const handleGithubDisconnect = async () => {
    try {
      const res = await fetch(`/api/github/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (res.ok) {
        setGithubIntegration(null);
        toast({
          title: 'GitHub Disconnected',
          description: 'Successfully disconnected GitHub integration.',
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      toast({
        title: 'Disconnection Error',
        description: 'Failed to disconnect GitHub integration.',
        variant: 'destructive',
      });
    }
  };

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

  // Update integrations data with real GitHub status
  const updatedIntegrations = integrations.map(integration => {
    if (integration.id === 'github') {
      return {
        ...integration,
        connected: !!githubIntegration,
        connectionDate: githubIntegration?.createdAt ? new Date(githubIntegration.createdAt).toISOString().split('T')[0] : undefined,
        config: githubIntegration ? {
          organization: githubIntegration.githubOrgName,
          repositories: availableRepositories,
        } : undefined,
      };
    }
    return integration;
  });

  const filteredIntegrations = updatedIntegrations.filter(integration => {
    const matchesSearch = !searchQuery || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || integration.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'connected' && integration.connected) ||
      (statusFilter === 'available' && !integration.connected);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const connectedCount = updatedIntegrations.filter(i => i.connected).length;

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
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        disabled={integration.id !== 'github'}
                        onClick={() => integration.id === 'github' && setShowRepositoryManager(true)}
                      >
                        <Settings className="h-3 w-3" />
                        Configure
                      </Button>
                      {integration.id === 'github' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1"
                          onClick={handleGithubDisconnect}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full gap-1"
                      onClick={integration.id === 'github' ? handleGithubConnect : undefined}
                      disabled={integration.id !== 'github' || isConnecting}
                    >
                      <Plus className="h-3 w-3" />
                      {integration.id === 'github' && isConnecting ? 'Connecting...' : 'Connect'}
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

      {/* GitHub Repository Manager Dialog */}
      <Dialog open={showRepositoryManager} onOpenChange={setShowRepositoryManager}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              GitHub Repository Manager
            </DialogTitle>
            <DialogDescription>
              Manage repositories for your workspace. These repositories will be available for linking to projects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Integration Status */}
            {githubIntegration && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">GitHub Connected</h4>
                    <p className="text-sm text-green-700">
                      Organization: {githubIntegration.githubOrgName}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGithubDisconnect}
                >
                  Disconnect
                </Button>
              </div>
            )}

            {/* Available Repositories */}
            <div>
              <h4 className="font-medium mb-4">Available Repositories</h4>

              {repositoriesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading repositories...</p>
                </div>
              ) : availableRepositories.length === 0 ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No repositories found. Make sure you have access to repositories in the organization.
                  </p>
                  <Button
                    variant="outline"
                    onClick={loadRepositories}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableRepositories.map((repo: any) => (
                    <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <h5 className="font-medium text-sm">{repo.name}</h5>
                          <p className="text-xs text-muted-foreground">{repo.fullName}</p>
                          {repo.description && (
                            <p className="text-xs text-muted-foreground mt-1">{repo.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {repo.defaultBranch}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(repo.htmlUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">How to use repositories</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Repositories listed here are available from your connected GitHub organization</li>
                <li>• To link a repository to a specific project, go to Project Settings → Integrations</li>
                <li>• Once linked, you can create branches and track PRs directly from tasks</li>
                <li>• Repository access requires appropriate GitHub permissions</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
