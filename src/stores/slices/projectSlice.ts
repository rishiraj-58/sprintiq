import { StateCreator } from 'zustand';
import { type Project } from '@/db/schema';
import { projectService } from '@/services/project';

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
    try {
      set({ isLoading: true, error: null });
      const results = await projectService.fetchProjects(workspaceId);
      set({ projects: results });
    } catch (error) {
      set({ error: 'Failed to fetch projects' });
      console.error('Error fetching projects:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const project = await projectService.createProject(data);
      set((state) => ({
        projects: [...state.projects, project],
      }));
      return project;
    } catch (error) {
      set({ error: 'Failed to create project' });
      console.error('Error creating project:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  setError: (error) => {
    set({ error });
  },
}); 