import { computed } from 'vue';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import { useRedfishResource } from './useRedfishCollection';
import { usePatchResource } from './usePatchResource';
import type {
  EnvironmentMetrics,
  SystemPowerMode,
  IdlePowerSaver,
} from '@/types/redfish';

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
  const { successToast, errorToast } = useToast();
  const { patchResource, isPending: isMutating } = usePatchResource();

  const {
    data: environmentMetrics,
    isLoading: isPowerControlLoading,
    isFetching: isPowerControlFetching,
    isError: isPowerControlError,
    error: powerControlError,
  } = useRedfishResource<EnvironmentMetrics>(
    '/redfish/v1/Chassis/chassis/EnvironmentMetrics',
    {
      queryConfig: {
        staleTime: 0,
        gcTime: 2 * 60 * 1000,
        refetchInterval: 60 * 1000,
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
      },
    },
  );

  const powerControlData = computed<PowerControlData>(() => {
    if (!environmentMetrics.value) {
      return {
        powerConsumption: null,
        powerControlMode: null,
        powerCap: null,
        powerCapMin: null,
        powerCapMax: null,
      };
    }

    return {
      powerConsumption: environmentMetrics.value.PowerWatts?.Reading ?? null,
      powerControlMode:
        environmentMetrics.value.PowerLimitWatts?.ControlMode ?? null,
      powerCap: environmentMetrics.value.PowerLimitWatts?.SetPoint ?? null,
      powerCapMin:
        environmentMetrics.value.PowerLimitWatts?.AllowableMin ?? null,
      powerCapMax:
        environmentMetrics.value.PowerLimitWatts?.AllowableMax ?? null,
    };
  });

  const setPowerCap = async (params: SetPowerCapParams): Promise<void> => {
    return patchResource({
      endpoint: '/redfish/v1/Chassis/chassis/EnvironmentMetrics',
      field: 'PowerLimitWatts',
      value: {
        ControlMode: params.powerControlMode,
        SetPoint: params.powerCap,
      },
      invalidateQueries: [
        [
          'redfish',
          'resource',
          '/redfish/v1/Chassis/chassis/EnvironmentMetrics',
        ],
      ],
      onSuccess: () => {
        successToast(
          i18n.global.t('pageServerPowerOperations.toast.successSaveSettings'),
        );
      },
      onError: (error) => {
        console.log('Power Cap Error:', error);
        errorToast(
          i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
        );
      },
    });
  };

  return {
    powerConsumption: computed(() => powerControlData.value.powerConsumption),
    powerControlMode: computed(() => powerControlData.value.powerControlMode),
    isPowerCapEnabled: computed(
      () => powerControlData.value.powerControlMode === 'Automatic',
    ),
    powerCap: computed(() => powerControlData.value.powerCap),
    powerCapMin: computed(() => powerControlData.value.powerCapMin),
    powerCapMax: computed(() => powerControlData.value.powerCapMax),
    isPowerControlLoading,
    isPowerControlFetching,
    isPowerControlMutating: isMutating,
    isPowerControlError,
    powerControlError,
    setPowerCap,
  };
}

/**
 * Composable for fetching and managing power performance mode
 * Replaces PowerControlStore.getPowerPerformanceMode with TanStack Query
 */
