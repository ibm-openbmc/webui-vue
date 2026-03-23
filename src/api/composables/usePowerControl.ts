import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';

interface PowerLimitWatts {
  Reading?: number;
  ControlMode?: string;
  SetPoint?: number;
  AllowableMin?: number;
  AllowableMax?: number;
}

interface EnvironmentMetricsData {
  PowerWatts?: {
    Reading?: number;
  };
  PowerLimitWatts?: PowerLimitWatts;
}

interface IdlePowerSaver {
  Enabled?: boolean;
  EnterDwellTimeSeconds?: number;
  ExitDwellTimeSeconds?: number;
  EnterUtilizationPercent?: number;
  ExitUtilizationPercent?: number;
}

interface SystemData {
  PowerMode?: string;
  'PowerMode@Redfish.AllowableValues'?: string[];
  IdlePowerSaver?: IdlePowerSaver;
}

interface PowerControlData {
  powerConsumption: number | null;
  powerControlMode: string | null;
  powerCap: number | null;
  powerCapMin: number | null;
  powerCapMax: number | null;
}

interface PowerPerformanceData {
  powerPerformanceMode: string | null;
  powerPerformanceModeValues: string[] | null;
}

interface SetPowerCapParams {
  powerControlMode: string;
  powerCap: number;
}

interface SetIdlePowerSaverParams {
  isIdlePowerSaverEnabled: boolean;
  enterDwellTimeSeconds: number;
  exitDwellTimeSeconds: number;
  enterUtilizationPercent: number;
  exitUtilizationPercent: number;
}

/**
 * Composable for fetching and managing power control settings
 * Replaces PowerControlStore.getPowerControl with TanStack Query
 */
export function usePowerControl() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  const {
    data: powerControlData,
    isFetching: isPowerControlFetching,
    isError: isPowerControlError,
    error: powerControlError,
  } = useQuery({
    queryKey: ['redfish', 'chassis', 'environment-metrics'],
    queryFn: async (): Promise<PowerControlData> => {
      const response = await api.get<EnvironmentMetricsData>(
        '/redfish/v1/Chassis/chassis/EnvironmentMetrics',
      );
      const data = response.data;

      return {
        powerConsumption: data.PowerWatts?.Reading ?? null,
        powerControlMode: data.PowerLimitWatts?.ControlMode ?? null,
        powerCap: data.PowerLimitWatts?.SetPoint ?? null,
        powerCapMin: data.PowerLimitWatts?.AllowableMin ?? null,
        powerCapMax: data.PowerLimitWatts?.AllowableMax ?? null,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const setPowerCapMutation = useMutation({
    mutationFn: async (params: SetPowerCapParams): Promise<void> => {
      const newPowerCap = {
        PowerLimitWatts: {
          ControlMode: params.powerControlMode,
          SetPoint: params.powerCap,
        },
      };
      await api.patch(
        '/redfish/v1/Chassis/chassis/EnvironmentMetrics',
        newPowerCap,
      );
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageServerPowerOperations.toast.successSaveSettings'),
      );
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'chassis', 'environment-metrics'],
      });
    },
    onError: (error) => {
      console.log('Power Cap Error:', error);
      errorToast(
        i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
      );
    },
  });

  return {
    powerConsumption: computed(
      () => powerControlData.value?.powerConsumption ?? null,
    ),
    powerControlMode: computed(
      () => powerControlData.value?.powerControlMode ?? null,
    ),
    isPowerCapEnabled: computed(
      () => powerControlData.value?.powerControlMode === 'Automatic',
    ),
    powerCap: computed(() => powerControlData.value?.powerCap ?? null),
    powerCapMin: computed(() => powerControlData.value?.powerCapMin ?? null),
    powerCapMax: computed(() => powerControlData.value?.powerCapMax ?? null),
    isPowerControlFetching,
    isPowerControlError,
    powerControlError,
    setPowerCap: setPowerCapMutation.mutateAsync,
  };
}

/**
 * Composable for fetching and managing power performance mode
 * Replaces PowerControlStore.getPowerPerformanceMode with TanStack Query
 */
