import { computed } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import {
  useRedfishResource,
  useRedfishCollection,
} from './useRedfishCollection';
import { usePatchResource } from './usePatchResource';
import type { System, EventLog } from '@/types/redfish';

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

interface EventLogEntry {
  Id: string;
  Severity?: string;
  Resolved?: boolean;
}

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
  // Fetch system info
  const {
    data: system,
    isLoading: isSystemLoading,
    error: systemError,
    isError: isSystemError,
    refetch: refetchSystem,
  } = useRedfishResource<System>('/redfish/v1/Systems/system');

  // Fetch event logs
  const {
    data: eventLogs,
    isLoading: isEventsLoading,
    error: eventsError,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useRedfishCollection<EventLog>(
    '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
    {
      staleTime: 30 * 1000, // 30 seconds
    },
  );

  const systemData = computed((): SystemInfo | null => {
    if (!system.value) {
      // Check if data exists in sessionStorage first
      const cachedData = sessionStorage.getItem(SYSTEM_INFO_STORAGE_KEY);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          sessionStorage.removeItem(SYSTEM_INFO_STORAGE_KEY);
        }
      }
      return null;
    }

    const { AssetTag, Model, PowerState, SerialNumber, Status } = system.value;

    let serverStatus = 'unreachable';
    if (Status?.State === 'Quiesced' || Status?.State === 'InTest') {
      // OpenBMC's host state interface is mapped to 2 Redfish
      // properties "Status""State" and "PowerState". Look first
      // at State for certain cases.
      serverStatus = serverStateMapper(Status.State);
    } else if (PowerState) {
      serverStatus = serverStateMapper(PowerState);
    }

    // Store model type in localStorage for persistence
    if (Model) {
      localStorage.setItem('storedModelType', Model);
    }

    // Process event logs for health status
    const events = eventLogs.value || [];
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
    sessionStorage.setItem(SYSTEM_INFO_STORAGE_KEY, JSON.stringify(systemInfo));

    return systemInfo;
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
    isLoading: computed(() => isSystemLoading.value || isEventsLoading.value),
    error: computed(() => systemError.value || eventsError.value),
    isError: computed(() => isSystemError.value || isEventsError.value),
    refetch: () => {
      refetchSystem();
      refetchEvents();
    },
  };
}

/**
 * Composable for updating asset tag
 * Provides mutation function with automatic cache invalidation
 */
export function useUpdateAssetTag() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();
  const { patchResource, isPending, isError, error } = usePatchResource();

  const updateAssetTag = async (
    assetTagData: { AssetTag: string } | string,
  ) => {
    const assetTag =
      typeof assetTagData === 'string' ? assetTagData : assetTagData.AssetTag;

    try {
      await patchResource({
        endpoint: '/redfish/v1/Systems/system',
        field: 'AssetTag',
        value: assetTag,
        invalidateQueries: [
          ['redfish', 'system', 'info'],
          ['redfish', 'resource', '/redfish/v1/Systems/system'],
        ],
        onSuccess: () => {
          successToast(i18n.global.t('pageOverview.toast.successSaveAssetTag'));
          // Also clear sessionStorage cache
          sessionStorage.removeItem(SYSTEM_INFO_STORAGE_KEY);
        },
      });

      // Update the cache optimistically
      queryClient.setQueryData(
        ['redfish', 'system', 'info'],
        (old: SystemInfo | undefined) => {
          if (old) {
            return { ...old, assetTag };
          }
          return old;
        },
      );
    } catch (err) {
      console.log('Asset Tag Error:', err);
      errorToast(i18n.global.t('pageOverview.toast.errorSaveAssetTag'));
      throw err;
    }
  };

  return {
    updateAssetTag,
    updateAssetTagAsync: updateAssetTag,
    isUpdating: isPending,
    isError,
    error,
  };
}
