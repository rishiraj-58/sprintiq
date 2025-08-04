'use client';

import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { useEffect } from 'react';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { fetchWorkspaces, workspaces, setCurrentWorkspace, currentWorkspace } = useWorkspace();

  // This effect runs only once on initial component mount to fetch the data.
  useEffect(() => {
    // We call the fetch function which will update the store internally.
    fetchWorkspaces();
  }, [fetchWorkspaces]); // Dependency array ensures this runs only once.

  // This separate effect runs whenever the list of workspaces changes.
  // It sets the current workspace if one isn't already set.
  useEffect(() => {
    if (!currentWorkspace && workspaces.length > 0) {
      setCurrentWorkspace(workspaces[0]);
    }
  }, [workspaces, currentWorkspace, setCurrentWorkspace]);

  return <>{children}</>;
}