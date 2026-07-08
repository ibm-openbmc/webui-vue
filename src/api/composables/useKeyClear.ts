import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { useRedfishResource } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { UseQueryOptions } from '@tanstack/vue-query';
import type { Resource } from '@/types/redfish';

interface BiosAttributes extends Resource {
  Attributes: {
    hb_key_clear_request?: string;
  };
}

/**
 * Composable for Key Clear operations
 * Replaces the KeyClearStore with a simple composable
 */
export function useKeyClear() {
  const queryClient = useQueryClient();

  // Fetch BIOS settings to get current key clear status
  const biosQuery = useRedfishResource<BiosAttributes>(
    '/redfish/v1/Systems/system/Bios',
    {
      queryConfig: RedfishQueryPresets.sensors as Partial<
        UseQueryOptions<BiosAttributes>
      >,
    },
  );

  const currentKeyClearRequest = computed(
    () => biosQuery.data.value?.Attributes?.hb_key_clear_request ?? 'NONE',
  );

  const clearKeysMutation = useMutation({
    mutationFn: async (selectedKey: string): Promise<string> => {
      const selectedKeyForClearing = {
        Attributes: { hb_key_clear_request: selectedKey },
      };
      await api.patch(
        '/redfish/v1/Systems/system/Bios/Settings',
        selectedKeyForClearing,
      );
      return i18n.global.t('pageKeyClear.toast.selectedKeyClearedSuccess');
    },
    onSuccess: () => {
      // Invalidate BIOS query to refetch updated key clear status
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'],
      });
    },
    onError: (error: Error) => {
      console.error('Key clear error:', error);
      throw new Error(
        i18n.global.t('pageKeyClear.toast.selectedKeyClearedError'),
      );
    },
  });

  async function clearEncryptionKeys(selectedKey: string): Promise<string> {
    return await clearKeysMutation.mutateAsync(selectedKey);
  }

  return {
    // Query data
    currentKeyClearRequest,
    isLoading: biosQuery.isLoading,
    // Mutation
    clearEncryptionKeys,
    isClearing: clearKeysMutation.isPending,
    // Refetch
    refetch: biosQuery.refetch,
  };
}
