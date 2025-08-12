import { StateCreator } from 'zustand';
import { type Project } from '@/db/schema';

interface ProjectCreate {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
}

interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: string;
}

export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (data: ProjectCreate) => Promise<Project>;
  updateProject: (projectId: string, data: ProjectUpdate) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  setError: (error: string | null) => void;
}

export const createProjectSlice: StateCreator<ProjectState> = (set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async (workspaceId) => {
    if (!workspaceId) return;
    try {
      set({ isLoading: true, error: null });
      console.log('fetchProjects called with workspaceId:', workspaceId);
      
      // Determine if we should filter by assigned projects for member role
      const role = (() => {
        // Lightweight role resolution based on capabilities stored elsewhere could be added; default no filter
        try {
          const capsRaw = localStorage.getItem('siq:lastCaps');
          if (capsRaw) {
            const caps = JSON.parse(capsRaw) as string[];
            const has = (c: string) => caps.includes(c);
            if (!has('manage_members') && (has('create') || has('edit'))) {
              return 'member';
            }
          }
        } catch {}
        return null;
      })();

      const query = new URLSearchParams({ workspaceId });
      if (role === 'member') query.set('assignedToMe', 'true');
      const url = `/api/projects?${query.toString()}`;
      console.log('Fetching projects from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const results = await response.json();
      console.log('Projects API response:', results);
      set({ projects: results, isLoading: false });
      console.log('Projects state updated:', results);
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

  updateProject: async (projectId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId ? updatedProject : project
        ),
        currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
        isLoading: false,
      }));
      return updatedProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      set((state) => ({
        projects: state.projects.filter((project) => project.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error deleting project:', error);
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