export function usePowerPerformanceMode() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  const {
    data: powerPerformanceData,
    isFetching: isPowerPerformanceFetching,
    isError: isPowerPerformanceError,
    error: powerPerformanceError,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'power-mode'],
    queryFn: async (): Promise<PowerPerformanceData> => {
      const response = await api.get<SystemData>('/redfish/v1/Systems/system');
      const data = response.data;

      return {
        powerPerformanceMode: data.PowerMode ?? null,
        powerPerformanceModeValues:
          data['PowerMode@Redfish.AllowableValues'] ?? null,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const setPowerPerformanceModeMutation = useMutation({
    mutationFn: async (powerPerformanceMode: string): Promise<void> => {
      const newData = { PowerMode: powerPerformanceMode };
      await api.patch('/redfish/v1/Systems/system', newData);
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
      );
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'power-mode'],
      });
    },
    onError: (error) => {
      console.log('Power Performance Mode Error:', error);
      errorToast(i18n.global.t('pagePower.toast.errorPowerPerformanceModes'));
    },
  });

  return {
    powerPerformanceMode: computed(
      () => powerPerformanceData.value?.powerPerformanceMode ?? null,
    ),
    powerPerformanceModeValues: computed(
      () => powerPerformanceData.value?.powerPerformanceModeValues ?? null,
    ),
    oemMode: computed(
      () => powerPerformanceData.value?.powerPerformanceMode === 'OEM',
    ),
    isPowerPerformanceFetching,
    isPowerPerformanceError,
    powerPerformanceError,
    setPowerPerformanceMode: setPowerPerformanceModeMutation.mutateAsync,
  };
}

/**
 * Composable for fetching and managing idle power saver settings
 * Replaces PowerControlStore.getIdlePowerSaverData with TanStack Query
 */
export function useIdlePowerSaver() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  const {
    data: idlePowerSaverData,
    isFetching: isIdlePowerSaverFetching,
    isError: isIdlePowerSaverError,
    error: idlePowerSaverError,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'idle-power-saver'],
    queryFn: async (): Promise<IdlePowerSaver | null> => {
      const response = await api.get<SystemData>('/redfish/v1/Systems/system');
      return response.data.IdlePowerSaver ?? null;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const setIdlePowerSaverMutation = useMutation({
    mutationFn: async (params: SetIdlePowerSaverParams): Promise<void> => {
      const newData = {
        IdlePowerSaver: {
          Enabled: params.isIdlePowerSaverEnabled,
          EnterDwellTimeSeconds: params.enterDwellTimeSeconds,
          ExitDwellTimeSeconds: params.exitDwellTimeSeconds,
          EnterUtilizationPercent: params.enterUtilizationPercent,
          ExitUtilizationPercent: params.exitUtilizationPercent,
        },
      };
      await api.patch('/redfish/v1/Systems/system', newData);
    },
    onSuccess: () => {
      successToast(i18n.global.t('pagePower.toast.successIdlePower'));
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'idle-power-saver'],
      });
    },
    onError: (error) => {
      console.log('Idle Power Saver Error:', error);
      errorToast(i18n.global.t('pagePower.toast.errorIdlePower'));
    },
  });

  const resetIdlePowerSaverMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const newData = {
        IdlePowerSaver: {
          ExitUtilizationPercent: 0,
        },
      };
      await api.patch('/redfish/v1/Systems/system', newData);
    },
    onSuccess: () => {
      successToast(i18n.global.t('pagePower.toast.successIdlePowerReset'));
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'idle-power-saver'],
      });
    },
    onError: (error) => {
      console.log('Idle Power Saver Reset Error:', error);
      errorToast(i18n.global.t('pagePower.toast.errorIdlePowerReset'));
    },
  });

  const setIdlePowerSaverEnableMutation = useMutation({
    mutationFn: async (enabled: boolean): Promise<void> => {
      const newData = {
        IdlePowerSaver: {
          Enabled: enabled,
        },
      };
      await api.patch('/redfish/v1/Systems/system', newData);
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
      );
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'idle-power-saver'],
      });
    },
    onError: (error) => {
      console.log('Idle Power Saver Enable Error:', error);
      errorToast(i18n.global.t('pagePower.toast.errorPowerPerformanceModes'));
    },
  });

  return {
    idlePowerSaverData: computed(() => idlePowerSaverData.value ?? null),
    isIdlePowerSaverFetching,
    isIdlePowerSaverError,
    idlePowerSaverError,
    refetch,
    setIdlePowerSaver: setIdlePowerSaverMutation.mutateAsync,
    resetIdlePowerSaver: resetIdlePowerSaverMutation.mutateAsync,
    setIdlePowerSaverEnable: setIdlePowerSaverEnableMutation.mutateAsync,
  };
}
