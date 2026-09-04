import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import type { Manager } from '@/types/redfish';
import { RedfishQueryPresets } from './shared/queryConfig';

/**
 * Composable for fetching BMC manager info and performing BMC reboot
 * Replaces ControlStore.fetchLastBmcRebootTime and ControlStore.rebootBmc with TanStack Query
 */
export function useRebootBmc() {
  const queryClient = useQueryClient();

  const {
    data: managerData,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'managers', 'bmc'],
    queryFn: async (): Promise<Manager> => {
      const response = await api.get<Manager>('/redfish/v1/Managers/bmc');
      return response.data;
    },
    ...RedfishQueryPresets.rebootBmc,
  });

  const lastBmcRebootTime = computed<Date | null>(() => {
    const lastReset = managerData.value?.LastResetTime;
    if (!lastReset) return null;
    return new Date(lastReset);
  });

  const rebootMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/redfish/v1/Managers/bmc/Actions/Manager.Reset', {
        ResetType: 'GracefulRestart',
      });
    },
    onSuccess: () => {
      // Invalidate the BMC query so lastBmcRebootTime refreshes after reboot
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'managers', 'bmc'],
      });
    },
  });

  return {
    lastBmcRebootTime,
    isLoading,
    isFetching,
    isError,
    error,
    rebootBmc: rebootMutation.mutateAsync,
  };
}
