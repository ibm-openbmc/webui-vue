/**
 * Shared TanStack Query configuration for Redfish API requests
 * Provides consistent caching, retry, and error handling behavior
 */

import type { UseQueryOptions } from '@tanstack/vue-query';

export interface RedfishQueryConfig {
  /** Time in ms before data is considered stale (default: 30s) */
  staleTime?: number;
  /** Time in ms before unused cache is garbage collected (default: 5min) */
  gcTime?: number;
  /** Whether to refetch on window focus (default: false) */
  refetchOnWindowFocus?: boolean;
  /** Whether to refetch on network reconnect (default: true) */
  refetchOnReconnect?: boolean;
  /** Custom retry logic */
  retry?: boolean | number | ((failureCount: number, error: any) => boolean);
  /** Custom retry delay */
  retryDelay?: (attemptIndex: number) => number;
  /** Interval in ms to automatically refetch data in the background */
  refetchInterval?: number | false;
  /** Whether to refetch when the component mounts (default: true — always refetch on mount) */
  refetchOnMount?: boolean | 'always';
}

/**
 * Default retry logic for Redfish API requests
 * - Don't retry client errors (4xx) - they won't succeed on retry
 * - Do retry transient server errors (5xx) and network failures
 */
export const defaultRedfishRetry = (
  failureCount: number,
  error: any,
): boolean => {
  const status = error?.response?.status;

  // Don't retry client errors (400-499)
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // Retry server errors and network failures up to 2 times
  return failureCount < 2;
};

/**
 * Default retry delay with exponential backoff
 * Caps at 10 seconds to prevent excessive waiting
 */
export const defaultRedfishRetryDelay = (attemptIndex: number): number => {
  return Math.min(1000 * 2 ** attemptIndex, 10000);
};

/**
 * Create a Redfish query configuration with sensible defaults
 * Can be overridden for specific use cases
 *
 * @example
 * ```typescript
 * // Use defaults
 * const config = createRedfishQueryConfig();
 *
 * // Override specific options
 * const config = createRedfishQueryConfig({
 *   staleTime: 60 * 1000, // 1 minute
 *   gcTime: 10 * 60 * 1000, // 10 minutes
 * });
 * ```
 */
export function createRedfishQueryConfig<T = unknown>(
  overrides: RedfishQueryConfig = {},
): Partial<UseQueryOptions<T>> {
  const config: Partial<UseQueryOptions<T>> = {
    staleTime: overrides.staleTime ?? 30 * 1000, // 30 seconds
    gcTime: overrides.gcTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: overrides.refetchOnWindowFocus ?? false,
    refetchOnReconnect: overrides.refetchOnReconnect ?? true,
    retry: overrides.retry ?? defaultRedfishRetry,
    refetchInterval: overrides.refetchInterval ?? false,
    retryDelay: overrides.retryDelay ?? defaultRedfishRetryDelay,
    ...(overrides.refetchOnMount !== undefined && {
      refetchOnMount: overrides.refetchOnMount,
    }),
  };

  return config;
}

/**
 * Preset configurations for common scenarios
 */
export const RedfishQueryPresets = {
  /**
   * For sensor readings — always considered stale so each refetch gets fresh
   * data, with automatic background polling every 30 seconds.
   */
  sensors: createRedfishQueryConfig({
    staleTime: 0, // always stale — every refetch fetches fresh data
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // poll every 30 seconds
  }),

  /**
   * For frequently changing data (e.g., sensor readings, power metrics)
   * Shorter stale time for more frequent updates
   */
  realtime: createRedfishQueryConfig({
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
  }),

  /**
   * For static/rarely changing data (e.g., hardware inventory, BIOS settings)
   * Longer stale time to reduce unnecessary requests
   */
  static: createRedfishQueryConfig({
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  }),

  concurrentMaintenance: createRedfishQueryConfig({
    gcTime: 5 * 60 * 1000, // 5 minutes,
    refetchInterval: 30 * 1000,
  }),

  auditLogs: createRedfishQueryConfig({
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000,
  }),

  progressLogs: createRedfishQueryConfig({
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000,
  }),

  eventLogs: createRedfishQueryConfig({
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000,
  }),

  /**
   * For configuration data (e.g., network settings, date/time)
   * Balanced between realtime and static
   */
  config: createRedfishQueryConfig({
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  }),

  /**
   * For service root and metadata (rarely changes)
   * Very long cache times
   */
  metadata: createRedfishQueryConfig({
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  }),
};
