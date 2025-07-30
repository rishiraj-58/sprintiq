import { db } from '@/db';
import { workspaces, type Workspace } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface WorkspaceCreate {
  name: string;
  description?: string;
  createdById: string;
}

export const workspaceService = {
  fetchWorkspaces: async () => {
    return await db.select().from(workspaces);
  },

  createWorkspace: async (data: WorkspaceCreate) => {
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: data.name,
        description: data.description,
        createdById: data.createdById,
      })
      .returning();

    return workspace;
  }
}; 