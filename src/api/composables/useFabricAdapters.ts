import { computed, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishCollection } from './useRedfishCollection';
import { useAllSubResources } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

const COLLECTION_PATH = '/redfish/v1/Systems/system/FabricAdapters';
const QUERY_KEY = ['redfish', 'collection', COLLECTION_PATH];

// Base fabric adapter data interface (server data only)
export interface FabricAdapterData {
  id: string;
  health: string | undefined;
  identifyLed: boolean | undefined;
  locationNumber: string | undefined;
  model: string | undefined;
  name: string;
  partNumber: string | undefined;
  serialNumber: string | undefined;
  sparePartNumber: string | undefined;
  status: string | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface FabricAdapterUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedFabricAdapter
  extends FabricAdapterData,
    FabricAdapterUIState {}

interface RawPcieSlotsContainer extends Resource {
  Slots?: Array<{ Links?: { PCIeDevice?: Array<{ '@odata.id': string }> } }>;
}

interface RawFabricAdapter extends Resource {
  Links?: { PCIeDevices?: Array<{ '@odata.id': string }> };
  Status?: { Health?: string; State?: string };
  LocationIndicatorActive?: boolean;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  Model?: string;
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
}

function processFabricAdapter(item: RawFabricAdapter): FabricAdapterData {
  const {
    Id,
    Status,
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
    health: Status?.Health,
    identifyLed: LocationIndicatorActive,
    locationNumber: Location?.PartLocation?.ServiceLabel,
    model: Model,
    name: Name,
    partNumber: PartNumber,
    serialNumber: SerialNumber,
    sparePartNumber: SparePartNumber,
    status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
    uri: item['@odata.id'],
  };
}

function getDefaultUIState(): FabricAdapterUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching the Fabric Adapters that belong to a single chassis.
 * The chassis URI may be a ref/getter so the data follows the selected
 * inventory tab.
 *
 * Fabric adapters live under the system, so they are assigned to a chassis by
 * matching the adapter's PCIe device against the chassis' PCIeSlots. Adapters
 * with no PCIe device link ("motherboard") belong to the system chassis
 * (URI ending in `/chassis`).
 */
export function useFabricAdapters(chassisUri: MaybeRefOrGetter<string>) {
  const queryClient = useQueryClient();
  const chassisPath = computed(() => toValue(chassisUri));

  const {
    data: allFabricAdaptersRaw,
    isLoading: adaptersLoading,
    refetch,
  } = useRedfishCollection<RawFabricAdapter>(COLLECTION_PATH, {
    queryConfig: RedfishQueryPresets.inventory,
  });

  // PCIeSlots of the selected chassis only (same lookup as the PCIe slots table)
  const { data: pcieSlotsRaw, isLoading: slotsLoading } =
    useAllSubResources<RawPcieSlotsContainer>(
      '/redfish/v1/Chassis',
      'PCIeSlots',
      {
        queryConfig: RedfishQueryPresets.inventory,
        parentUri: chassisPath,
      },
    );

  const isLoading = computed(() => adaptersLoading.value || slotsLoading.value);

  const fabricAdaptersRaw = computed(() => {
    const adapters = allFabricAdaptersRaw.value;
    if (!adapters || !chassisPath.value) return undefined;
    // Wait for the slots so the first render doesn't flash unfiltered adapters
    if (slotsLoading.value) return undefined;

    const slotDeviceUris = new Set(
      (pcieSlotsRaw.value ?? [])
        .flatMap((container) => container.Slots ?? [])
        .map((slot) => slot.Links?.PCIeDevice?.[0]?.['@odata.id'])
        .filter(Boolean),
    );
    const isSystemChassis = chassisPath.value.endsWith('chassis');

    return adapters.filter((adapter) => {
      const deviceUri = adapter.Links?.PCIeDevices?.[0]?.['@odata.id'];
      if (adapter.Links?.PCIeDevices?.length) {
        return !!deviceUri && slotDeviceUris.has(deviceUri);
      }
      return adapter['@odata.id'].includes('motherboard') && isSystemChassis;
    });
  });

  const fabricAdapters = ref<ProcessedFabricAdapter[]>([]);
  const dataMap = new Map<string, FabricAdapterData>();
  const uiStateMap = new Map<string, FabricAdapterUIState>();

  watch(
    fabricAdaptersRaw,
    (rawItems) => {
      if (!rawItems) {
        fabricAdapters.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newFabricAdapters: ProcessedFabricAdapter[] = [];
      const currentUris = new Set<string>();

      for (const rawItem of rawItems) {
        const processedData = processFabricAdapter(rawItem);
        const uri = processedData.uri;
        currentUris.add(uri);

        dataMap.set(uri, processedData);
        if (!uiStateMap.has(uri)) {
          uiStateMap.set(uri, getDefaultUIState());
        }

        newFabricAdapters.push({ ...processedData, ...uiStateMap.get(uri)! });
      }

      for (const [uri] of dataMap.entries()) {
        if (!currentUris.has(uri)) {
          dataMap.delete(uri);
          uiStateMap.delete(uri);
        }
      }

      fabricAdapters.value = newFabricAdapters;
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

  return { fabricAdapters, isLoading, refetch, updateIdentifyLed };
}
