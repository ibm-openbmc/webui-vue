import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishResource } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Manager } from '@/types/redfish';

// Fetch the known BMC resource directly — the collection endpoint does not
// support $expand on all servers, causing a 400 Bad Request.
const RESOURCE_PATH = '/redfish/v1/Managers/bmc';
const QUERY_KEY = ['redfish', 'resource', RESOURCE_PATH];

// Base BMC data interface (server data only)
export interface BmcData {
  dateTime: Date | undefined;
  description: string | undefined;
  health: string | undefined;
  id: string;
  identifyLed: boolean | undefined;
  locationNumber: string | undefined;
  model: string | undefined;
  name: string;
  partNumber: string | undefined;
  powerState: string | undefined;
  serialNumber: string | undefined;
  sparePartNumber: string | undefined;
  statusState: string | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface BmcUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedBmc extends BmcData, BmcUIState {}

interface RawManager extends Manager {
  DateTime?: string;
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
}

function processBmc(item: RawManager): BmcData {
  return {
    dateTime: item.DateTime ? new Date(item.DateTime) : undefined,
    description: item.Description,
    health: item.Status?.Health,
    id: item.Id,
    identifyLed: item.LocationIndicatorActive,
    locationNumber: item.Location?.PartLocation?.ServiceLabel,
    model: item.Model,
    name: item.Name,
    partNumber: item.PartNumber,
    powerState: (item as any).PowerState,
    serialNumber: item.SerialNumber,
    sparePartNumber: item.SparePartNumber,
    statusState: item.Status?.State,
    uri: item['@odata.id'],
  };
}

/**
 * Composable for fetching BMC Manager data with TanStack Query.
 * Fetches /redfish/v1/Managers/bmc directly (single resource, no $expand).
 * Follows the same pattern as useAuditLogs — a watch converts raw data to the
 * processed shape while preserving UI state.
 */
export function useBmc() {
  const queryClient = useQueryClient();

  const {
    data: bmcRaw,
    isLoading,
    refetch,
  } = useRedfishResource<RawManager>(RESOURCE_PATH, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const bmc = ref<ProcessedBmc | null>(null);

  watch(
    bmcRaw,
    (raw) => {
      bmc.value = raw ? { ...processBmc(raw), toggleDetails: false } : null;
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

  return { bmc, isLoading, refetch, updateIdentifyLed };
}
