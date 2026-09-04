import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';

interface BiosAttributes {
  [key: string]: any;
}

interface BiosResponse {
  Attributes?: BiosAttributes;
}

interface RegistryAttribute {
  AttributeName: string;
  CurrentValue?: any;
  UpperBound?: number;
  Value?: Array<{ ValueName: string }>;
}

interface RegistryResponse {
  RegistryEntries?: {
    Attributes: RegistryAttribute[];
  };
}

/**
 * Generic composable for fetching and updating BIOS attributes
 * Can be used by Memory, System Parameters, and other BIOS-related pages
 */
export function useBiosAttributes() {
  const queryClient = useQueryClient();

  // Fetch BIOS data
  const {
    data: biosData,
    isLoading: isLoadingBios,
    isFetching: isFetchingBios,
    isError: isBiosError,
    error: biosError,
    refetch: refetchBios,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'bios'],
    queryFn: async (): Promise<BiosAttributes> => {
      const response = await api.get<BiosResponse>(
        '/redfish/v1/Systems/system/Bios',
      );
      return response.data?.Attributes ?? {};
    },
    staleTime: 0,
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch BIOS Registry data
  const {
    data: registryData,
    isLoading: isLoadingRegistry,
    isFetching: isFetchingRegistry,
    isError: isRegistryError,
    error: registryError,
    refetch: refetchRegistry,
  } = useQuery({
    queryKey: ['redfish', 'registries', 'bios'],
    queryFn: async (): Promise<RegistryAttribute[]> => {
      const response = await api.get<RegistryResponse>(
        '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
      );
      return response.data?.RegistryEntries?.Attributes ?? [];
    },
    staleTime: 0,
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // 60 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Helper function to get a BIOS attribute value
  const getBiosAttribute = (attributeName: string) => {
    return computed(() => biosData.value?.[attributeName] ?? null);
  };

  // Helper function to get a boolean BIOS attribute (Enabled/Disabled)
  const getBiosBooleanAttribute = (attributeName: string) => {
    return computed<boolean | null>(() => {
      const value = biosData.value?.[attributeName];
      if (value === undefined || value === null) return null;
      return value === 'Enabled';
    });
  };

  // Helper function to get registry attribute options
  const getRegistryOptions = (attributeName: string) => {
    return computed<string[]>(() => {
      if (!registryData.value) return [];
      const attr = registryData.value.find(
        (a) => a.AttributeName === attributeName,
      );
      return attr?.Value?.map((v) => v.ValueName) ?? [];
    });
  };

  // Helper function to get registry attribute current value
  const getRegistryCurrentValue = (attributeName: string) => {
    return computed(() => {
      if (!registryData.value) return null;
      const attr = registryData.value.find(
        (a) => a.AttributeName === attributeName,
      );
      return attr?.CurrentValue ?? null;
    });
  };

  // Helper function to get registry attribute upper bound
  const getRegistryUpperBound = (attributeName: string) => {
    return computed<number | null>(() => {
      if (!registryData.value) return null;
      const attr = registryData.value.find(
        (a) => a.AttributeName === attributeName,
      );
      return attr?.UpperBound ?? null;
    });
  };

  // Loading and error states
  // isLoading: true only on first fetch (no cache) — use for the page loading bar
  // isFetching: true on first fetch AND every background poll — use only for busy indicators
  const isLoading = computed(
    () => isLoadingBios.value || isLoadingRegistry.value,
  );
  const isFetching = computed(
    () => isFetchingBios.value || isFetchingRegistry.value,
  );
  const isError = computed(() => isBiosError.value || isRegistryError.value);
  const error = computed(() => biosError.value || registryError.value);

  // Generic mutation to update BIOS attributes
  const updateBiosAttributesMutation = useMutation({
    mutationFn: async (attributes: Record<string, any>): Promise<void> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: attributes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'bios'],
      });
    },
  });

  // Helper function to update a single attribute
  const updateBiosAttribute = async (
    attributeName: string,
    value: any,
  ): Promise<void> => {
    return updateBiosAttributesMutation.mutateAsync({ [attributeName]: value });
  };

  // Helper function to update a boolean attribute (converts to Enabled/Disabled)
  const updateBiosBooleanAttribute = async (
    attributeName: string,
    enabled: boolean,
  ): Promise<void> => {
    const value = enabled ? 'Enabled' : 'Disabled';
    return updateBiosAttribute(attributeName, value);
  };

  return {
    // Raw data
    biosData,
    registryData,

    // Loading and error states
    // isLoading is true only on the initial fetch (no cached data)
    isLoading,
    isFetching,
    isFetchingBios,
    isFetchingRegistry,
    isError,
    error,

    // Refetch functions
    refetchBios,
    refetchRegistry,

    // Helper functions
    getBiosAttribute,
    getBiosBooleanAttribute,
    getRegistryOptions,
    getRegistryCurrentValue,
    getRegistryUpperBound,

    // Mutations
    updateBiosAttributes: updateBiosAttributesMutation.mutateAsync,
    updateBiosAttribute,
    updateBiosBooleanAttribute,
    isUpdating: updateBiosAttributesMutation.isPending,
  };
}
