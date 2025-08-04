'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/stores/hooks/useWorkspace';

export function ProjectsClientPage() {
    const { currentWorkspace } = useWorkspace();
  
    // The hook now gets the workspaceId from the global store
    const { canCreate } = usePermissions('workspace', currentWorkspace?.id);

    if (!currentWorkspace) {
        return <div>Select a workspace to view projects.</div>;
    }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <p className="text-muted-foreground">
          You are viewing projects in <strong>{currentWorkspace.name}</strong>.
        </p>
      </div>

      {/* This button will only show if the user has 'create' capabilities */}
      {canCreate && (
        <div>
          <Button>Create Project</Button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Empty State */}
        <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
          <h3 className="font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            {canCreate ? "Create your first project to get started." : "You have not been assigned to any projects yet."}
          </p>
        </div>
      </div>
    </div>
  );
}