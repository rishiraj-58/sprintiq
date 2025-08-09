import { db } from '@/db';
import { workspaces, workspaceMembers, projects } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export const workspaceService = {
  fetchUserWorkspaces: async (userId: string) => {
    return await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        projectCount: sql<number>`COALESCE(COUNT(${projects.id}), 0)`
      })
      .from(workspaces)
      .innerJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspaceId))
      .leftJoin(projects, eq(projects.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.profileId, userId))
      .groupBy(workspaces.id, workspaces.name, workspaces.description);
  },
};