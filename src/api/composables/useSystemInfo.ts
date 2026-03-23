import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';

export const HOST_STATE = {
  on: 'xyz.openbmc_project.State.Host.HostState.Running',
  off: 'xyz.openbmc_project.State.Host.HostState.Off',
  error: 'xyz.openbmc_project.State.Host.HostState.Quiesced',
  diagnosticMode: 'xyz.openbmc_project.State.Host.HostState.DiagnosticMode',
};

export const serverStateMapper = (hostState: string): string => {
  switch (hostState) {
    case HOST_STATE.on:
    case 'On': // Redfish PowerState
      return 'on';
    case HOST_STATE.off:
    case 'Off': // Redfish PowerState
      return 'off';
    case HOST_STATE.error:
    case 'Quiesced': // Redfish Status
      return 'error';
    case HOST_STATE.diagnosticMode:
    case 'InTest': // Redfish Status
      return 'diagnosticMode';
    default:
      return 'unreachable';
  }
};

const getHealthStatus = (
  events: EventLogEntry[],
  loadedEvents: boolean,
): string => {
  let status = loadedEvents ? 'OK' : '';
  for (const event of events) {
    if (event.Severity === 'Critical' && !event.Resolved) {
      status = 'Critical';
      break;
    } else if (event.Severity === 'Warning' && !event.Resolved) {
      status = 'Warning';
    }
  }
  return status;
};

interface SystemData {
  AssetTag?: string;
  Model?: string;
  PowerState?: string;
  SerialNumber?: string;
  Status?: {
    State?: string;
  };
}

interface EventLogEntry {
  Id: string;
  Severity: string;
  Resolved?: boolean;
}

interface EventLogResponse {
  Members?: EventLogEntry[];
}

export interface SystemInfo {
  assetTag: string | null;
  modelType: string;
  serialNumber: string | null;
  serverStatus: string;
  healthStatus: string;
  events: EventLogEntry[];
}

const SYSTEM_INFO_STORAGE_KEY = 'systemInfoCache';

/**
 * Composable for fetching system information and event log health
 * Replaces parts of GlobalStore and EventLogStore with TanStack Query
 * Data is cached in sessionStorage to persist across page reloads
 */
export function useSystemInfo() {
  const {
    data: systemData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'system', 'info'],
    queryFn: async (): Promise<SystemInfo> => {
      // Check if data exists in sessionStorage first
      const cachedData = sessionStorage.getItem(SYSTEM_INFO_STORAGE_KEY);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          // If parsing fails, continue to fetch fresh data
          sessionStorage.removeItem(SYSTEM_INFO_STORAGE_KEY);
        }
      }

      // Fetch system info and event logs in parallel
      const [systemResponse, eventLogResponse] = await Promise.all([
        api.get<SystemData>('/redfish/v1/Systems/system'),
        api.get<EventLogResponse>(
          '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
        ),
      ]);

      const {
        AssetTag,
        Model,
        PowerState,
        SerialNumber,
        Status: { State } = {},
      } = systemResponse.data;

      let serverStatus = 'unreachable';
      if (State === 'Quiesced' || State === 'InTest') {
        // OpenBMC's host state interface is mapped to 2 Redfish
        // properties "Status""State" and "PowerState". Look first
        // at State for certain cases.
        serverStatus = serverStateMapper(State);
      } else if (PowerState) {
        serverStatus = serverStateMapper(PowerState);
      }

      // Store model type in localStorage for persistence
      if (Model) {
        localStorage.setItem('storedModelType', Model);
      }

      // Process event logs for health status
      const events = eventLogResponse.data.Members || [];
      const healthStatus = getHealthStatus(events, true);

      const systemInfo: SystemInfo = {
        assetTag: AssetTag || null,
        modelType: Model || localStorage.getItem('storedModelType') || '--',
        serialNumber: SerialNumber || null,
        serverStatus,
        healthStatus,
        events,
      };

      // Store in sessionStorage for persistence across page reloads
      sessionStorage.setItem(
        SYSTEM_INFO_STORAGE_KEY,
        JSON.stringify(systemInfo),
      );

      return systemInfo;
    },
    staleTime: Infinity, // Cache for entire session - data won't change until logout
    gcTime: Infinity, // Keep in cache indefinitely during session
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    assetTag: computed(() => systemData.value?.assetTag ?? null),
    modelType: computed(() => systemData.value?.modelType ?? '--'),
    serialNumber: computed(() => systemData.value?.serialNumber ?? null),
    serverStatus: computed(
      () => systemData.value?.serverStatus ?? 'unreachable',
    ),
    healthStatus: computed(() => systemData.value?.healthStatus ?? ''),
    events: computed(() => systemData.value?.events ?? []),
    isLoading,
    error,
    isError,
    refetch,
  };
}

/**
 * Composable for updating asset tag
 * Provides mutation function with automatic cache invalidation
 */
export function useUpdateAssetTag() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (assetTagData: { AssetTag: string }) => {
      await api.patch('/redfish/v1/Systems/system', assetTagData);
      return assetTagData.AssetTag;
    },
    onSuccess: (newAssetTag) => {
      successToast(i18n.global.t('pageOverview.toast.successSaveAssetTag'));
      // Invalidate and refetch system info
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'system', 'info'],
      });

      // Also clear sessionStorage cache
      sessionStorage.removeItem(SYSTEM_INFO_STORAGE_KEY);

      // Update the cache optimistically
      queryClient.setQueryData(
        ['redfish', 'system', 'info'],
        (old: SystemInfo | undefined) => {
          if (old) {
            return { ...old, assetTag: newAssetTag };
          }
          return old;
        },
      );
    },
    onError: (error) => {
      console.log('Asset Tag Error:', error);
      errorToast(i18n.global.t('pageOverview.toast.errorSaveAssetTag'));
    },
  });

  return {
    updateAssetTag: mutation.mutate,
    updateAssetTagAsync: mutation.mutateAsync,
    isUpdating: computed(() => mutation.isPending.value),
    isError: computed(() => mutation.isError.value),
    error: mutation.error,
  };
}
