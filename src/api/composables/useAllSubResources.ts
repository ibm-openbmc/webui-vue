import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import api from '@/store/api';
import { useRedfishCollection, useRedfishResource } from './useRedfishCollection';
import type { Resource, ODataId } from '@/types/redfish';

// Re-export helpers for consistent imports across all composables
export { useRedfishCollection, useRedfishResource };

/**
 * Generic pattern for fetching nested resources from parent collections
 * Example: Fetch all Memory from all Systems
 * Example: Fetch all Sensors from all Chassis
 */
export function useAllSubResources<T extends Resource>(
  parentCollectionPath: string,
  subResourceKey: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  const parentQuery = useRedfishCollection<Resource>(parentCollectionPath, { enabled });

  const subResourcePaths = computed(() => {
    if (!parentQuery.data.value) {
      return [];
    }
    
    const parentResources = parentQuery.data.value;
    
    const paths: string[] = [];
    parentResources.forEach((parent: any) => {
      if (parent && typeof parent === 'object' && subResourceKey in parent) {
        const subResource = parent[subResourceKey as keyof typeof parent];
        
        if (subResource && typeof subResource === 'object' && '@odata.id' in subResource) {
          paths.push((subResource as ODataId)['@odata.id']);
        }
      }
    });
    
    return paths;
  });

  // Computed to determine if sub-resources query should be enabled
  const isSubQueryEnabled = computed(() => {
    return enabled && !parentQuery.isLoading.value && subResourcePaths.value.length > 0;
  });

  // Fetch all sub-resources
  const query = useQuery({
    queryKey: ['redfish', 'allSubResources', parentCollectionPath, subResourceKey],
    queryFn: async (): Promise<T[]> => {
      const paths = subResourcePaths.value;
      
      if (paths.length === 0) {
        return [];
      }

      // Fetch all sub-resource collections
      const collectionPromises = paths.map(async (path) => {
        try {
          const response = await api.get(path);
          const collection = response.data;

          // If it's a collection, fetch all members
          if (collection.Members && Array.isArray(collection.Members)) {
            // Try with $expand first
            try {
              const expandResponse = await api.get(`${path}?$expand=.($levels=1)`);
              const expandedData = expandResponse.data;
              
              if (expandedData.Members && expandedData.Members.length > 0) {
                const firstMember = expandedData.Members[0];
                if (typeof firstMember === 'object' && Object.keys(firstMember).length > 1) {
                  return expandedData.Members as T[];
                }
              }
            } catch {
              // $expand not supported, fall back to individual fetches
            }

            // Fallback: fetch each member individually
            const memberPromises = collection.Members.map((member: any) => {
              const memberId = typeof member === 'object' && '@odata.id' in member
                ? member['@odata.id']
                : member;
              return api.get<T>(memberId as string);
            });

            const responses = await Promise.all(memberPromises);
            return responses.map((res: any) => res.data);
          }

          // If it's a single resource, return it as an array
          return [collection as T];
        } catch (error) {
          console.error(`Error fetching sub-resource from ${path}:`, error);
          return [];
        }
      });

      const results = await Promise.all(collectionPromises);
      // Flatten and deduplicate by @odata.id (Redfish unique identifier).
      // Using name-based dedup would silently drop sensors with the same name
      // from different chassis (e.g. two "CPU Temp" sensors on different chassis).
      const flat = results.flat();
      const seen = new Set<string>();
      return flat.filter((item) => {
        const id = (item as any)['@odata.id'];
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);
        return true;
      });
    },
    enabled: isSubQueryEnabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Don't retry client errors (4xx) — they won't succeed on retry.
    // Do retry transient server errors (5xx) and network failures.
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Combined refetch function that refetches both parent and child queries
  const refetchAll = async () => {
    await parentQuery.refetch();
    await query.refetch();
  };

  return {
    data: query.data,
    isLoading: computed(() => parentQuery.isFetching.value || query.isFetching.value),
    error: computed(() => parentQuery.error.value || query.error.value),
    isError: computed(() => !!parentQuery.error.value || query.isError.value),
    refetch: refetchAll,
  };
}
