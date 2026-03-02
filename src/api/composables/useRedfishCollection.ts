import { useQuery } from '@tanstack/vue-query';
import api from '@/store/api';
import type { ResourceCollection, Resource, ExpandedCollection } from '@/types/redfish';

interface UseRedfishCollectionOptions {
  expand?: boolean;
  expandLevels?: number;
  select?: string[];
  enabled?: boolean;
}

/**
 * Smart collection fetcher with OData optimization
 * Automatically uses $expand when supported, falls back to basic fetch
 */
export function useRedfishCollection<T extends Resource>(
  collectionPath: string,
  options: UseRedfishCollectionOptions = {}
) {
  const {
    expand = true,
    expandLevels = 1,
    select,
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ['redfish', 'collection', collectionPath, { expand, expandLevels, select }],
    queryFn: async (): Promise<T[]> => {
      const queryString = expand ? `?$expand=.($levels=${expandLevels})` : '';
      const url = `${collectionPath}${queryString}`;

      try {
        const response = await api.get<ExpandedCollection<T> | ResourceCollection>(url);
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
          const memberPromises = data.Members.map((member: any) => {
            const memberId = typeof member === 'object' && '@odata.id' in member
              ? member['@odata.id']
              : member;
            return api.get<T>(memberId as string);
          });

          const responses = await Promise.all(memberPromises);
          return responses.map((res: any) => res.data);
        }

        return [];
      } catch (error) {
        console.error(`Error fetching collection ${collectionPath}:`, error);
        throw error;
      }
    },
    enabled,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    // Don't retry client errors (4xx) — they won't succeed on retry.
    // Do retry transient server errors (5xx) and network failures.
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Fetch a single resource by path
 */
export function useRedfishResource<T extends Resource>(
  resourcePath: string,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: ['redfish', 'resource', resourcePath],
    queryFn: async (): Promise<T> => {
      const response = await api.get<T>(resourcePath);
      return response.data;
    },
    enabled,
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
}
