import { useStore } from '../index';

export const useWorkspace = () => {
  const workspaces = useStore((state) => state.workspaces);
  const currentWorkspace = useStore((state) => state.currentWorkspace);
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);
  const fetchWorkspaces = useStore((state) => state.fetchWorkspaces);
  const createWorkspace = useStore((state) => state.createWorkspace);
  const setCurrentWorkspace = useStore((state) => state.setCurrentWorkspace);

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    fetchWorkspaces,
    createWorkspace,
    setCurrentWorkspace,
  };
}; 