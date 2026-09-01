import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import {
  usePropertyFromCollection,
  useRedfishResource,
} from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
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

interface BiosAttributes extends Resource {
  Attributes?: {
    pvm_system_operating_mode?: string;
  };
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
    isFetching: isFetchingPolicies,
    isError: isPoliciesError,
    error: policiesError,
  } = useQuery({
    queryKey: ['redfish', 'powerRestorePolicy', 'schema'],
    queryFn: async (): Promise<PowerRestorePolicyType[]> => {
      const schemaResponse = await api.get(
        '/redfish/v1/JsonSchemas/ComputerSystem',
      );

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
    ...RedfishQueryPresets.sensors,
  });

  // Fetch current power restore policy from all systems
  const currentPolicyQuery = usePropertyFromCollection<
    SystemResource,
    'PowerRestorePolicy'
  >('/redfish/v1/Systems', 'PowerRestorePolicy', {
    queryConfig: RedfishQueryPresets.sensors as Partial<
      UseQueryOptions<SystemResource[]>
    >,
  });

  // Fetch BIOS attributes for operating mode check
  const biosQuery = useRedfishResource<BiosAttributes>(
    '/redfish/v1/Systems/system/Bios',
    {
      queryConfig: RedfishQueryPresets.sensors as Partial<
        UseQueryOptions<BiosAttributes>
      >,
    },
  );

  const isOperatingModeManual = computed(() => {
    const mode = biosQuery.data.value?.Attributes?.pvm_system_operating_mode;
    return !mode || mode === 'Manual';
  });

  // Set power restore policy mutation
  const setPolicyMutation = useMutation({
    mutationFn: async (powerPolicy: string): Promise<void> => {
      try {
        const data = { PowerRestorePolicy: powerPolicy };
        await api.patch('/redfish/v1/Systems/system', data);
      } catch (error) {
        throw {
          message: i18n.global.t(
            'pagePowerRestorePolicy.toast.errorSaveSettings',
          ),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'powerRestorePolicy', 'current'],
      });
    },
    onError: (error: any) => {
      console.error('Error setting power restore policy:', error);
    },
  });

  // Computed properties
  const powerRestorePolicies = computed(() => policiesData.value || []);
  const powerRestoreCurrentPolicy = computed(
    () => currentPolicyQuery.data.value || null,
  );
  const isLoading = computed(
    () => isPoliciesLoading.value || currentPolicyQuery.isLoading.value,
  );
  const isFetching = computed(
    () =>
      isFetchingPolicies.value ||
      currentPolicyQuery.isFetching.value ||
      biosQuery.isFetching.value,
  );
  const isError = computed(
    () => isPoliciesError.value || currentPolicyQuery.isError.value,
  );

  return {
    // Data
    powerRestorePolicies,
    powerRestoreCurrentPolicy,
    isLoading,
    isFetching,
    isError,
    policiesError,
    currentPolicyError: currentPolicyQuery.error,
    isOperatingModeManual,

    // Actions
    refetchCurrentPolicy: currentPolicyQuery.refetch,
    setPowerRestorePolicy: setPolicyMutation.mutateAsync,

    // Mutation states
    isSettingPolicy: setPolicyMutation.isPending,
  };
}
