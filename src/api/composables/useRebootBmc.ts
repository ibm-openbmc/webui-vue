import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import type { Manager } from '@/types/redfish';

/**
 * Composable for fetching BMC manager info and performing BMC reboot
 * Replaces ControlStore.fetchLastBmcRebootTime and ControlStore.rebootBmc with TanStack Query
 */
export function useRebootBmc() {
  const queryClient = useQueryClient();

  const { data: managerData, isFetching, isError, error } = useQuery({
    queryKey: ['redfish', 'managers', 'bmc'],
    queryFn: async (): Promise<Manager> => {
      const response = await api.get<Manager>('/redfish/v1/Managers/bmc');
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds
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
    isFetching,
    isError,
    error,
    rebootBmc: rebootMutation.mutateAsync,
  };
}
