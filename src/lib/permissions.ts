import { db } from '@/db';
import { workspaceMembers } from '@/db/schema';
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
    contextId: string
  ): Promise<RoleCapability[]> {
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

    if (!membership) return [];
    
    if (membership.role === 'owner') {
      return DEFAULT_CAPABILITY_SETS.OWNER;
    }
    
    // The capabilities are stored as a JSON string array, so we need to parse it.
    try {
      return JSON.parse(membership.capabilities || '[]') as RoleCapability[];
    } catch {
      return [];
    }
  }
}