export function usePowerPerformanceMode() {
  const { successToast, errorToast } = useToast();
  const { patchResource, isPending: isMutating } = usePatchResource();

  const {
    data: systemPowerMode,
    isLoading: isPowerPerformanceLoading,
    isFetching: isPowerPerformanceFetching,
    isError: isPowerPerformanceError,
    error: powerPerformanceError,
  } = useRedfishResource<SystemPowerMode>('/redfish/v1/Systems/system', {
    queryConfig: {
      staleTime: 0,
      gcTime: 2 * 60 * 1000,
      refetchInterval: 60 * 1000,
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
    },
  });

  const powerPerformanceData = computed<PowerPerformanceData>(() => {
    if (!systemPowerMode.value) {
      return {
        powerPerformanceMode: null,
        powerPerformanceModeValues: null,
      };
    }

    return {
      powerPerformanceMode: systemPowerMode.value.PowerMode ?? null,
      powerPerformanceModeValues:
        systemPowerMode.value['PowerMode@Redfish.AllowableValues'] ?? null,
    };
  });

  const setPowerPerformanceMode = async (
    powerPerformanceMode: string,
  ): Promise<void> => {
    return patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'PowerMode',
      value: powerPerformanceMode,
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system'],
      ],
      onSuccess: () => {
        successToast(
          i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
        );
      },
      onError: (error) => {
        console.log('Power Performance Mode Error:', error);
        errorToast(i18n.global.t('pagePower.toast.errorPowerPerformanceModes'));
      },
    });
  };

  return {
    powerPerformanceMode: computed(
      () => powerPerformanceData.value.powerPerformanceMode,
    ),
    powerPerformanceModeValues: computed(
      () => powerPerformanceData.value.powerPerformanceModeValues,
    ),
    oemMode: computed(
      () => powerPerformanceData.value.powerPerformanceMode === 'OEM',
    ),
    isPowerPerformanceLoading,
    isPowerPerformanceFetching,
    isPowerPerformanceMutating: isMutating,
    isPowerPerformanceError,
    powerPerformanceError,
    setPowerPerformanceMode,
  };
}

/**
 * Composable for fetching and managing idle power saver settings
 * Replaces PowerControlStore.getIdlePowerSaverData with TanStack Query
 */
export function useIdlePowerSaver() {
  const { successToast, errorToast } = useToast();
  const { patchResource, isPending: isMutating } = usePatchResource();

  const {
    data: systemPowerMode,
    isLoading: isIdlePowerSaverLoading,
    isFetching: isIdlePowerSaverFetching,
    isError: isIdlePowerSaverError,
    error: idlePowerSaverError,
    refetch: refetchIdlePowerSaver,
  } = useRedfishResource<SystemPowerMode>('/redfish/v1/Systems/system', {
    queryConfig: {
      staleTime: 0,
      gcTime: 2 * 60 * 1000,
      refetchInterval: 60 * 1000,
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
    },
  });

  const idlePowerSaverData = computed<IdlePowerSaver | null>(() => {
    return systemPowerMode.value?.IdlePowerSaver ?? null;
  });

  const setIdlePowerSaver = async (
    params: SetIdlePowerSaverParams,
  ): Promise<void> => {
    return patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'IdlePowerSaver',
      value: {
        Enabled: params.isIdlePowerSaverEnabled,
        EnterDwellTimeSeconds: params.enterDwellTimeSeconds,
        ExitDwellTimeSeconds: params.exitDwellTimeSeconds,
        EnterUtilizationPercent: params.enterUtilizationPercent,
        ExitUtilizationPercent: params.exitUtilizationPercent,
      },
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system'],
      ],
      onSuccess: () => {
        successToast(i18n.global.t('pagePower.toast.successIdlePower'));
      },
      onError: (error) => {
        console.log('Idle Power Saver Error:', error);
        errorToast(i18n.global.t('pagePower.toast.errorIdlePower'));
      },
    });
  };

  const resetIdlePowerSaver = async (): Promise<void> => {
    return patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'IdlePowerSaver.ExitUtilizationPercent',
      value: 0,
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system'],
      ],
      onSuccess: () => {
        successToast(i18n.global.t('pagePower.toast.successIdlePowerReset'));
      },
      onError: (error) => {
        console.log('Idle Power Saver Reset Error:', error);
        errorToast(i18n.global.t('pagePower.toast.errorIdlePowerReset'));
      },
    });
  };

  const setIdlePowerSaverEnable = async (enabled: boolean): Promise<void> => {
    return patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'IdlePowerSaver.Enabled',
      value: enabled,
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system'],
      ],
      onSuccess: () => {
        successToast(
          i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
        );
      },
      onError: (error) => {
        console.log('Idle Power Saver Enable Error:', error);
        errorToast(i18n.global.t('pagePower.toast.errorPowerPerformanceModes'));
      },
    });
  };

  return {
    idlePowerSaverData,
    isIdlePowerSaverLoading,
    isIdlePowerSaverFetching,
    isIdlePowerSaverMutating: isMutating,
    isIdlePowerSaverError,
    idlePowerSaverError,
    refetch: refetchIdlePowerSaver,
    setIdlePowerSaver,
    resetIdlePowerSaver,
    setIdlePowerSaverEnable,
  };
}
