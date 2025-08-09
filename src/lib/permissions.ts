import { db } from '@/db';
import { workspaceMembers, projectMembers, projects } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { RoleCapability } from '@/types/database';

// Default capability sets from your architecture guide
const DEFAULT_CAPABILITY_SETS = {
  OWNER: [
    'view', 'create', 'edit', 'delete', 'manage_members', 'manage_settings'
  ] as RoleCapability[],
  MANAGER: ['view', 'create', 'edit', 'delete', 'manage_members'] as RoleCapability[],
  MEMBER: ['view', 'create', 'edit'] as RoleCapability[],
  VIEWER: ['view'] as RoleCapability[],
};

function mergeWithRoleDefaults(role: string | null | undefined, capsJson: string | null | undefined): RoleCapability[] {
  let parsed: RoleCapability[] = [];
  try {
    parsed = JSON.parse(capsJson || '[]') as RoleCapability[];
  } catch {
    parsed = [];
  }
  const upper = (role || '').toUpperCase() as keyof typeof DEFAULT_CAPABILITY_SETS;
  const defaults = DEFAULT_CAPABILITY_SETS[upper] || [];
  return Array.from(new Set([...(parsed || []), ...defaults])) as RoleCapability[];
}

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
      return mergeWithRoleDefaults(membership.role, membership.capabilities);
    }

    // Project context: check project membership only (no workspace fallback)
    const [pMem] = await db
      .select({ role: projectMembers.role, capabilities: projectMembers.capabilities, projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(and(eq(projectMembers.profileId, userId), eq(projectMembers.projectId, contextId)));

    if (pMem) {
      if (pMem.role === 'owner') {
        return DEFAULT_CAPABILITY_SETS.OWNER;
      }
      return mergeWithRoleDefaults(pMem.role, pMem.capabilities);
    }

    // No project membership found → no capabilities in this project
    return [];
  }
}