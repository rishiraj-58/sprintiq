'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface WorkspaceDashboardClientProps {
  workspace: { id: string; name: string; description: string | null } | null;
}

export function WorkspaceDashboardClient({ workspace }: WorkspaceDashboardClientProps) {
  const { setCurrentWorkspace } = useWorkspace();
  const { projects, fetchProjects, isLoading } = useProject();
  const [query, setQuery] = React.useState('');

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/projects/new?workspaceId=${workspace.id}`}>
          <Button>New Project</Button>
        </Link>
        <Input
          placeholder="Search projects"
          className="w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading projects…</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects
            .filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase()))
            .map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="h-full hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="truncate">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="line-clamp-2 text-sm text-muted-foreground">{p.description || 'No description'}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          {projects.filter((p) => !query || p.name.toLowerCase().includes(query.toLowerCase())).length === 0 && (
            <div className="col-span-full rounded border p-6 text-sm text-muted-foreground">No projects found.</div>
          )}
        </div>
      )}
    </div>
  );
}


