import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Processor } from '@/types/redfish';

const COLLECTION_PATH = '/redfish/v1/Systems/system/Processors';
const QUERY_KEY = ['redfish', 'collection', COLLECTION_PATH];

// Base processor data interface (server data only)
export interface ProcessorData {
  id: string;
  health: string | undefined;
  partNumber: string | undefined;
  sparePartNumber: string | undefined;
  serialNumber: string | undefined;
  status: string | undefined;
  model: string | undefined;
  name: string;
  processorType: string | undefined;
  totalCores: number | undefined;
  locationNumber: string | undefined;
  identifyLed: boolean | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface ProcessorUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedProcessor extends ProcessorData, ProcessorUIState {}

interface RawProcessor extends Processor {
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
}

function processProcessor(item: RawProcessor): ProcessorData {
  const {
    Id,
    Status = {},
    PartNumber,
    SerialNumber,
    SparePartNumber,
    Model,
    Name,
    ProcessorType,
    TotalCores,
    Location,
    LocationIndicatorActive,
  } = item as any;
  return {
    id: Id,
    health: (Status as any).Health,
    partNumber: PartNumber,
    sparePartNumber: SparePartNumber,
    serialNumber: SerialNumber,
    status:
      (Status as any).State === 'Enabled' ? 'Present' : (Status as any).State,
    model: Model,
    name: Name,
    processorType: ProcessorType,
    totalCores: TotalCores,
    locationNumber: Location?.PartLocation?.ServiceLabel,
    identifyLed: LocationIndicatorActive,
    uri: item['@odata.id'],
  };
}

function getDefaultUIState(): ProcessorUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching Processors with TanStack Query.
 * Follows the same pattern as useAuditLogs — useRedfishCollection handles
 * OData $expand, batching and caching; a watch converts raw data to the
 * processed shape while preserving UI state.
 */
export function useProcessors() {
  const queryClient = useQueryClient();

  const {
    data: processorsRaw,
    isLoading,
    refetch,
  } = useRedfishCollection<RawProcessor>(COLLECTION_PATH, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const processors = ref<ProcessedProcessor[]>([]);
  const dataMap = new Map<string, ProcessorData>();
  const uiStateMap = new Map<string, ProcessorUIState>();

  watch(
    processorsRaw,
    (rawItems) => {
      if (!rawItems) {
        processors.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newProcessors: ProcessedProcessor[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processProcessor(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newProcessors.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      processors.value = newProcessors;
    },
    { immediate: true },
  );

  const updateIdentifyLedMutation = useMutation({
    mutationFn: async ({
      uri,
      identifyLed,
    }: {
      uri: string;
      identifyLed: boolean;
    }) => {
      await api.patch(uri, { LocationIndicatorActive: identifyLed });
      return identifyLed
        ? i18n.global.t('pageInventory.toast.successEnableIdentifyLed')
        : i18n.global.t('pageInventory.toast.successDisableIdentifyLed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const updateIdentifyLed = async (
    uri: string,
    identifyLed: boolean,
  ): Promise<string> => {
    try {
      return await updateIdentifyLedMutation.mutateAsync({ uri, identifyLed });
    } catch {
      throw new Error(
        identifyLed
          ? i18n.global.t('pageInventory.toast.errorEnableIdentifyLed')
          : i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
      );
    }
  };

  return { processors, isLoading, refetch, updateIdentifyLed };
}
