import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Chassis } from '@/types/redfish';

const COLLECTION_PATH = '/redfish/v1/Chassis';
const QUERY_KEY = ['redfish', 'collection', COLLECTION_PATH];

// Base chassis inventory data interface (server data only)
export interface ChassisInventoryData {
  id: string;
  health: string | undefined;
  statusState: string | undefined;
  name: string;
  identifyLed: boolean | undefined;
  uri: string;
  locationNumber: string | undefined;
  firmwareVersion: string | undefined;
}

// UI state interface (client-side state only)
export interface ChassisInventoryUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedChassisInventory
  extends ChassisInventoryData,
    ChassisInventoryUIState {}

interface RawChassis extends Chassis {
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  Version?: string;
}

function processChassisInventory(item: RawChassis): ChassisInventoryData {
  const {
    Id,
    Status = {},
    LocationIndicatorActive,
    Name,
    Location,
    Version,
  } = item as any;
  return {
    id: Id,
    health: Status.Health,
    statusState: Status.State,
    name: Name,
    identifyLed: LocationIndicatorActive,
    uri: item['@odata.id'],
    locationNumber: Location?.PartLocation?.ServiceLabel,
    firmwareVersion: Version,
  };
}

function getDefaultUIState(): ChassisInventoryUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching Chassis inventory data with TanStack Query.
 * Used by InventoryTableChassis. Follows the same pattern as useAuditLogs —
 * useRedfishCollection handles OData $expand, batching and caching; a watch
 * converts raw data to the processed shape while preserving UI state.
 */
export function useChassisInventory() {
  const queryClient = useQueryClient();

  const {
    data: chassisRaw,
    isLoading,
    refetch,
  } = useRedfishCollection<RawChassis>(COLLECTION_PATH, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const chassis = ref<ProcessedChassisInventory[]>([]);
  const dataMap = new Map<string, ChassisInventoryData>();
  const uiStateMap = new Map<string, ChassisInventoryUIState>();

  watch(
    chassisRaw,
    (rawItems) => {
      if (!rawItems) {
        chassis.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newChassis: ProcessedChassisInventory[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processChassisInventory(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newChassis.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      chassis.value = newChassis;
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

  return { chassis, isLoading, refetch, updateIdentifyLed };
}
