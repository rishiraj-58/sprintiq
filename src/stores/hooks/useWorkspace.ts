import { useStore } from '../index';

export const useWorkspace = () => {
  const workspaces = useStore((state) => state.workspaces);
  const currentWorkspace = useStore((state) => state.currentWorkspace);
  const isLoading = useStore((state) => state.isLoading);
  const isInitializing = useStore((state) => state.isInitializing);
  const error = useStore((state) => state.error);
  const fetchWorkspaces = useStore((state) => state.fetchWorkspaces);
  const createWorkspace = useStore((state) => state.createWorkspace);
  const setCurrentWorkspace = useStore((state) => state.setCurrentWorkspace);
  const setInitializing = useStore((state) => state.setInitializing);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    isInitializing,
    error,
    fetchWorkspaces,
    createWorkspace,
    setCurrentWorkspace,
    setInitializing,
  };
}; 