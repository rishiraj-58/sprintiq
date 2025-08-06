import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/hooks/useAuth';
import { type RoleCapability } from '@/types/database';

export const usePermissions = (contextType: 'workspace' | 'project', contextId?: string) => {
  const { profile } = useAuth();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCapabilities = async () => {
              if (profile?.id && contextId) {
          setIsLoading(true);
          try {
            // Fetch from the API instead of calling PermissionManager directly
            const response = await fetch(`/api/permissions?contextId=${contextId}`);
            if (response.ok) {
              const data = await response.json();
              setCapabilities(data.capabilities || []);
            } else {
              setCapabilities([]);
            }
          } catch (error) {
            console.error("Failed to fetch permissions", error);
            setCapabilities([]);
          } finally {
            setIsLoading(false);
          }
        } else {
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