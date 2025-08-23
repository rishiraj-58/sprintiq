import { db } from '@/db';
import { projects, type Project, projectMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProjectCreate {
  name: string;
  description?: string;
  workspaceId: string;
  ownerId: string;
}

// Helper function to generate a project key from the project name
function generateProjectKey(name: string): string {
  // Remove special characters and spaces, take first 3-5 characters, uppercase
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return cleanName.substring(0, Math.min(5, cleanName.length));
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
    // Generate a unique project key
    let projectKey = generateProjectKey(data.name);
    let counter = 1;
    
    // Ensure the key is unique by appending a number if needed
    while (true) {
      try {
        const existingProject = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.key, projectKey))
          .limit(1);
        
        if (existingProject.length === 0) {
          break; // Key is unique
        }
        
        // Key exists, try with a number suffix
        projectKey = `${generateProjectKey(data.name)}${counter}`;
        counter++;
        
        // Prevent infinite loop
        if (counter > 100) {
          projectKey = `${generateProjectKey(data.name)}${Date.now().toString().slice(-3)}`;
          break;
        }
      } catch (error) {
        // If there's an error checking uniqueness, use timestamp-based key
        projectKey = `${generateProjectKey(data.name)}${Date.now().toString().slice(-3)}`;
        break;
      }
    }

    const [project] = await db
      .insert(projects)
      .values({
        name: data.name,
        key: projectKey,
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