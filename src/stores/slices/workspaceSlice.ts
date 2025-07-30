import { StateCreator } from 'zustand';
import { db } from '@/db';
import { workspaces, type Workspace } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface WorkspaceCreate {
  name: string;
  description?: string;
  createdById: string;
}

export interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: WorkspaceCreate) => Promise<Workspace>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setError: (error: string | null) => void;
}

export const createWorkspaceSlice: StateCreator<WorkspaceState> = (set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: false,
  error: null,

  fetchWorkspaces: async () => {
    try {
      set({ isLoading: true, error: null });
      const results = await db.select().from(workspaces);
      set({ workspaces: results });
    } catch (error) {
      set({ error: 'Failed to fetch workspaces' });
      console.error('Error fetching workspaces:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createWorkspace: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const [workspace] = await db
        .insert(workspaces)
        .values({
          name: data.name,
          description: data.description,
          createdById: data.createdById,
        })
        .returning();

      set((state) => ({
        workspaces: [...state.workspaces, workspace],
      }));

      return workspace;
    } catch (error) {
      set({ error: 'Failed to create workspace' });
      console.error('Error creating workspace:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  setError: (error) => {
    set({ error });
  },
}); 