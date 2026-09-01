import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useRedfishCollection';
import { usePatchResource } from './usePatchResource';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - api.js is a JavaScript module
import { getResponseCount } from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import type { EventLog } from '@/types/redfish';

// Base event log data interface (server data only)
export interface EventLogData {
  id: string;
  eventId?: string;
  severity?: 'OK' | 'Warning' | 'Critical';
  date: Date;
  type?: string;
  description?: string;
  name?: string;
  modifiedDate: Date;
  resolution?: string;
  uri: string;
  filterByStatus: 'Resolved' | 'Unresolved';
  status: boolean;
  additionalDataUri?: string;
  actions: Array<{ value: string; title?: string }>;
}

// UI state interface (client-side state only)
export interface EventLogUIState {
  toggleDetails: boolean;
  rowSelected: boolean;
  // Add more UI-specific properties here as needed
}

// Combined interface for the component
export interface ProcessedEventLog extends EventLogData, EventLogUIState {}

/**
 * Composable for fetching and managing event logs
 * Replaces the EventLogStore with TanStack Query
 */
export function useEventLogs() {
  const queryClient = useQueryClient();
  const { patchResource } = usePatchResource();

  // Helper function to process event logs (data only, no UI state)
  const processEventLog = (log: EventLog): EventLogData => {
    const {
      Id,
      EventId,
      Severity,
      Created,
      EntryType,
      Message,
      Name,
      Modified,
      Resolution,
      Resolved,
      AdditionalDataURI,
    } = log;

    return {
      id: Id,
      eventId: EventId,
      severity: Severity,
      date: new Date(Created),
      type: EntryType,
      description: Message,
      name: Name,
      modifiedDate: Modified ? new Date(Modified) : new Date(Created),
      resolution: Resolution,
      uri: (log as any)['@odata.id'],
      filterByStatus: Resolved ? 'Resolved' : 'Unresolved',
      status: Resolved || false,
      additionalDataUri: AdditionalDataURI,
      actions: [{ value: 'download' }, { value: 'delete' }],
    };
  };

  /**
   * Get default UI state for a new log entry
   */
  const getDefaultUIState = (): EventLogUIState => {
    return {
      toggleDetails: false,
      rowSelected: false,
      // Add defaults for other UI properties here
    };
  };

  // Fetch Event Logs using useRedfishCollection with realtime preset
  const {
    data: eventLogsRaw,
    isLoading: isLoadingEventLogs,
    isFetching: isFetchingEventLogs,
    error: eventLogsError,
    isError: isEventLogsError,
    refetch: refetchEventLogs,
  } = useRedfishCollection<EventLog>(
    '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
    {
      queryConfig: RedfishQueryPresets.eventLogs,
    },
  );

  // Fetch CE Logs using useRedfishCollection (disabled by default)
  const {
    data: ceLogsRaw,
    isLoading: isLoadingCELogs,
    isFetching: isFetchingCELogs,
    error: ceLogsError,
    isError: isCELogsError,
    refetch: refetchCELogs,
  } = useRedfishCollection<EventLog>(
    '/redfish/v1/Systems/system/LogServices/CELog/Entries',
    {
      queryConfig: RedfishQueryPresets.eventLogs,
    },
  );

  // Process the raw data into ProcessedEventLog format
  const eventLogsData = computed(() => {
    if (!eventLogsRaw.value) return [];
    return eventLogsRaw.value.map(processEventLog);
  });

  const ceLogsData = computed(() => {
    if (!ceLogsRaw.value) return [];
    return ceLogsRaw.value.map(processEventLog);
  });

  // Combined logs - use ref to track deep changes to log objects
  const allLogs = ref<ProcessedEventLog[]>([]);

  // Separate storage for data and UI state
  const dataMap = new Map<string, EventLogData>();
  const uiStateMap = new Map<string, EventLogUIState>();

  // Watch for changes and update allLogs ref while preserving UI state
  watch(
    [eventLogsData, ceLogsData],
    ([events, ceLogs]: [EventLogData[], EventLogData[]]) => {
      const newLogs: ProcessedEventLog[] = [];
      const allRawLogs = [...(events || []), ...(ceLogs || [])];
      const currentUris = new Set<string>();

      for (const rawLog of allRawLogs) {
        const uri = rawLog.uri;
        currentUris.add(uri);

        // Update or create data entry
        dataMap.set(uri, rawLog);

        // Get or create UI state (preserves existing state)
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        // Combine data and UI state into a single object
        const combinedLog: ProcessedEventLog = {
          ...rawLog,
          ...uiStateMap.get(uri)!,
        };

        newLogs.push(combinedLog);
      }

      // Clean up removed logs
      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      allLogs.value = newLogs;
    },
    { immediate: true },
  );

  // Health status computation
  const healthStatus = computed(() => {
    const logs = eventLogsData.value || [];
    if (!logs.length) return '';

    let status = 'OK';
    for (const event of logs) {
      if (event.severity === 'Critical' && !event.status) {
        status = 'Critical';
        break;
      } else if (event.severity === 'Warning' && !event.status) {
        status = 'Warning';
      }
    }
    return status;
  });

  // High priority events
  const highPriorityEvents = computed(() => {
    const logs = eventLogsData.value || [];
    return logs.filter(({ severity }) => severity === 'Critical');
  });

  // Delete all event logs mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      return await api.post(
        '/redfish/v1/Systems/system/LogServices/EventLog/Actions/LogService.ClearLog',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redfish', 'eventLogs'] });
      queryClient.invalidateQueries({ queryKey: ['redfish', 'ceLogs'] });
    },
  });

  // Delete specific event logs mutation
  const deleteEventLogsMutation = useMutation({
    mutationFn: async (uris: string[]) => {
      let guardEntries: any[] = [];
      const promises = uris.map((uri) =>
        api.delete(uri).catch((error) => {
          console.error(error);
          if (
            error.response?.data?.error?.code?.endsWith(
              'PropertyValueExternalConflict',
            )
          ) {
            guardEntries.push(error.response.data);
          }
          return error;
        }),
      );

      const responses = await api.all(promises);
      const { successCount, errorCount } = getResponseCount(responses);
      const toastMessages: Array<{ type: string; message: string }> = [];

      if (successCount) {
        const message = i18n.global.t(
          'pageEventLogs.toast.successDelete',
          successCount,
        );
        toastMessages.push({ type: 'success', message });
      }

      if (errorCount) {
        if (guardEntries.length > 0) {
          const message = i18n.global.t(
            'pageEventLogs.toast.errorDeleteGuardRecord',
            guardEntries.length,
          );
          toastMessages.push({ type: 'error', message });
        }
        const message = i18n.global.t(
          'pageEventLogs.toast.errorDelete',
          errorCount,
        );
        toastMessages.push({ type: 'error', message });
      }

      return toastMessages;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redfish', 'eventLogs'] });
      queryClient.invalidateQueries({ queryKey: ['redfish', 'ceLogs'] });
    },
  });

  // Helper function to resolve/unresolve logs using patchResource
  const patchLogStatus = async (
    logs: ProcessedEventLog[],
    resolved: boolean,
    onSuccessCallback?: (successCount: number) => void,
  ) => {
    let guardEntries: any[] = [];
    let successCount = 0;

    const promises = logs.map((log) =>
      patchResource({
        endpoint: log.uri,
        field: 'Resolved',
        value: resolved,
        invalidateQueries: [
          [
            'redfish',
            'collection',
            '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
          ],
          [
            'redfish',
            'collection',
            '/redfish/v1/Systems/system/LogServices/CELog/Entries',
          ],
        ],
        onSuccess: () => {
          successCount++;
        },
      }).catch((error) => {
        console.error(error);
        if (
          error.response?.data?.error?.code?.endsWith(
            'PropertyValueExternalConflict',
          )
        ) {
          guardEntries.push(error.response.data);
        }
        return error;
      }),
    );

    const responses = await Promise.all(promises);
    const { successCount: finalSuccessCount, errorCount } =
      getResponseCount(responses);
    const toastMessages: Array<{ type: string; message: string }> = [];

    // Call success callback once with final count after all patches complete
    if (finalSuccessCount > 0 && onSuccessCallback) {
      onSuccessCallback(finalSuccessCount);
    }

    if (errorCount) {
      if (guardEntries.length > 0) {
        const message = i18n.global.t(
          'pageEventLogs.toast.errorResolveLogsGuardRecord',
          guardEntries.length,
        );
        toastMessages.push({ type: 'error', message });
      }
      const messageKey = resolved
        ? 'pageEventLogs.toast.errorResolveLogs'
        : 'pageEventLogs.toast.errorUnresolveLogs';
      const message = i18n.global.t(messageKey, errorCount);
      toastMessages.push({ type: 'error', message });
    }

    return toastMessages;
  };

  // Resolve event logs mutation
  const resolveEventLogsMutation = useMutation({
    mutationFn: async ({
      logs,
      onSuccessCallback,
    }: {
      logs: ProcessedEventLog[];
      onSuccessCallback?: (count: number) => void;
    }) => {
      return await patchLogStatus(logs, true, onSuccessCallback);
    },
  });

  // Unresolve event logs mutation
  const unresolveEventLogsMutation = useMutation({
    mutationFn: async ({
      logs,
      onSuccessCallback,
    }: {
      logs: ProcessedEventLog[];
      onSuccessCallback?: (count: number) => void;
    }) => {
      return await patchLogStatus(logs, false, onSuccessCallback);
    },
  });

  // Update single event log status mutation
  const updateEventLogStatusMutation = useMutation({
    mutationFn: async ({
      log,
      onSuccessCallback,
    }: {
      log: ProcessedEventLog;
      onSuccessCallback?: () => void;
    }) => {
      try {
        await patchResource({
          endpoint: log.uri,
          field: 'Resolved',
          value: log.status,
          invalidateQueries: [
            [
              'redfish',
              'collection',
              '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
            ],
            [
              'redfish',
              'collection',
              '/redfish/v1/Systems/system/LogServices/CELog/Entries',
            ],
          ],
          onSuccess: () => {
            // Call the callback immediately after successful patch
            if (onSuccessCallback) {
              onSuccessCallback();
            }
          },
        });

        if (log.status) {
          return i18n.global.t('pageEventLogs.toast.successResolveLogs', 1);
        } else {
          return i18n.global.t('pageEventLogs.toast.successUnresolveLogs', 1);
        }
      } catch (error: any) {
        console.error(error);
        if (
          error.response?.data?.error?.code?.endsWith(
            'PropertyValueExternalConflict',
          )
        ) {
          const message =
            i18n.global.t('pageEventLogs.toast.errorLogStatusUpdate') +
            '\n' +
            i18n.global.t('pageEventLogs.toast.errorResolveLogsGuardRecord', 1);
          throw new Error(message);
        }
        const message = i18n.global.t(
          'pageEventLogs.toast.errorLogStatusUpdate',
        );
        throw new Error(message);
      }
    },
  });

  // Download log data
  const downloadLogData = async (uri: string) => {
    const response = await api.get(uri + `/OemPelAttachment`);
    return response?.data?.Oem?.IBM?.PelJson;
  };

  return {
    // Data
    eventLogs: eventLogsData,
    ceLogs: ceLogsData,
    allLogs,
    healthStatus,
    highPriorityEvents,

    // Loading states
    isLoading: computed(
      () => isLoadingEventLogs.value || isLoadingCELogs.value,
    ),
    isFetching: computed(
      () => isFetchingEventLogs.value || isFetchingCELogs.value,
    ),
    isLoadingEventLogs,
    isLoadingCELogs,

    // Error states
    isError: computed(() => isEventLogsError.value || isCELogsError.value),
    error: computed(() => eventLogsError.value || ceLogsError.value),

    // Mutations
    deleteAllLogs: deleteAllMutation.mutateAsync,
    deleteEventLogs: deleteEventLogsMutation.mutateAsync,
    resolveEventLogs: resolveEventLogsMutation.mutateAsync,
    unresolveEventLogs: unresolveEventLogsMutation.mutateAsync,
    updateEventLogStatus: updateEventLogStatusMutation.mutateAsync,
    downloadLogData,

    // Mutation states
    isDeleting: computed(
      () =>
        deleteAllMutation.isPending.value ||
        deleteEventLogsMutation.isPending.value,
    ),
    isResolving: resolveEventLogsMutation.isPending,
    isUnresolving: unresolveEventLogsMutation.isPending,
    isUpdatingStatus: updateEventLogStatusMutation.isPending,

    // Refetch functions
    refetchEventLogs,
    refetchCELogs,
    refetchAll: async () => {
      await refetchEventLogs();
      await refetchCELogs();
    },
  };
}
