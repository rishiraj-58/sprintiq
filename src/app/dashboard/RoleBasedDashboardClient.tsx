'use client';

import { useWorkspace } from '@/stores/hooks/useWorkspace';
import { usePermissions } from '@/hooks/usePermissions';
import { Spinner } from '@/components/ui/spinner';
import { ManagerDashboardClient } from './manager/ManagerDashboardClient';
import { OwnerDashboardClient } from './owner/OwnerDashboardClient';
import { MemberDashboardClient } from './member/MemberDashboardClient';
import { ViewerDashboardClient } from './viewer/ViewerDashboardClient';

function resolveRoleFromCapabilities(capabilities: string[]): 'owner' | 'manager' | 'member' | 'viewer' {
  const has = (c: string) => capabilities.includes(c);
  if (has('manage_settings') && has('delete')) return 'owner';
  if (has('manage_members')) return 'manager';
  if (has('create') || has('edit')) return 'member';
  return 'viewer';
}

export function RoleBasedDashboardClient() {
  const { currentWorkspace, isInitializing } = useWorkspace();
  const workspaceId = currentWorkspace?.id;
  const { isLoading, canCreate, canEdit, canDelete, canManageMembers, canManageSettings } = usePermissions('workspace', workspaceId);

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const caps: string[] = [];
  if (canCreate) caps.push('create');
  if (canEdit) caps.push('edit');
  if (canDelete) caps.push('delete');
  if (canManageMembers) caps.push('manage_members');
  if (canManageSettings) caps.push('manage_settings');

  const role = resolveRoleFromCapabilities(caps);

  if (role === 'owner') return <OwnerDashboardClient />;
  if (role === 'manager') return <ManagerDashboardClient />;
  if (role === 'member') return <MemberDashboardClient />;
  return <ViewerDashboardClient />;
}


