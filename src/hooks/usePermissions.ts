import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { type RoleCapability } from '@/types/database';

// Module-scoped caches to dedupe calls across all component instances
const globalCapabilitiesCache = new Map<string, RoleCapability[]>();
const globalInFlight = new Map<string, Promise<RoleCapability[]>>();

export const usePermissions = (contextType: 'workspace' | 'project', contextId?: string) => {
  const { user } = useUser();
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const key = useMemo(() => (user?.id && contextId ? `${user.id}:${contextType}:${contextId}` : null), [user?.id, contextType, contextId]);

  useEffect(() => {
    if (!key) {
      setIsLoading(false);
      return;
    }

    // Serve immediately from global cache if available
    if (globalCapabilitiesCache.has(key)) {
      setCapabilities(globalCapabilitiesCache.get(key) || []);
      setIsLoading(false);
      return;
    }

    // If a global request is already in-flight for this key, attach to it
    const inFlight = globalInFlight.get(key);
    if (inFlight) {
      setIsLoading(true);
      inFlight
        .then((caps) => setCapabilities(caps))
        .finally(() => setIsLoading(false));
      return;
    }

    // Launch a single global request for this key
    const fetchPromise = (async (): Promise<RoleCapability[]> => {
      const response = await fetch(`/api/permissions?contextId=${contextId}&contextType=${contextType}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!response.ok) return [];
      const data = await response.json();
      const caps: RoleCapability[] = data.capabilities || [];
      globalCapabilitiesCache.set(key, caps);
      return caps;
    })();

    globalInFlight.set(key, fetchPromise);
    setIsLoading(true);
    fetchPromise
      .then((caps) => setCapabilities(caps))
      .catch(() => setCapabilities([]))
      .finally(() => {
        setIsLoading(false);
        // Clear in-flight once settled
        if (globalInFlight.get(key) === fetchPromise) {
          globalInFlight.delete(key);
        }
      });
  }, [key, contextId, contextType]);

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