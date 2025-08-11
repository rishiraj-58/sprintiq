'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { CreateProjectForm } from '@/components/projects/CreateProjectForm';

export function ProjectsClientPage() {
  const { currentWorkspace } = useWorkspace();
  const { projects, isLoading, error, fetchProjects } = useProject();

  const { canManageMembers, canManageSettings } = usePermissions('workspace', currentWorkspace?.id);
  const canCreateProject = Boolean(canManageMembers || canManageSettings);



  useEffect(() => {
    if (currentWorkspace?.id) {
      localStorage.setItem('siq:lastWorkspaceId', currentWorkspace.id);
      fetchProjects(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchProjects]);

  // The DashboardProvider now handles the initial load, so we only need to check for currentWorkspace
  if (!currentWorkspace) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Select a workspace</h3>
          <p className="text-sm text-muted-foreground">
            No workspace is currently selected.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            You are viewing projects in <strong>{currentWorkspace.name}</strong>.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            You are viewing projects in <strong>{currentWorkspace.name}</strong>.
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error loading projects</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => fetchProjects(currentWorkspace.id)} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">
            You are viewing projects in <strong>{currentWorkspace.name}</strong>.
          </p>
        </div>
        
        {/* Create Project Button */}
        {canCreateProject && (
          <CreateProjectForm>
            <Button>Create Project</Button>
          </CreateProjectForm>
        )}
        

      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {canCreateProject ? "Create your first project to get started." : "You have not been assigned to any projects yet."}
          </p>
          {canCreateProject && (
            <CreateProjectForm>
              <Button>Create Your First Project</Button>
            </CreateProjectForm>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    <Badge 
                      variant={project.status === 'active' ? 'default' : 'secondary'}
                      className="ml-2 flex-shrink-0"
                    >
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {project.description || 'No description provided'}
                  </CardDescription>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Unknown date'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}