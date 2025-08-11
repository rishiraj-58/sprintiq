import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { type RoleCapability } from '@/types/database';

export const usePermissions = (contextType: 'workspace' | 'project', contextId?: string) => {
  const { user } = useUser();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, RoleCapability[]>>(new Map());

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
        const key = `${user.id}:${contextType}:${contextId}`;

        // If we already fetched for the same key, return cached to avoid spam
        if (cacheRef.current.has(key)) {
          setCapabilities(cacheRef.current.get(key) || []);
          setIsLoading(false);
          return;
        }

        // If the same request is in-flight, skip
        if (lastKeyRef.current === key && inFlightRef.current) {
          return;
        }

        lastKeyRef.current = key;
        inFlightRef.current?.abort();
        const controller = new AbortController();
        inFlightRef.current = controller;

        console.log('usePermissions: Making API call to /api/permissions');
        setIsLoading(true);
        try {
          // Fetch from the API instead of calling PermissionManager directly
          const response = await fetch(`/api/permissions?contextId=${contextId}&contextType=${contextType}`, {
            signal: controller.signal,
            // Deduplicate requests at the browser layer
            headers: { 'Cache-Control': 'no-cache' },
          });
          console.log('usePermissions: API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('usePermissions: Received capabilities:', data.capabilities);
            const caps = data.capabilities || [];
            cacheRef.current.set(key, caps);
            setCapabilities(caps);
          } else {
            console.log('usePermissions: API failed');
            setCapabilities([]);
          }
        } catch (error) {
          console.error("Failed to fetch permissions", error);
          setCapabilities([]);
        } finally {
          setIsLoading(false);
          inFlightRef.current = null;
        }
      } else {
        console.log('usePermissions: Not fetching - missing data');
        setIsLoading(false);
      }
    };

    // Only fetch if we have the required data
    if (user?.id && contextId) {
      console.log('usePermissions: Calling fetchCapabilities');
      fetchCapabilities();
    }
  }, [user?.id, contextId, contextType]);

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