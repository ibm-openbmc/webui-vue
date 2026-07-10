/**
 * Request Batching and Concurrency Control
 *
 * Optimizes multiple parallel requests by:
 * - Limiting concurrent requests to prevent overwhelming the server
 * - Deduplicating identical requests
 * - Batching requests into manageable chunks
 * - Providing retry logic for failed requests
 */

import api from '@/store/api';

interface BatchRequestOptions {
  /** Maximum concurrent requests (default: 6) */
  concurrency?: number;
  /** Retry failed requests (default: true) */
  retry?: boolean;
  /** Maximum retry attempts (default: 2) */
  maxRetries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
}

interface RequestQueueItem<T> {
  url: string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  retries: number;
}

/**
 * Request deduplication cache
 * Prevents duplicate requests for the same URL
 */
const requestCache = new Map<string, Promise<any>>();

/**
 * Clear the request cache
 * Useful for forcing fresh data
 */
export function clearRequestCache() {
  requestCache.clear();
}

/**
 * Fetch multiple URLs with concurrency control
 *
 * @example
 * ```typescript
 * const urls = ['/redfish/v1/Chassis/1', '/redfish/v1/Chassis/2'];
 * const results = await batchFetch(urls, { concurrency: 4 });
 * ```
 */
export async function batchFetch<T = any>(
  urls: string[],
  options: BatchRequestOptions = {},
): Promise<T[]> {
  const {
    concurrency = 6,
    retry = true,
    maxRetries = 2,
    retryDelay = 1000,
  } = options;

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(urls));

  // Check cache for existing requests
  const results: (T | Promise<T>)[] = [];
  const urlsToFetch: string[] = [];

  for (const url of uniqueUrls) {
    const cached = requestCache.get(url);
    if (cached) {
      results.push(cached);
    } else {
      urlsToFetch.push(url);
      results.push(null as any); // Placeholder
    }
  }

  if (urlsToFetch.length === 0) {
    // All requests were cached
    return Promise.all(results);
  }

  // Create batches based on concurrency limit
  const batches: string[][] = [];
  for (let i = 0; i < urlsToFetch.length; i += concurrency) {
    batches.push(urlsToFetch.slice(i, i + concurrency));
  }

  // Process batches sequentially, requests within batch in parallel
  const fetchedResults: T[] = [];

  for (const batch of batches) {
    const batchPromises = batch.map(async (url) => {
      let lastError: any;

      for (let attempt = 0; attempt <= (retry ? maxRetries : 0); attempt++) {
        try {
          // Create request promise
          const requestPromise = api.get<T>(url).then((res) => res.data);

          // Cache the promise
          requestCache.set(url, requestPromise);

          const result = await requestPromise;

          // Clear from cache after successful fetch
          // (allows fresh data on next request)
          setTimeout(() => requestCache.delete(url), 100);

          return result;
        } catch (error) {
          lastError = error;

          // Don't retry on client errors (4xx)
          const status = (error as any)?.response?.status;
          if (status && status >= 400 && status < 500) {
            break;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // All retries failed
      throw lastError;
    });

    const batchResults = await Promise.allSettled(batchPromises);

    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        fetchedResults.push(result.value);
      } else {
        console.error('Batch request failed:', result.reason);
        // Push null for failed requests to maintain array indices
        fetchedResults.push(null as any);
      }
    });
  }

  // Merge cached and fetched results
  let fetchedIndex = 0;
  const finalResults = await Promise.all(
    results.map(async (result) => {
      if (result === null) {
        return fetchedResults[fetchedIndex++];
      }
      return result;
    }),
  );

  return finalResults.filter((r) => r !== null);
}

/**
 * Fetch multiple resources with automatic batching
 * Optimized for Redfish collections
 *
 * @example
 * ```typescript
 * const sensorPaths = [
 *   '/redfish/v1/Chassis/1/Sensors',
 *   '/redfish/v1/Chassis/2/Sensors'
 * ];
 * const sensors = await batchFetchCollections(sensorPaths);
 * ```
 */
export async function batchFetchCollections<T = any>(
  collectionPaths: string[],
  options: BatchRequestOptions = {},
): Promise<T[]> {
  // First, fetch all collections
  const collections = await batchFetch(collectionPaths, options);

  // Extract all member URLs
  const memberUrls: string[] = [];
  collections.forEach((collection: any) => {
    if (collection?.Members && Array.isArray(collection.Members)) {
      collection.Members.forEach((member: any) => {
        const url =
          typeof member === 'object' && '@odata.id' in member
            ? member['@odata.id']
            : member;
        if (url) memberUrls.push(url);
      });
    }
  });

  // Fetch all members with batching
  if (memberUrls.length === 0) {
    return [];
  }

  return batchFetch<T>(memberUrls, options);
}

/**
 * Create a batched request queue
 * Useful for progressive loading scenarios
 *
 * @example
 * ```typescript
 * const queue = createRequestQueue({ concurrency: 4 });
 *
 * const sensor1 = queue.add('/redfish/v1/Chassis/1/Sensors/Temp1');
 * const sensor2 = queue.add('/redfish/v1/Chassis/1/Sensors/Temp2');
 *
 * const results = await Promise.all([sensor1, sensor2]);
 * ```
 */
export function createRequestQueue<T = any>(options: BatchRequestOptions = {}) {
  const queue: RequestQueueItem<T>[] = [];
  let processing = false;
  const { concurrency = 6, retry = true, maxRetries = 2 } = options;

  async function processQueue() {
    if (processing || queue.length === 0) return;

    processing = true;

    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency);
      const promises = batch.map(async (item) => {
        try {
          const response = await api.get<T>(item.url);
          item.resolve(response.data);
        } catch (error) {
          if (retry && item.retries < maxRetries) {
            item.retries++;
            queue.push(item); // Re-queue for retry
          } else {
            item.reject(error);
          }
        }
      });

      await Promise.allSettled(promises);
    }

    processing = false;
  }

  return {
    /**
     * Add a request to the queue
     */
    add(url: string): Promise<T> {
      return new Promise((resolve, reject) => {
        queue.push({ url, resolve, reject, retries: 0 });
        processQueue();
      });
    },

    /**
     * Get current queue length
     */
    get length() {
      return queue.length;
    },

    /**
     * Clear the queue
     */
    clear() {
      queue.length = 0;
    },
  };
}

/**
 * Chunk an array into smaller batches
 * Utility function for manual batching
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
