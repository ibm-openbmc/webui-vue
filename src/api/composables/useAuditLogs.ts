import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { AuditLog } from '@/types/redfish';
import api from '@/store/api';

// Base audit log data interface (server data only)
export interface AuditLogData {
  auditId: string;
  operation: string;
  message: string;
  account: string;
  date: Date;
  addr: string;
  res: string;
  uri: string;
  additionalDataUri?: string;
}

// UI state interface (client-side state only)
export interface AuditLogUIState {
  toggleDetails: boolean;
  // Add more UI-specific properties here as needed
  // e.g., isSelected, isHighlighted, etc.
}

// Combined interface for the component
export interface ProcessedAuditLog extends AuditLogData, AuditLogUIState {}

/**
 * Process raw audit log data into a more usable format (data only, no UI state)
 */
function processAuditLog(log: AuditLog): AuditLogData {
  const { EventTimestamp, Id, Message, MessageArgs = [], Oem } = log;
  const [, operation, account, , , address, , result] = MessageArgs;

  return {
    auditId: Id,
    operation: operation || '--',
    message: Message || '--',
    account: account || '--',
    date: new Date(EventTimestamp),
    addr: address ? address.split('::ffff:').pop() || '--' : '--',
    res: result || '--',
    uri: log['@odata.id'] || '',
    additionalDataUri: Oem?.IBM?.AdditionalDataFullAuditLogURI,
  };
}

/**
 * Get default UI state for a new log entry
 */
function getDefaultUIState(): AuditLogUIState {
  return {
    toggleDetails: false,
    // Add defaults for other UI properties here
  };
}

/**
 * Composable for managing audit logs with TanStack Query
 */
export function useAuditLogs() {
  // Fetch audit logs using the dedicated auditLogs preset (30 s stale,
  // 2 min gc, background poll every 30 s)
  const {
    data: auditLogsRaw,
    isLoading,
    isFetching,
    refetch,
  } = useRedfishCollection<AuditLog>(
    '/redfish/v1/Systems/system/LogServices/AuditLog/Entries',
    {
      queryConfig: RedfishQueryPresets.auditLogs,
    },
  );

  // Use ref to track deep changes to log objects (including toggleDetails)
  const auditLogs = ref<ProcessedAuditLog[]>([]);

  // Separate storage for data and UI state
  const dataMap = new Map<string, AuditLogData>();
  const uiStateMap = new Map<string, AuditLogUIState>();

  // Watch for changes and update auditLogs ref while preserving UI state
  watch(
    auditLogsRaw,
    (rawLogs) => {
      if (!rawLogs) {
        auditLogs.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newLogs: ProcessedAuditLog[] = [];
      const currentUris = new Set<string>();

      for (const rawLog of rawLogs) {
        const processedData = processAuditLog(rawLog);
        const uri = processedData.uri;
        currentUris.add(uri);

        // Update or create data entry
        dataMap.set(uri, processedData);

        // Get or create UI state (preserves existing state)
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        // Combine data and UI state into a single object
        const combinedLog: ProcessedAuditLog = {
          ...processedData,
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

      auditLogs.value = newLogs;
    },
    { immediate: true },
  );

  // Download audit log data mutation
  const downloadAuditLogMutation = useMutation({
    mutationFn: async (uri: string) => {
      const response = await api.get(uri);
      return response.data;
    },
    onError: (error) => {
      console.error('Error downloading audit log:', error);
      throw error;
    },
  });

  /**
   * Download audit log data from the specified URI
   */
  const downloadAuditLog = async (uri: string) => {
    return downloadAuditLogMutation.mutateAsync(uri);
  };

  return {
    // Data
    auditLogs,
    isLoading,
    isFetching,

    // Actions
    refetch,
    downloadAuditLog,

    // Mutation states
    isDownloading: computed(() => downloadAuditLogMutation.isPending.value),
  };
}
