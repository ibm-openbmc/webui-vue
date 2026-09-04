import { useQuery } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
import { computed } from 'vue';
import api from '@/store/api';
import {
  useRedfishCollection,
  useRedfishResource,
} from './useRedfishCollection';
import type { Resource, ODataId, ResourceCollection } from '@/types/redfish';
import { createRedfishQueryConfig } from './shared/queryConfig';
import { batchFetch } from './shared/useBatchedRequests';

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
  options: {
    enabled?: boolean;
    queryConfig?: Partial<UseQueryOptions<T[]>>;
  } = {},
) {
  const { enabled = true, queryConfig } = options;

  const parentQuery = useRedfishCollection<Resource>(parentCollectionPath, {
    enabled,
  });

  const subResourcePaths = computed(() => {
    if (!parentQuery.data.value) {
      return [];
    }

    const parentResources = parentQuery.data.value;

    const paths: string[] = [];
    parentResources.forEach((parent: any) => {
      if (parent && typeof parent === 'object' && subResourceKey in parent) {
        const subResource = parent[subResourceKey as keyof typeof parent];

        if (
          subResource &&
          typeof subResource === 'object' &&
          '@odata.id' in subResource
        ) {
          paths.push((subResource as ODataId)['@odata.id']);
        }
      }
    });

    return paths;
  });

  // Computed to determine if sub-resources query should be enabled
  const isSubQueryEnabled = computed(() => {
    return (
      enabled &&
      !parentQuery.isLoading.value &&
      subResourcePaths.value.length > 0
    );
  });

  // Fetch all sub-resources
  const query = useQuery({
    queryKey: [
      'redfish',
      'allSubResources',
      parentCollectionPath,
      subResourceKey,
    ],
    queryFn: async (): Promise<T[]> => {
      const paths = subResourcePaths.value;

      if (paths.length === 0) {
        return [];
      }

      // Fetch all sub-resource collections with batching
      const collections = await batchFetch<ResourceCollection>(paths, {
        concurrency: 6,
        retry: true,
      });

      // Process each collection
      const allMemberUrls: string[] = [];
      const collectionResults: T[][] = [];

      for (let i = 0; i < collections.length; i++) {
        const collection = collections[i];
        const path = paths[i];

        if (!collection) {
          collectionResults.push([]);
          continue;
        }

        // If it's a collection, extract member URLs
        if (collection.Members && Array.isArray(collection.Members)) {
          // Try with $expand first
          try {
            const expandResponse = await api.get(
              `${path}?$expand=.($levels=1)`,
            );
            const expandedData = expandResponse.data;

            if (expandedData.Members && expandedData.Members.length > 0) {
              const firstMember = expandedData.Members[0];
              if (
                typeof firstMember === 'object' &&
                Object.keys(firstMember).length > 1
              ) {
                collectionResults.push(expandedData.Members as T[]);
                continue;
              }
            }
          } catch {
            // $expand not supported, fall back to batched individual fetches
          }

          // Extract member URLs for batched fetching
          const memberUrls = collection.Members.map((member: any) => {
            return typeof member === 'object' && '@odata.id' in member
              ? member['@odata.id']
              : member;
          }).filter(Boolean);

          const startIndex = allMemberUrls.length;
          allMemberUrls.push(...memberUrls);
          collectionResults.push([]); // Placeholder, will be filled later

          // Store the range for this collection
          (collectionResults[i] as any)._range = {
            start: startIndex,
            end: startIndex + memberUrls.length,
          };
        } else {
          // Single resource
          collectionResults.push([collection as unknown as T]);
        }
      }

      // Batch fetch all members at once with concurrency control
      if (allMemberUrls.length > 0) {
        const allMembers = await batchFetch<T>(allMemberUrls, {
          concurrency: 8, // Higher concurrency for member fetches
          retry: true,
        });

        // Distribute members back to their collections
        collectionResults.forEach((result, index) => {
          if ((result as any)._range) {
            const { start, end } = (result as any)._range;
            const members = allMembers.slice(start, end).filter(Boolean);
            collectionResults[index] = members;
            delete (result as any)._range;
          }
        });
      }

      const results = collectionResults;
      // Flatten and deduplicate by @odata.id (Redfish unique identifier).
      // Using name-based dedup would silently drop sensors with the same name
      // from different chassis (e.g. two "CPU Temp" sensors on different chassis).
      const flat = results.flat();
      const seen = new Set<string>();
      const deduplicated = flat.filter((item) => {
        const id = (item as any)['@odata.id'];
        if (id && seen.has(id)) return false;
        if (id) seen.add(id);
        return true;
      });

      // Sort by @odata.id for stable, consistent ordering across refetches
      // This prevents the table from reordering items during auto-refresh
      return deduplicated.sort((a, b) => {
        const idA = (a as any)['@odata.id'] || '';
        const idB = (b as any)['@odata.id'] || '';
        return idA.localeCompare(idB);
      });
    },
    enabled: isSubQueryEnabled,
    ...createRedfishQueryConfig(),
    ...queryConfig,
  });

  // Combined refetch function that refetches both parent and child queries
  const refetchAll = async () => {
    await parentQuery.refetch();
    await query.refetch();
  };

  return {
    data: query.data,
    isLoading: computed(
      () => parentQuery.isLoading.value || query.isLoading.value,
    ),
    isFetching: computed(
      () => parentQuery.isFetching.value || query.isFetching.value,
    ),
    error: computed(() => parentQuery.error.value || query.error.value),
    isError: computed(() => !!parentQuery.error.value || query.isError.value),
    refetch: refetchAll,
  };
}

