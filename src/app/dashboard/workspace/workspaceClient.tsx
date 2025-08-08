'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { Spinner } from '@/components/ui/spinner';

interface WorkspaceDashboardClientProps {
  workspace: { id: string; name: string; description: string | null } | null;
}

export function WorkspaceDashboardClient({ workspace }: WorkspaceDashboardClientProps) {
  const { setCurrentWorkspace } = useWorkspace();
  const { projects, fetchProjects, isLoading } = useProject();

  useEffect(() => {
    if (workspace) {
      setCurrentWorkspace(workspace);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{workspace.name}</h2>
        <p className="text-muted-foreground">{workspace.description || 'Workspace overview'}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <div className="text-sm text-muted-foreground">{projects.length} projects</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded bg-muted" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health & KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24 rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


