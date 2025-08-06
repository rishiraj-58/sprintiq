'use client';

import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { fetchWorkspaces, setCurrentWorkspace, isInitializing, setInitializing } = useWorkspace();

  useEffect(() => {
    const initializeWorkspaces = async () => {
      try {
        // fetchWorkspaces now returns the workspaces
        const workspaces = await fetchWorkspaces();
        if (workspaces && workspaces.length > 0) {
          // Set the first workspace as the current one
          setCurrentWorkspace(workspaces[0]);
        }
      } catch (error) {
        console.error("Failed to initialize workspaces", error);
        // Handle error state if necessary
      } finally {
        // Once everything is done, set initializing to false
        setInitializing(false);
      }
    };

    initializeWorkspaces();
    
  // We only want this to run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While initializing, show a full-screen loader
  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}