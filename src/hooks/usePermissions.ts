import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/hooks/useAuth';
import { PermissionManager } from '@/lib/permissions';
import { RoleCapability } from '@/types/database';

export const usePermissions = (contextType: 'workspace' | 'project', contextId?: string) => {
  const { profile } = useAuth();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCapabilities = async () => {
      if (profile?.id && contextId) {
        setIsLoading(true);
        const userCapabilities = await PermissionManager.getUserCapabilities(profile.id, contextId);
        setCapabilities(userCapabilities);
        setIsLoading(false);
      }
    };

    fetchCapabilities();
  }, [profile, contextType, contextId]);

  return {
    isLoading,
    canView: capabilities.includes('view'),
    canCreate: capabilities.includes('create'),
    canEdit: capabilities.includes('edit'),
    canDelete: capabilities.includes('delete'),
    canManageMembers: capabilities.includes('manage_members'),
    canManageSettings: capabilities.includes('manage_settings'),
  };
};