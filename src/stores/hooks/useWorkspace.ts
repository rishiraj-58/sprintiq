import { useStore } from '../index';

export const useWorkspace = () => {
  const workspaces = useStore((state) => state.workspaces);
  const currentWorkspace = useStore((state) => state.currentWorkspace);
  const workspaceMembers = useStore((state) => state.workspaceMembers);
  const isLoading = useStore((state) => state.isLoading);
  const isInitializing = useStore((state) => state.isInitializing);
  const isMembersLoading = useStore((state) => state.isMembersLoading);
  const error = useStore((state) => state.error);
  const membersError = useStore((state) => state.membersError);
  const fetchWorkspaces = useStore((state) => state.fetchWorkspaces);
  const createWorkspace = useStore((state) => state.createWorkspace);
  const fetchWorkspaceMembers = useStore((state) => state.fetchWorkspaceMembers);
  const setCurrentWorkspace = useStore((state) => state.setCurrentWorkspace);
  const setInitializing = useStore((state) => state.setInitializing);

  return {
    workspaces,
    currentWorkspace,
    workspaceMembers,
    isLoading,
    isInitializing,
    isMembersLoading,
    error,
    membersError,
    fetchWorkspaces,
    createWorkspace,
    fetchWorkspaceMembers,
    setCurrentWorkspace,
    setInitializing,
  };
}; 