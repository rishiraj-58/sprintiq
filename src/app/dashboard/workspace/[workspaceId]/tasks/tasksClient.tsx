'use client';

import { useEffect } from 'react';
import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useProject } from '@/stores/hooks/useProject';
import Link from 'next/link';

export function WorkspaceTasksClient({ workspaceId }: { workspaceId: string }) {
  const { setCurrentWorkspace } = useWorkspace();
  const { projects, fetchProjects } = useProject();

  useEffect(() => {
    setCurrentWorkspace({ id: workspaceId, name: '', description: null } as any);
    localStorage.setItem('siq:lastWorkspaceId', workspaceId);
    fetchProjects(workspaceId);
  }, [workspaceId, setCurrentWorkspace, fetchProjects]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="rounded border p-4 hover:bg-muted/50">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-muted-foreground">Open project to view tasks</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


