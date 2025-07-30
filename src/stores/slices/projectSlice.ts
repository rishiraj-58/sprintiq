import { StateCreator } from 'zustand';
import { db } from '@/db';
import { projects, type Project } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
      const results = await db
        .select()
        .from(projects)
        .where(eq(projects.workspaceId, workspaceId));
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
      const [project] = await db
        .insert(projects)
        .values({
          name: data.name,
          description: data.description,
          workspaceId: data.workspaceId,
          ownerId: data.ownerId,
          status: 'active',
        })
        .returning();

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