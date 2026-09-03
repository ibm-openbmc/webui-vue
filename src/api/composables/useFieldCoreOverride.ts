import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';

interface BiosAttributes {
  hb_field_core_override?: number;
  hb_field_core_override_current?: number;
  [key: string]: unknown;
}

interface BiosResponse {
  Attributes?: BiosAttributes;
}

/**
 * Composable for fetching and updating Field Core Override BIOS attributes
 * Replaces FieldCoreOverrideStore with TanStack Query
 */
export function useFieldCoreOverride() {
  const queryClient = useQueryClient();

  const {
    data: biosData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'bios'],
    queryFn: async (): Promise<BiosAttributes> => {
      const response = await api.get<BiosResponse>(
        '/redfish/v1/Systems/system/Bios',
      );
      return response.data?.Attributes ?? {};
    },
    staleTime: 0,
    refetchInterval: 60 * 1000,
    gcTime: 5 * 60 * 1000, // 5 minutes
    // Don't retry client errors (4xx) — they won't succeed on retry.
    // Do retry transient server errors (5xx) and network failures.
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const pending = computed<number>(
    () => biosData.value?.hb_field_core_override ?? 0,
  );
  const current = computed<number>(
    () => biosData.value?.hb_field_core_override_current ?? 0,
  );

  const isPending = computed<boolean>(() => current.value !== pending.value);
  const configuredCores = computed<number>(() =>
    isPending.value ? pending.value : current.value,
  );
  const isEnabled = computed<boolean>(() =>
    isPending.value ? pending.value > 0 : current.value > 0,
  );

  const setFieldCoreOverrideMutation = useMutation({
    mutationFn: async (coreOverride: number): Promise<void> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: { hb_field_core_override: +coreOverride },
      });
    },
    onSuccess: () => {
      // Invalidate BIOS query so data refreshes after save
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'bios'],
      });
    },
  });

  return {
    isLoading,
    isFetching,
    isError,
    error,
    isPending,
    configuredCores,
    isEnabled,
    refetch,
    setFieldCoreOverride: setFieldCoreOverrideMutation.mutateAsync,
  };
}
