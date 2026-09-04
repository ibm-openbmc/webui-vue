import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';

// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

// Base deconfiguration record data interface (server data only)
export interface DeconfigurationRecordData {
  id: string;
  eventID: string;
  date: Date;
  severity: string;
  description: string;
  status: boolean;
  filterByStatus: 'Resolved' | 'Unresolved';
  uri: string;
  additionalDataUri?: string;
  oemPelAttachment?: string;
  srcDetails?: string;
  location?: string;
  name?: string;
}

// UI state interface (client-side state only)
export interface DeconfigurationRecordUIState {
  toggleDetails: boolean;
  isSelected: boolean;
}

// Combined interface for the component
export interface ProcessedDeconfigurationRecord
  extends DeconfigurationRecordData,
    DeconfigurationRecordUIState {}

/**
 * Composable for fetching and managing deconfiguration records
 * Replaces the DeconfigurationRecordsStore with TanStack Query
 */
export function useDeconfigurationRecords() {
  const queryClient = useQueryClient();

  // Helper function to fetch location code for a record
  const fetchLocationCode = async (member: any): Promise<string> => {
    const arrayNumber = Number(
      member?.Links?.OriginOfCondition?.['@odata.id'].split('/').pop(),
    );
    const uri = member?.Links?.OriginOfCondition?.['@odata.id']
      .split('/SubProcessors')
      .shift();

    try {
      const { data } = await api.get(uri);
      if (data?.Location) {
        return data?.Location?.PartLocation?.ServiceLabel;
      } else {
        const tpmObject = data.Assemblies.filter((member: any) => {
          return (
            member['@odata.id'] ===
            `/redfish/v1/Chassis/chassis/Assembly#/Assemblies/${arrayNumber}`
          );
        })[0];
        return tpmObject?.Location?.PartLocation?.ServiceLabel;
      }
    } catch (error) {
      console.error('Error fetching location code:', error);
      return '';
    }
  };

  // Helper function to fetch additional data for a record
  const fetchAdditionalData = async (
    additionalDataURI?: string,
  ): Promise<any> => {
    if (!additionalDataURI) return null;

    try {
      const { data } = await api.get(
        additionalDataURI.split('/attachment').shift() || '',
      );
      return data;
    } catch (error) {
      console.error('Error fetching additional data:', error);
      return null;
    }
  };

  // Helper function to process deconfiguration records (data only, no UI state)
  const processDeconfigurationRecord = async (
    log: any,
  ): Promise<DeconfigurationRecordData> => {
    const { Id, MessageArgs, Created, Name, AdditionalDataURI } = log;

    // Fetch location code
    const locationCode = await fetchLocationCode(log);

    // Fetch additional data
    const additionalData = await fetchAdditionalData(AdditionalDataURI);

    // Extract event ID from additional data URI
    let eventId = '';
    if (AdditionalDataURI) {
      const splitUrl = AdditionalDataURI.split('/');
      eventId = splitUrl[splitUrl.length - 2];
    }

    return {
      id: Id,
      eventID: eventId,
      date: new Date(Created),
      severity: MessageArgs[0],
      description: MessageArgs[1],
      status: additionalData?.Resolved || false,
      filterByStatus: additionalData?.Resolved ? 'Resolved' : 'Unresolved',
      uri: log['@odata.id'],
      additionalDataUri: AdditionalDataURI,
      oemPelAttachment: additionalData
        ? `${additionalData['@odata.id']}/OemPelAttachment`
        : undefined,
      srcDetails: additionalData?.EventId,
      location: locationCode,
      name: Name,
    };
  };

  /**
   * Get default UI state for a new record
   */
  const getDefaultUIState = (): DeconfigurationRecordUIState => {
    return {
      toggleDetails: false,
      isSelected: false,
    };
  };

  // Fetch Deconfiguration Records using useRedfishCollection with deconfigurationRecords preset
  const {
    data: deconfigRecordsRaw,
    isLoading: isLoadingRecords,
    isFetching: isFetchingRecords,
    error: recordsError,
    isError: isRecordsError,
    refetch: refetchRecords,
  } = useRedfishCollection<any>(
    '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries',
    {
      queryConfig: RedfishQueryPresets.deconfigurationRecords,
    },
  );

  // Process the raw data - this is async and complex
  const isProcessing = ref(false);
  const deconfigRecordsData = ref<DeconfigurationRecordData[]>([]);

  // Watch for changes in raw data and process them
  watch(
    deconfigRecordsRaw,
    async (rawRecords) => {
      if (!rawRecords || rawRecords.length === 0) {
        deconfigRecordsData.value = [];
        return;
      }

      isProcessing.value = true;
      try {
        // Process all records in parallel
        const processedRecords = await Promise.all(
          rawRecords.map((record) => processDeconfigurationRecord(record)),
        );
        deconfigRecordsData.value = processedRecords;
      } catch (error) {
        console.error('Error processing deconfiguration records:', error);
        deconfigRecordsData.value = [];
      } finally {
        isProcessing.value = false;
      }
    },
    { immediate: true },
  );

  // Combined logs - use ref to track deep changes to log objects
  const allRecords = ref<ProcessedDeconfigurationRecord[]>([]);

  // Separate storage for data and UI state
  const dataMap = new Map<string, DeconfigurationRecordData>();
  const uiStateMap = new Map<string, DeconfigurationRecordUIState>();

  // Watch for changes and update allRecords ref while preserving UI state
  watch(
    deconfigRecordsData,
    (records: DeconfigurationRecordData[]) => {
      const newRecords: ProcessedDeconfigurationRecord[] = [];
      const currentUris = new Set<string>();

      for (const rawRecord of records || []) {
        const uri = rawRecord.uri;
        currentUris.add(uri);

        // Update or create data entry
        dataMap.set(uri, rawRecord);

        // Get or create UI state (preserves existing state)
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        // Combine data and UI state into a single object
        const combinedRecord: ProcessedDeconfigurationRecord = {
          ...rawRecord,
          ...uiStateMap.get(uri)!,
        };

        newRecords.push(combinedRecord);
      }

      // Clean up removed records
      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      allRecords.value = newRecords;
    },
    { immediate: true },
  );

  // Clear all records mutation
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      return await api.post(
        '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Actions/LogService.ClearLog',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'collection',
          '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries',
        ],
      });
    },
  });

  // Delete specific records mutation
  const deleteRecordsMutation = useMutation({
    mutationFn: async (uris: string[]) => {
      const promises = uris.map((uri) => api.delete(uri));
      await api.all(promises);
      return i18n.global.t(
        'pageDeconfigurationRecords.toast.successDelete',
        uris.length,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'collection',
          '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries',
        ],
      });
    },
    onError: (error: any, uris: string[]) => {
      console.error(error);
      throw new Error(
        i18n.global.t(
          'pageDeconfigurationRecords.toast.errorDelete',
          uris.length,
        ),
      );
    },
  });

  // Download log data
  const downloadLog = async (uri: string, date: Date) => {
    try {
      const { data } = await api.get(uri);
      const pelJsonInfo = data?.Oem?.IBM?.PelJson;

      const dateObj = new Date();
      const dateStr =
        dateObj.toISOString().slice(0, 10) +
        '_' +
        dateObj.toString().split(':').join('-').split(' ')[4];

      const fileName = `attachment_${dateStr}`;

      const element = document.createElement('a');
      element.setAttribute(
        'href',
        `data:text/plain;charset=utf-8,${encodeURIComponent(pelJsonInfo)}`,
      );
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      return [
        i18n.global.t('pageDeconfigurationRecords.toast.successStartDownload'),
        {
          title: i18n.global.t(
            'pageDeconfigurationRecords.toast.successStartDownloadTitle',
          ),
        },
      ];
    } catch (error) {
      console.error(error);
      throw new Error(
        i18n.global.t('pageDeconfigurationRecords.toast.errorStartDownload'),
      );
    }
  };

  return {
    // Data
    deconfigRecords: deconfigRecordsData,
    allRecords,

    // Loading states
    isLoading: computed(() => isLoadingRecords.value || isProcessing.value),
    isFetching: computed(() => isFetchingRecords.value || isProcessing.value),
    isProcessing,

    // Error states
    isError: isRecordsError,
    error: recordsError,

    // Mutations
    clearAllRecords: clearAllMutation.mutateAsync,
    deleteRecords: deleteRecordsMutation.mutateAsync,
    downloadLog,

    // Mutation states
    isDeleting: computed(
      () =>
        clearAllMutation.isPending.value ||
        deleteRecordsMutation.isPending.value,
    ),

    // Refetch functions
    refetchRecords,
  };
}
