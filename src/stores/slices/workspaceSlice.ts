import { StateCreator } from 'zustand';
import { type Workspace, type Profile } from '@/db/schema';

interface WorkspaceCreate {
  name: string;
  description?: string;
  createdById: string;
}

interface WorkspaceMember extends Profile {
  role: string;
}

export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  workspaceMembers: WorkspaceMember[];
  isLoading: boolean;
  isInitializing: boolean;
  isMembersLoading: boolean;
  error: string | null;
  membersError: string | null;
  fetchWorkspaces: () => Promise<Workspace[]>;
  createWorkspace: (data: WorkspaceCreate) => Promise<Workspace>;
  fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  setError: (error: string | null) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceState> = (set) => ({
  workspaces: [],
  currentWorkspace: null,
  workspaceMembers: [],
  isLoading: false,
  isInitializing: true,
  isMembersLoading: false,
  error: null,
  membersError: null,

  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/workspaces');
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces');
      }
      const results = await response.json();
      set({ workspaces: results, isLoading: false });
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  },

  createWorkspace: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create workspace');
      }

      const newWorkspace = await response.json();

      // Add the new workspace to the state and set it as current
      set((state) => ({
        workspaces: [...state.workspaces, newWorkspace],
        currentWorkspace: newWorkspace,
        isLoading: false,
      }));

      return newWorkspace;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating workspace:', error);
      throw error;
    }
  },

  fetchWorkspaceMembers: async (workspaceId: string) => {
    try {
      set({ isMembersLoading: true, membersError: null });
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch workspace members');
      }
      const data = await response.json();
      set({ workspaceMembers: data.members, isMembersLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ membersError: errorMessage, isMembersLoading: false });
      console.error('Error fetching workspace members:', error);
      throw error;
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  setInitializing: (isInitializing) => {
    set({ isInitializing });
  },

  setError: (error) => {
    set({ error });
  },
}); 