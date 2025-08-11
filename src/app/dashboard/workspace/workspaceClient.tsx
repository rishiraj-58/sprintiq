'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Filter, Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

interface WorkspaceDashboardClientProps {
  workspace: { id: string; name: string; description: string | null } | null;
}

// Static project data for demo
const staticProjects = [
  {
    id: '1',
    name: 'Mobile App Redesign',
    description: 'Complete overhaul of the mobile application user interface with modern design principles',
    status: 'active',
    progress: 75,
    health: 'on-track',
    teamMembers: [
      { id: '1', name: 'Sarah Chen', avatar: null },
      { id: '2', name: 'Mike Rodriguez', avatar: null },
      { id: '3', name: 'Alex Thompson', avatar: null }
    ],
    tasksCompleted: 24,
    totalTasks: 32
  },
  {
    id: '2',
    name: 'API Integration Platform',
    description: 'Build a comprehensive API gateway and integration platform for third-party services',
    status: 'active',
    progress: 45,
    health: 'at-risk',
    teamMembers: [
      { id: '4', name: 'David Kim', avatar: null },
      { id: '5', name: 'Lisa Wang', avatar: null }
    ],
    tasksCompleted: 18,
    totalTasks: 40
  },
  {
    id: '3',
    name: 'Security Audit',
    description: 'Comprehensive security review and implementation of enhanced security measures',
    status: 'planning',
    progress: 20,
    health: 'on-track',
    teamMembers: [
      { id: '6', name: 'Tom Wilson', avatar: null }
    ],
    tasksCompleted: 3,
    totalTasks: 15
  },
  {
    id: '4',
    name: 'Data Analytics Dashboard',
    description: 'Advanced analytics dashboard with real-time data visualization and reporting',
    status: 'active',
    progress: 90,
    health: 'on-track',
    teamMembers: [
      { id: '7', name: 'Emma Davis', avatar: null },
      { id: '8', name: 'James Lee', avatar: null },
      { id: '9', name: 'Sophie Taylor', avatar: null }
    ],
    tasksCompleted: 27,
    totalTasks: 30
  }
];

export function WorkspaceDashboardClient({ workspace }: WorkspaceDashboardClientProps) {
  const { setCurrentWorkspace } = useWorkspace();
  const { projects, fetchProjects, isLoading } = useProject();
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const { canManageMembers, canManageSettings } = usePermissions('workspace', workspace?.id);
  const canCreateProject = Boolean(canManageMembers || canManageSettings);

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace as any);
      localStorage.setItem('siq:lastWorkspaceId', workspace.id);
      fetchProjects(workspace.id);
    }
  }, [workspace, setCurrentWorkspace, fetchProjects]);

  if (!workspace) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'on-track':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'at-risk':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'delayed':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthBadgeColor = (health: string) => {
    switch (health) {
      case 'on-track':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredProjects = staticProjects.filter(project => {
    const matchesSearch = !query || project.name.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage all workspace projects and track their progress
          </p>
        </div>
        {canCreateProject && (
          <Link href={`/projects/new?workspaceId=${workspace.id}`}>
            <Button size="lg" className="gap-2">
              <span>Create New Project</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search projects by name..."
            className="w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All Projects
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('active')}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('planning')}>
              Planning
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
              Archived
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Project grid */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="h-full hover:shadow-md transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link href={`/projects/${project.id}`} className="block">
                      <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusBadgeColor(project.status)}>
                        {project.status}
                      </Badge>
                      <Badge variant="outline" className={getHealthBadgeColor(project.health)}>
                        <span className="flex items-center gap-1">
                          {getHealthIcon(project.health)}
                          {project.health.replace('-', ' ')}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Project</DropdownMenuItem>
                      <DropdownMenuItem>Archive Project</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
                
                {/* Progress section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{project.tasksCompleted} of {project.totalTasks} tasks</span>
                  </div>
                </div>

                {/* Team members */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Team
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.teamMembers.length} member{project.teamMembers.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.teamMembers.slice(0, 3).map((member, index) => (
                      <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+{project.teamMembers.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredProjects.length === 0 && (
            <div className="col-span-full">
              <Card className="p-12 text-center">
                <div className="space-y-3">
                  <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                    <Filter className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">No projects found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {query ? 'Try adjusting your search or filters' : 'Create your first project to get started'}
                    </p>
                  </div>
                  {!query && canCreateProject && (
                    <Link href={`/projects/new?workspaceId=${workspace.id}`}>
                      <Button className="mt-4">Create New Project</Button>
                    </Link>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


