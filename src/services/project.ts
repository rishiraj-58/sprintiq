import { db } from '@/db';
import { projects, type Project } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProjectCreate {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
}

export const projectService = {
  fetchProjects: async (workspaceId: string) => {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
  },

  createProject: async (data: ProjectCreate) => {
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

    return project;
  }
}; 