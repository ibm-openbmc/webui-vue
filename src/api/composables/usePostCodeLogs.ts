import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

// Base post code log data interface (server data only)
export interface PostCodeLogData {
  date: Date;
  bootCount: string;
  timeStampOffset: string;
  postCode: string;
  uri: string;
}

// UI state interface (client-side state only)
export interface PostCodeLogUIState {
  toggleDetails: boolean;
  rowSelected: boolean;
}

// Combined interface for the component
export interface ProcessedPostCodeLog
  extends PostCodeLogData,
    PostCodeLogUIState {}

/**
 * Composable for fetching and managing post code logs
 * Replaces the PostCodeLogsStore with TanStack Query
 */
export function usePostCodeLogs() {
  const queryClient = useQueryClient();

  // Helper function to process post code logs (data only, no UI state)
  const processPostCodeLog = (log: any): PostCodeLogData => {
    const { Created, MessageArgs, AdditionalDataURI } = log;

    // Convert hex string to ASCII
    let asciiString = '';
    let hexString = MessageArgs[2];
    for (let i = 0; i < hexString.length; i += 2) {
      const hexPair = hexString.substring(i, i + 2);
      const decimalValue = parseInt(hexPair, 16);
      asciiString += String.fromCharCode(decimalValue);
    }

    return {
      date: new Date(Created),
      bootCount: MessageArgs[0],
      timeStampOffset: MessageArgs[1],
      postCode: asciiString,
      uri: AdditionalDataURI,
    };
  };

  /**
   * Get default UI state for a new log entry
   */
  const getDefaultUIState = (): PostCodeLogUIState => {
    return {
      toggleDetails: false,
      rowSelected: false,
    };
  };

  // Fetch Post Code Logs using useRedfishCollection with realtime preset
  const {
    data: postCodeLogsRaw,
    isLoading: isLoadingPostCodeLogs,
    isFetching: isFetchingPostCodeLogs,
    error: postCodeLogsError,
    isError: isPostCodeLogsError,
    refetch: refetchPostCodeLogs,
  } = useRedfishCollection<any>(
    '/redfish/v1/Systems/system/LogServices/PostCodes/Entries',
    {
      queryConfig: RedfishQueryPresets.progressLogs,
    },
  );

  // Process the raw data into ProcessedPostCodeLog format
  const postCodeLogsData = computed(() => {
    if (!postCodeLogsRaw.value) return [];

    // Filter out logs with postCode '0x3030303030303030'
    const filteredLogs = postCodeLogsRaw.value.filter(
      (log) => log.MessageArgs[2] !== '0x3030303030303030',
    );

    return filteredLogs.map(processPostCodeLog);
  });

  // Combined logs - use ref to track deep changes to log objects
  const allLogs = ref<ProcessedPostCodeLog[]>([]);

  // Separate storage for data and UI state
  const dataMap = new Map<string, PostCodeLogData>();
  const uiStateMap = new Map<string, PostCodeLogUIState>();

  // Watch for changes and update allLogs ref while preserving UI state
  watch(
    postCodeLogsData,
    (logs: PostCodeLogData[]) => {
      const newLogs: ProcessedPostCodeLog[] = [];
      const currentUris = new Set<string>();

      for (const rawLog of logs || []) {
        const uri = rawLog.uri;
        currentUris.add(uri);

        // Update or create data entry
        dataMap.set(uri, rawLog);

        // Get or create UI state (preserves existing state)
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        // Combine data and UI state into a single object
        const combinedLog: ProcessedPostCodeLog = {
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

  // Fetch SRC details for a specific log
  const fetchSrcDetails = async (uri: string, postCode: string) => {
    try {
      const response = await api.get(uri);
      const srcWords = generateSrcWords(response.data);
      return `${postCode.trim()} ${srcWords}`;
    } catch (error) {
      console.error('Error fetching SRC details:', error);
      throw new Error(i18n.global.t('pagePostCodeLogs.toast.errorSrcFetch'));
    }
  };

  // Generate SRC words from base64 encoded data
  const generateSrcWords = (data: string): string => {
    const decodedData = atob(data); // `atob` decodes base64 to ASCII string
    const hexData = Array.from(decodedData)
      .map((c) => c.charCodeAt(0).toString(16))
      .join('');
    const srcBulk = hexData.substring(16, 80).toUpperCase();

    if (!isNaN(Number(srcBulk)) && !Number(srcBulk)) {
      return '';
    }

    let srcWords = '';
    for (let i = 0; i <= 56; i += 8) {
      srcWords += `${srcBulk.substring(i, i + 8)} `;
    }
    return srcWords.trim();
  };

  return {
    // Data
    postCodeLogs: postCodeLogsData,
    allLogs,

    // Loading states
    isLoading: isLoadingPostCodeLogs,
    isFetching: isFetchingPostCodeLogs,

    // Error states
    isError: isPostCodeLogsError,
    error: postCodeLogsError,

    // Methods
    fetchSrcDetails,

    // Refetch functions
    refetchPostCodeLogs,
  };
}
