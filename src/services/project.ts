import { db } from '@/db';
import { projects, type Project, projectMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProjectCreate {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
}

export const projectService = {
  fetchProjects: async (workspaceId: string) => {
    console.log('Project service: fetching projects for workspace:', workspaceId);
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId));
    console.log('Project service: found', result.length, 'projects');
    return result;
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

    // Ensure the creator is added as project owner by default
    try {
      await db
        .insert(projectMembers)
        .values({
          projectId: project.id,
          profileId: data.ownerId,
          role: 'owner',
          capabilities: '["view","create","edit","delete","manage_members","manage_settings"]',
        });
    } catch (e) {
      // Ignore if table missing or constraint errors; self-healing will handle table creation
    }

    return project;
  }
}; 