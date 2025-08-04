import { db } from '@/db';
import { workspaces, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const workspaceService = {
  fetchUserWorkspaces: async (userId: string) => {
    return await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .where(eq(workspaceMembers.profileId, userId));
  },
};