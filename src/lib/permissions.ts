import { db } from '@/db';
import { workspaceMembers, projectMembers, projects } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { RoleCapability } from '@/types/database';

// Default capability sets from your architecture guide
const DEFAULT_CAPABILITY_SETS = {
  OWNER: [
    'view', 'create', 'edit', 'delete', 'manage_members', 'manage_settings'
  ] as RoleCapability[],
  MANAGER: ['view', 'create', 'edit', 'manage_members'] as RoleCapability[],
  MEMBER: ['view', 'create', 'edit'] as RoleCapability[],
  VIEWER: ['view'] as RoleCapability[],
};

export class PermissionManager {
  static async getUserCapabilities(
    userId: string,
    contextId: string,
    contextType: 'workspace' | 'project' = 'workspace'
  ): Promise<RoleCapability[]> {
    if (contextType === 'workspace') {
      const [membership] = await db
        .select({
          role: workspaceMembers.role,
          capabilities: workspaceMembers.capabilities,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.profileId, userId),
            eq(workspaceMembers.workspaceId, contextId)
          )
        );

      if (!membership) {
        return [];
      }
      if (membership.role === 'owner') {
        return DEFAULT_CAPABILITY_SETS.OWNER;
      }
      try {
        return JSON.parse(membership.capabilities || '[]') as RoleCapability[];
      } catch {
        return [];
      }
    }

    // Project context: check project member, otherwise fall back to workspace membership
    const [pMem] = await db
      .select({ role: projectMembers.role, capabilities: projectMembers.capabilities, projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(and(eq(projectMembers.profileId, userId), eq(projectMembers.projectId, contextId)));

    if (pMem) {
      if (pMem.role === 'owner') {
        return DEFAULT_CAPABILITY_SETS.OWNER;
      }
      try {
        return JSON.parse(pMem.capabilities || '[]') as RoleCapability[];
      } catch {
        return [];
      }
    }

    // Fallback: resolve workspace from project, then evaluate workspace membership
    const [proj] = await db
      .select({ workspaceId: projects.workspaceId })
      .from(projects)
      .where(eq(projects.id, contextId));

    if (!proj) return [];

    return this.getUserCapabilities(userId, proj.workspaceId, 'workspace');
  }
}