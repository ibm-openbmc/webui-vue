import { useQuery } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
import api from '@/store/api';
import type {
  ResourceCollection,
  Resource,
  ExpandedCollection,
} from '@/types/redfish';
import { createRedfishQueryConfig } from './shared/queryConfig';
import { batchFetch } from './shared/useBatchedRequests';

interface UseRedfishCollectionOptions {
  expand?: boolean;
  expandLevels?: number;
  select?: string[];
  enabled?: boolean;
  /** @deprecated Use queryConfig instead for full preset support */
  staleTime?: number;
  /** Full TanStack Query options — spreads over the default config.
   *  Pass a RedfishQueryPresets entry to apply a complete preset. */
  queryConfig?: Partial<UseQueryOptions<any>>;
}

/**
 * Fetches a Redfish collection at `collectionPath`, attempting `$expand` for a
 * single round-trip and falling back to individual member fetches when the BMC
 * does not support expansion.
 *
 * This is the shared implementation used by both `useRedfishCollection` and any
 * composable that needs the same $expand → batch pattern without spinning up a
 * full reactive query (e.g. per-chassis sensor fetches inside `useQueries`).
 */
export async function fetchRedfishCollection<T extends Resource>(
  collectionPath: string,
  expandLevels = 1,
): Promise<T[]> {
  const url = `${collectionPath}?$expand=.($levels=${expandLevels})`;

  try {
    const response = await api.get<ExpandedCollection<T> | ResourceCollection>(
      url,
    );
    const data = response.data;

    if (data.Members && data.Members.length > 0) {
      const firstMember = data.Members[0];
      // A fully-expanded member has more than just the stub { '@odata.id' } key.
      if (
        typeof firstMember === 'object' &&
        '@odata.id' in firstMember &&
        Object.keys(firstMember).length > 1
      ) {
        return data.Members as T[];
      }
    }
  } catch (err: any) {
    // Only fall back when the BMC signals $expand is unsupported (400/501).
    // All other errors are real failures — re-throw so callers can handle them.
    const status = err?.response?.status;
    if (status !== undefined && status !== 400 && status !== 501) {
      throw err;
    }
    console.debug(
      `$expand not supported for ${collectionPath}, falling back to batch fetch:`,
      err,
    );
  }

  // Fall back: fetch the plain collection index, then batch-fetch each member.
  const collResp = await api.get<ResourceCollection>(collectionPath);
  if (collResp.data.Members && collResp.data.Members.length > 0) {
    const memberIds = collResp.data.Members.map((member: any) =>
      typeof member === 'object' && '@odata.id' in member
        ? (member['@odata.id'] as string)
        : (member as string),
    );
    return batchFetch<T>(memberIds, { concurrency: 6, retry: true });
  }

  return [];
}

/**
 * Smart collection fetcher with OData optimization.
 * Automatically uses $expand when supported, falls back to basic fetch.
 */
export function useRedfishCollection<T extends Resource>(
  collectionPath: string,
  options: UseRedfishCollectionOptions = {},
) {
  const {
    expand = true,
    expandLevels = 1,
    select,
    enabled = true,
    staleTime: staleTimeMs,
    queryConfig,
  } = options;

  return useQuery({
    queryKey: [
      'redfish',
      'collection',
      collectionPath,
      { expand, expandLevels, select },
    ],
    queryFn: async (): Promise<T[]> => {
      const queryString = expand ? `?$expand=.($levels=${expandLevels})` : '';
      const url = `${collectionPath}${queryString}`;

      try {
        const response = await api.get<
          ExpandedCollection<T> | ResourceCollection
        >(url);
        const data = response.data;

        if (data.Members && data.Members.length > 0) {
          const firstMember = data.Members[0];

          if (typeof firstMember === 'object' && '@odata.id' in firstMember) {
            const keys = Object.keys(firstMember);
            if (keys.length > 1) {
              return data.Members as T[];
            }
          }
        }

        if (data.Members && data.Members.length > 0) {
          const memberIds = data.Members.map((member: any) =>
            typeof member === 'object' && '@odata.id' in member
              ? (member['@odata.id'] as string)
              : (member as string),
          );

          return batchFetch<T>(memberIds, { concurrency: 6, retry: true });
        }

        return [];
      } catch (error) {
        console.error(`Error fetching collection ${collectionPath}:`, error);
        throw error;
      }
    },
    enabled,
    // Base defaults, then legacy staleTime override, then full queryConfig preset
    ...createRedfishQueryConfig({
      staleTime: staleTimeMs,
    }),
    ...queryConfig,
  });
}
/**
 * Fetch a single resource by path
 */
export function useRedfishResource<T extends Resource>(
  resourcePath: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number | false;
    staleTime?: number;
    queryConfig?: Partial<UseQueryOptions<T>>;
  } = {},
) {
  const { enabled = true, refetchInterval, staleTime, queryConfig } = options;

  return useQuery({
    queryKey: ['redfish', 'resource', resourcePath],
    queryFn: async (): Promise<T> => {
      const response = await api.get<T>(resourcePath);
      return response.data;
    },
    enabled,
    ...createRedfishQueryConfig({ refetchInterval, staleTime }),
    ...queryConfig,
  });
}
