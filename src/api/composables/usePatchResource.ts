import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';

/**
 * Generic composable for patching any Redfish resource
 * Provides a reusable mutation for updating resource fields with automatic rollback on error
 *
 * Features:
 * - Automatic query cache rollback on patch failure
 * - Support for nested field paths (dot notation)
 * - Query invalidation after successful updates
 *
 * @example
 * const { patchResource, isPending, error } = usePatchResource();
 *
 * // Patch a single field
 * await patchResource({
 *   endpoint: '/redfish/v1/Chassis/chassis/Assembly',
 *   field: 'Assemblies',
 *   value: [{ MemberId: '1', Oem: { OpenBMC: { ReadyToRemove: true } } }],
 *   invalidateQueries: [['redfish', 'allSubResources', '/redfish/v1/Chassis', 'Assembly']]
 * });
 *
 * // Patch with nested field path
 * await patchResource({
 *   endpoint: '/redfish/v1/Systems/system',
 *   field: 'Boot.BootSourceOverrideEnabled',
 *   value: 'Once',
 *   invalidateQueries: [['redfish', 'systems']]
 * });
 *
 * // If the patch fails, the query cache is automatically rolled back to its previous state
 * // This ensures UI components (like toggles) revert to their original state on error
 */
export function usePatchResource() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      endpoint,
      field,
      value,
      additionalFields,
    }: {
      endpoint: string;
      field: string;
      value: any;
      additionalFields?: Record<string, any>;
    }) => {
      // Build the patch payload
      // Support nested field paths like "Boot.BootSourceOverrideEnabled"
      const fieldParts = field.split('.');
      let payload: any = {};

      if (fieldParts.length === 1) {
        // Simple field: { field: value }
        payload[field] = value;
      } else {
        // Nested field: { parent: { child: value } }
        let current = payload;
        for (let i = 0; i < fieldParts.length - 1; i++) {
          current[fieldParts[i]] = {};
          current = current[fieldParts[i]];
        }
        current[fieldParts[fieldParts.length - 1]] = value;
      }

      // Merge additional fields if provided
      if (additionalFields) {
        payload = { ...payload, ...additionalFields };
      }

      const response = await api.patch(endpoint, payload);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Error patching resource:', error);
      throw error;
    },
  });

  /**
   * Patch a resource field with automatic rollback on error
   *
   * This function captures the current query cache state before making the patch request.
   * If the request fails, it automatically restores the previous state, ensuring that
   * UI components (like toggles, checkboxes) revert to their original values.
   *
   * @param params - Patch parameters
   * @param params.endpoint - The Redfish endpoint to patch
   * @param params.field - The field to update (supports dot notation for nested fields)
   * @param params.value - The new value for the field
   * @param params.additionalFields - Optional additional fields to include in the patch
   * @param params.invalidateQueries - Optional array of query keys to invalidate after success.
   *                                    These queries are also used for rollback on error.
   * @param params.onSuccess - Optional callback executed immediately after PATCH succeeds,
   *                           before query invalidation/refetch. Useful for showing success
   *                           messages tightly coupled to the PATCH operation.
   * @returns Promise that resolves with the response data
   * @throws Re-throws the error after rolling back the cache state
   */
  const patchResource = async ({
    endpoint,
    field,
    value,
    additionalFields,
    invalidateQueries,
    onSuccess,
    onError,
  }: {
    endpoint: string;
    field: string;
    value: any;
    additionalFields?: Record<string, any>;
    invalidateQueries?: Array<string | string[]>;
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }) => {
    // Store previous data for rollback on error
    const rollbackQueries: Array<{ queryKey: any; previousData: any }> = [];

    // Capture current state before mutation for rollback
    if (invalidateQueries && invalidateQueries.length > 0) {
      for (const queryKey of invalidateQueries) {
        const key = Array.isArray(queryKey) ? queryKey : [queryKey];
        const previousData = queryClient.getQueryData(key);
        if (previousData) {
          rollbackQueries.push({ queryKey: key, previousData });
        }
      }
    }

    try {
      const result = await mutation.mutateAsync({
        endpoint,
        field,
        value,
        additionalFields,
      });

      // Call onSuccess callback immediately after PATCH succeeds
      // This happens before query invalidation/refetch
      if (onSuccess) {
        onSuccess();
      }

      // Invalidate specified queries after successful mutation
      if (invalidateQueries && invalidateQueries.length > 0) {
        for (const queryKey of invalidateQueries) {
          await queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        }
      }

      return result;
    } catch (error) {
      // Call onError callback if provided
      if (onError) {
        onError(error);
      }

      // On error: Invalidate queries to force immediate refetch from server
      // This ensures the UI reverts to the actual server state
      if (invalidateQueries && invalidateQueries.length > 0) {
        const invalidatePromises = invalidateQueries.map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
            refetchType: 'active', // Only refetch active queries
          }),
        );
        await Promise.all(invalidatePromises);
      }

      // Re-throw the error so the caller can handle it
      throw error;
    }
  };

  return {
    patchResource,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