/**
 * Helper function to navigate through Redfish paths to get a collection URL
 * Example: Navigate from /redfish/v1/ → EventService → Subscriptions
 * @param navigationPath Array of property names to navigate through
 * @returns The final collection URL
 */
export async function navigateToCollection(
  navigationPath: string[],
): Promise<string> {
  let currentUrl = '/redfish/v1/';

  for (const property of navigationPath) {
    const response = await api.get(currentUrl);
    const data = response.data;

    if (!data[property]) {
      throw new Error(`Property ${property} not found at ${currentUrl}`);
    }

    const nextResource = data[property];
    if (typeof nextResource === 'object' && '@odata.id' in nextResource) {
      currentUrl = nextResource['@odata.id'];
    } else {
      throw new Error(`Invalid navigation path at ${property}`);
    }
  }

  return currentUrl;
}

/**
 * Fetch a collection by navigating through a path
 * Example: Fetch SNMP subscriptions via ['EventService', 'Subscriptions']
 */
export function useNavigatedCollection<T extends Resource>(
  navigationPath: string[],
  options: {
    enabled?: boolean;
    filter?: (item: T) => boolean;
    queryConfig?: Partial<UseQueryOptions<T[]>>;
  } = {},
) {
  const { enabled = true, filter, queryConfig } = options;

  return useQuery({
    queryKey: ['redfish', 'navigatedCollection', ...navigationPath],
    queryFn: async (): Promise<T[]> => {
      const collectionUrl = await navigateToCollection(navigationPath);
      const response = await api.get<ResourceCollection>(collectionUrl);

      const memberIds =
        response.data.Members?.map((member: any) => member['@odata.id']) || [];

      if (memberIds.length === 0) {
        return [];
      }

      // Try $expand first
      try {
        const expandResponse = await api.get(
          `${collectionUrl}?$expand=.($levels=1)`,
        );
        const expandedData = expandResponse.data;

        if (expandedData.Members && expandedData.Members.length > 0) {
          const firstMember = expandedData.Members[0];
          if (
            typeof firstMember === 'object' &&
            Object.keys(firstMember).length > 1
          ) {
            const members = expandedData.Members as T[];
            return filter ? members.filter(filter) : members;
          }
        }
      } catch {
        // $expand not supported, fall back to individual fetches
      }

      // Fallback: fetch each member individually
      const memberResponses = await Promise.all(
        memberIds.map((id: string) => api.get<T>(id)),
      );

      const members = memberResponses.map((res) => res.data);
      return filter ? members.filter(filter) : members;
    },
    enabled,
    ...createRedfishQueryConfig(),
    ...queryConfig,
  });
}

/**
 * Fetch a property from all resources in a collection
 * Example: Fetch PowerRestorePolicy from all Systems
 */
export function usePropertyFromCollection<
  T extends Resource,
  K extends keyof T,
>(
  collectionPath: string,
  propertyKey: K,
  options: {
    enabled?: boolean;
    expand?: boolean;
    queryConfig?: Partial<UseQueryOptions<T[]>>;
  } = {},
) {
  const { enabled = true, expand = false, queryConfig } = options;

  const collectionQuery = useRedfishCollection<T>(collectionPath, {
    enabled,
    expand,
    queryConfig,
  });

  const propertyValue = computed(() => {
    if (
      !collectionQuery.data.value ||
      collectionQuery.data.value.length === 0
    ) {
      return null;
    }

    // Return the property from the first resource (most common case)
    // If multiple systems exist, this can be extended
    const firstResource = collectionQuery.data.value[0];
    return firstResource[propertyKey] ?? null;
  });

  return {
    data: propertyValue,
    allResources: collectionQuery.data,
    isLoading: collectionQuery.isLoading,
    isFetching: collectionQuery.isFetching,
    error: collectionQuery.error,
    isError: collectionQuery.isError,
    refetch: collectionQuery.refetch,
  };
}
