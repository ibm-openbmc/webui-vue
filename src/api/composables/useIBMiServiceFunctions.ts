import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { useRedfishResource } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { System } from '@/types/redfish';

// Extend System with IBM OEM fields not in the base type
interface IBMSystem extends System {
  Oem?: {
    IBM?: {
      EnabledPanelFunctions?: number[];
    };
  };
}

const SYSTEM_PATH = '/redfish/v1/Systems/system';
const SYSTEM_QUERY_KEY = ['redfish', 'resource', SYSTEM_PATH];

/**
 * Composable for managing IBM i Service Functions with TanStack Query.
 * Follows the same pattern as useAuditLogs — useRedfishResource handles
 * caching and background polling; a watch derives availableFunctions from
 * the raw response; executeServiceFunction uses useMutation.
 */
export function useIBMiServiceFunctions() {
  const queryClient = useQueryClient();

  // Fetch /redfish/v1/Systems/system with the ibmiServiceFunctions preset
  // (30 s stale, 2 min gc, 30 s background poll)
  const {
    data: systemRaw,
    isLoading,
    isFetching,
    refetch,
  } = useRedfishResource<IBMSystem>(SYSTEM_PATH, {
    queryConfig: RedfishQueryPresets.ibmiServiceFunctions,
  });

  // Derived reactive list of enabled panel functions
  const availableFunctions = ref<number[]>([]);

  watch(
    systemRaw,
    (system) => {
      availableFunctions.value = system?.Oem?.IBM?.EnabledPanelFunctions ?? [];
    },
    { immediate: true },
  );

  // Execute a service function and refresh the system resource afterward
  const executeServiceFunctionMutation = useMutation({
    mutationFn: async (functionNumber: number): Promise<string> => {
      await api.post(
        '/redfish/v1/Systems/system/Actions/Oem/IBM/IBMComputerSystem.ExecutePanelFunction',
        { FuncNo: functionNumber },
      );
      return i18n.global.t(
        'pageIbmiServiceFunctions.toast.successExecuteFunction',
      );
    },
    onSuccess: () => {
      // Invalidate the system resource so availableFunctions refreshes
      queryClient.invalidateQueries({ queryKey: SYSTEM_QUERY_KEY });
    },
    onError: (error) => {
      console.error(error);
    },
  });

  const executeServiceFunction = async (
    functionNumber: number,
  ): Promise<string> => {
    try {
      return await executeServiceFunctionMutation.mutateAsync(functionNumber);
    } catch {
      throw new Error(
        i18n.global.t('pageIbmiServiceFunctions.toast.errorExecuteFunction'),
      );
    }
  };

  return {
    // Data
    availableFunctions,
    isLoading,
    isFetching,

    // Actions
    refetch,
    executeServiceFunction,

    // Mutation state
    isExecuting: computed(() => executeServiceFunctionMutation.isPending.value),
  };
}
