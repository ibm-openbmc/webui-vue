import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useAllSubResources } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

const PARENT_PATH = '/redfish/v1/Chassis';
const SUB_KEY = 'ThermalSubsystem';

// Base fan data interface (server data only)
export interface FanData {
  id: string;
  health: string | undefined;
  partNumber: string | undefined;
  serialNumber: string | undefined;
  identifyLed: boolean | undefined;
  locationNumber: string | undefined;
  model: string | undefined;
  name: string;
  sparePartNumber: string | undefined;
  status: string | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface FanUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedFan extends FanData, FanUIState {}

interface RawFan extends Resource {
  Status?: { Health?: string; State?: string };
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  Model?: string;
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
}

function processFan(item: RawFan): FanData {
  const {
    Id,
    Status = {},
    LocationIndicatorActive,
    Location,
    Model,
    Name,
    PartNumber,
    SerialNumber,
    SparePartNumber,
  } = item as any;
  return {
    id: Id,
    health: (Status as any).Health,
    partNumber: PartNumber,
    serialNumber: SerialNumber,
    identifyLed: LocationIndicatorActive,
    locationNumber: Location?.PartLocation?.ServiceLabel,
    model: Model,
    name: Name,
    sparePartNumber: SparePartNumber,
    status:
      (Status as any).State === 'Enabled' ? 'Present' : (Status as any).State,
    uri: item['@odata.id'],
  };
}

function getDefaultUIState(): FanUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching Fans via Chassis → ThermalSubsystem → Fans with TanStack Query.
 * Follows the same pattern as useAuditLogs — useAllSubResources handles multi-level
 * navigation; a watch converts raw data to the processed shape while preserving UI state.
 */
export function useFans() {
  const queryClient = useQueryClient();

  const {
    data: fansRaw,
    isLoading,
    refetch,
  } = useAllSubResources<RawFan>(PARENT_PATH, SUB_KEY, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const fans = ref<ProcessedFan[]>([]);
  const dataMap = new Map<string, FanData>();
  const uiStateMap = new Map<string, FanUIState>();

  watch(
    fansRaw,
    (rawItems) => {
      if (!rawItems) {
        fans.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newFans: ProcessedFan[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processFan(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newFans.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      fans.value = newFans;
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
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'allSubResources', PARENT_PATH, SUB_KEY],
      });
    },
    onError: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'allSubResources', PARENT_PATH, SUB_KEY],
      });
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

  return { fans, isLoading, refetch, updateIdentifyLed };
}
