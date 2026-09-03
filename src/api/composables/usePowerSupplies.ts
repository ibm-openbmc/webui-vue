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
const SUB_KEY = 'PowerSubsystem';

// Base power supply data interface (server data only)
export interface PowerSupplyData {
  id: string;
  health: string | undefined;
  partNumber: string | undefined;
  serialNumber: string | undefined;
  firmwareVersion: string | undefined;
  identifyLed: boolean | undefined;
  locationNumber: string | undefined;
  model: string | undefined;
  name: string;
  sparePartNumber: string | undefined;
  status: string | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface PowerSupplyUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedPowerSupply
  extends PowerSupplyData,
    PowerSupplyUIState {}

interface RawPowerSupply extends Resource {
  Status?: { Health?: string; State?: string };
  FirmwareVersion?: string;
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  Model?: string;
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
}

function processPowerSupply(item: RawPowerSupply): PowerSupplyData {
  const {
    Id,
    Status = {},
    FirmwareVersion,
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
    firmwareVersion: FirmwareVersion,
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

function getDefaultUIState(): PowerSupplyUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching Power Supplies via Chassis → PowerSubsystem → PowerSupplies.
 * Follows the same pattern as useAuditLogs — useAllSubResources handles multi-level
 * navigation; a watch converts raw data to the processed shape while preserving UI state.
 */
export function usePowerSupplies() {
  const queryClient = useQueryClient();

  const {
    data: powerSuppliesRaw,
    isLoading,
    refetch,
  } = useAllSubResources<RawPowerSupply>(PARENT_PATH, SUB_KEY, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const powerSupplies = ref<ProcessedPowerSupply[]>([]);
  const dataMap = new Map<string, PowerSupplyData>();
  const uiStateMap = new Map<string, PowerSupplyUIState>();

  watch(
    powerSuppliesRaw,
    (rawItems) => {
      if (!rawItems) {
        powerSupplies.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newPowerSupplies: ProcessedPowerSupply[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processPowerSupply(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newPowerSupplies.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      powerSupplies.value = newPowerSupplies;
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

  return { powerSupplies, isLoading, refetch, updateIdentifyLed };
}
