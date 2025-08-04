import { StateCreator } from 'zustand';
import { type Project } from '@/db/schema';

interface ProjectCreate {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (data: ProjectCreate) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  setError: (error: string | null) => void;
}

export const createProjectSlice: StateCreator<ProjectState> = (set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async (workspaceId) => {
    if (!workspaceId) return;
    try {
      set({ isLoading: true, error: null });
      // Fetch from the API route, passing workspaceId as a query param
      const response = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const results = await response.json();
      set({ projects: results, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching projects:', error);
    }
  },

  createProject: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const newProject = await response.json();
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false,
      }));
      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating project:', error);
      throw error;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  setError: (error) => {
    set({ error });
  },
}); 