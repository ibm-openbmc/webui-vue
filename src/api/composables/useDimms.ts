import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

const COLLECTION_PATH = '/redfish/v1/Systems/system/Memory';
const QUERY_KEY = ['redfish', 'collection', COLLECTION_PATH];

// Base DIMM data interface (server data only)
export interface DimmData {
  id: string;
  health: string | undefined;
  capacityMiB: number | undefined;
  enabled: boolean | undefined;
  name: string;
  partNumber: string | undefined;
  serialNumber: string | undefined;
  status: string | undefined;
  sparePartNumber: string | undefined;
  model: string | undefined;
  identifyLed: boolean | undefined;
  uri: string;
  locationNumber: string | undefined;
}

// UI state interface (client-side state only)
export interface DimmUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedDimm extends DimmData, DimmUIState {}

interface RawMemory extends Resource {
  Status?: { Health?: string; State?: string };
  CapacityMiB?: number;
  Enabled?: boolean;
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
  Model?: string;
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
}

function processMemory(item: RawMemory): DimmData {
  const {
    Id,
    Status = {},
    CapacityMiB,
    Enabled,
    Name,
    PartNumber,
    SerialNumber,
    SparePartNumber,
    Model,
    LocationIndicatorActive,
    Location,
  } = item;
  return {
    id: Id,
    health: Status.Health,
    capacityMiB: CapacityMiB,
    enabled: Enabled,
    name: Name,
    partNumber: PartNumber,
    serialNumber: SerialNumber,
    status: Status.State === 'Enabled' ? 'Present' : Status.State,
    sparePartNumber: SparePartNumber,
    model: Model,
    identifyLed: LocationIndicatorActive,
    uri: item['@odata.id'],
    locationNumber: Location?.PartLocation?.ServiceLabel,
  };
}

function getDefaultUIState(): DimmUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching DIMM memory slots with TanStack Query.
 * Follows the same pattern as useAuditLogs — useRedfishCollection handles
 * OData $expand, batching and caching; a watch converts raw data to the
 * processed shape while preserving UI state.
 */
export function useDimms() {
  const queryClient = useQueryClient();

  const {
    data: dimmsRaw,
    isLoading,
    refetch,
  } = useRedfishCollection<RawMemory>(COLLECTION_PATH, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const dimms = ref<ProcessedDimm[]>([]);
  const dataMap = new Map<string, DimmData>();
  const uiStateMap = new Map<string, DimmUIState>();

  watch(
    dimmsRaw,
    (rawItems) => {
      if (!rawItems) {
        dimms.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newDimms: ProcessedDimm[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processMemory(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newDimms.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      dimms.value = newDimms;
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

  return { dimms, isLoading, refetch, updateIdentifyLed };
}
