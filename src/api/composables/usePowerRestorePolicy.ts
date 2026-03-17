import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { usePropertyFromCollection } from './useAllSubResources';
import type { Resource } from '@/types/redfish';

interface PowerRestorePolicyType {
  state: string;
  desc: string;
}

interface PowerRestorePolicyData {
  currentPolicy: string | null;
  policies: PowerRestorePolicyType[];
}

interface SystemResource extends Resource {
  PowerRestorePolicy?: string;
}

/**
 * Composable for fetching and managing Power Restore Policy
 * Replaces PowerPolicyStore with TanStack Query
 */
export function usePowerRestorePolicy() {
  const queryClient = useQueryClient();

  // Fetch available power restore policies from schema
  const {
    data: policiesData,
    isLoading: isPoliciesLoading,
    isError: isPoliciesError,
    error: policiesError,
  } = useQuery({
    queryKey: ['redfish', 'powerRestorePolicy', 'schema'],
    queryFn: async (): Promise<PowerRestorePolicyType[]> => {
      const schemaResponse = await api.get('/redfish/v1/JsonSchemas/ComputerSystem');
      
      if (
        !schemaResponse.data?.Location?.length ||
        !schemaResponse.data.Location[0].Uri
      ) {
        return [];
      }

      const schemaUri = schemaResponse.data.Location[0].Uri;
      const schemaDetailResponse = await api.get(schemaUri);
      
      const powerRestorePolicyTypes =
        schemaDetailResponse.data?.definitions?.PowerRestorePolicyTypes;

      if (!powerRestorePolicyTypes?.enum) {
        return [];
      }

      return powerRestorePolicyTypes.enum.map((powerState: string) => {
        const desc = `${i18n.global.t(
          `pagePowerRestorePolicy.policies.${powerState}`,
        )} - ${powerRestorePolicyTypes.enumDescriptions[powerState]}`;
        
        return {
          state: powerState,
          desc,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - schema rarely changes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch current power restore policy from all systems
  const currentPolicyQuery = usePropertyFromCollection<SystemResource, 'PowerRestorePolicy'>(
    '/redfish/v1/Systems',
    'PowerRestorePolicy'
  );

  // Set power restore policy mutation
  const setPolicyMutation = useMutation({
    mutationFn: async (powerPolicy: string): Promise<void> => {
      const data = { PowerRestorePolicy: powerPolicy };
      await api.patch('/redfish/v1/Systems/system', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'powerRestorePolicy', 'current'],
      });
    },
    onError: (error: any) => {
      console.error('Error setting power restore policy:', error);
      const message = i18n.global.t(
        'pagePowerRestorePolicy.toast.errorSaveSettings'
      );
      throw new Error(message);
    },
  });

  // Computed properties
  const powerRestorePolicies = computed(() => policiesData.value || []);
  const powerRestoreCurrentPolicy = computed(() => currentPolicyQuery.data.value || null);
  const isLoading = computed(
    () => isPoliciesLoading.value || currentPolicyQuery.isLoading.value
  );
  const isError = computed(
    () => isPoliciesError.value || currentPolicyQuery.isError.value
  );

  return {
    // Data
    powerRestorePolicies,
    powerRestoreCurrentPolicy,
    isLoading,
    isError,
    policiesError,
    currentPolicyError: currentPolicyQuery.error,

    // Actions
    refetchCurrentPolicy: currentPolicyQuery.refetch,
    setPowerRestorePolicy: setPolicyMutation.mutateAsync,

    // Mutation states
    isSettingPolicy: setPolicyMutation.isPending,
  };
}