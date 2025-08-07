import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { type RoleCapability } from '@/types/database';

export const usePermissions = (contextType: 'workspace' | 'project', contextId?: string) => {
  const { user } = useUser();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('usePermissions hook - state:', { 
    userId: user?.id, 
    contextId, 
    contextType, 
    capabilities,
    isLoading 
  });


    useEffect(() => {
    console.log('usePermissions useEffect triggered:', { userId: user?.id, contextId });
    
    const fetchCapabilities = async () => {
      if (user?.id && contextId) {
        console.log('usePermissions: Making API call to /api/permissions');
        setIsLoading(true);
        try {
          // Fetch from the API instead of calling PermissionManager directly
          const response = await fetch(`/api/permissions?contextId=${contextId}`);
          console.log('usePermissions: API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('usePermissions: Received capabilities:', data.capabilities);
            setCapabilities(data.capabilities || []);
          } else {
            console.log('usePermissions: API failed');
            setCapabilities([]);
          }
        } catch (error) {
          console.error("Failed to fetch permissions", error);
          setCapabilities([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('usePermissions: Not fetching - missing data');
        setIsLoading(false);
      }
    };

    // Always try to fetch if we have the required data
    if (user?.id && contextId) {
      console.log('usePermissions: Calling fetchCapabilities');
      fetchCapabilities();
    } else {
      console.log('usePermissions: Setting loading to false');
      setIsLoading(false);
    }
  }, [user?.id, contextId]);

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