import { ref, watch, computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Chassis } from '@/types/redfish';

const CHASSIS_PATH = '/redfish/v1/Chassis';
const QUERY_KEY = ['redfish', 'inventory', 'assemblies'];

// Base assembly item data interface (server data only)
export interface AssemblyItemData {
  id: string;
  health: string | undefined;
  partNumber: string | undefined;
  serialNumber: string | undefined;
  sparePartNumber: string | undefined;
  model: string | undefined;
  name: string;
  locationNumber: string | undefined;
  identifyLed: boolean | undefined;
  status: string | undefined;
  uri: string;
}

// UI state interface (client-side state only)
export interface AssemblyItemUIState {
  toggleDetails: boolean;
}

// Combined interface for the component
export interface ProcessedAssemblyItem
  extends AssemblyItemData,
    AssemblyItemUIState {}

interface RawAssemblyItem {
  MemberId?: string;
  Status?: { Health?: string; State?: string };
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
  Model?: string;
  Name?: string;
  Location?: { PartLocation?: { ServiceLabel?: string } };
  LocationIndicatorActive?: boolean;
  '@odata.id'?: string;
}

function processAssembly(item: RawAssemblyItem): AssemblyItemData {
  return {
    id: item.MemberId ?? '',
    health: item.Status?.Health,
    partNumber: item.PartNumber,
    serialNumber: item.SerialNumber,
    sparePartNumber: item.SparePartNumber,
    model: item.Model,
    name: item.Name ?? '',
    locationNumber: item.Location?.PartLocation?.ServiceLabel,
    identifyLed: item.LocationIndicatorActive,
    status: item.Status?.State === 'Enabled' ? 'Present' : item.Status?.State,
    uri: item['@odata.id'] ?? '',
  };
}

function getDefaultUIState(): AssemblyItemUIState {
  return { toggleDetails: false };
}

/**
 * Composable for fetching Assembly data with TanStack Query.
 *
 * Assembly is NOT a sub-collection — it is a single resource at
 * `{chassisUri}/Assembly` whose `Assemblies` array holds the items.
 * This matches exactly what the original AssemblyStore.getAssemblyInfo() did:
 *   api.get(`${chassis}/Assembly`).then(({ data }) => data.Assemblies)
 *
 * Follows the same pattern as useAuditLogs — a watch converts raw data to the
 * processed shape while preserving UI state.
 */
export function useAssembly() {
  const queryClient = useQueryClient();

  // Step 1: get the list of Chassis URIs
  const { data: chassisRaw, isLoading: chassisLoading } =
    useRedfishCollection<Chassis>(CHASSIS_PATH, {
      queryConfig: RedfishQueryPresets.inventory,
    });

  const chassisUris = computed(
    () => chassisRaw.value?.map((c: Chassis) => c['@odata.id']) ?? [],
  );

  const isSubQueryEnabled = computed(
    () => !chassisLoading.value && chassisUris.value.length > 0,
  );

  // Step 2: for each chassis fetch {uri}/Assembly and collect data.Assemblies
  const assemblyQuery = useQuery({
    queryKey: [...QUERY_KEY, chassisUris],
    queryFn: async (): Promise<AssemblyItemData[]> => {
      const uris = chassisUris.value;
      if (uris.length === 0) return [];

      const responses = await Promise.all(
        uris.map((uri: string) =>
          api
            .get(`${uri}/Assembly`)
            .then((r: any) => r.data?.Assemblies ?? [])
            .catch(() => []),
        ),
      );

      return (responses as RawAssemblyItem[][]).flat().map(processAssembly);
    },
    enabled: isSubQueryEnabled,
    ...RedfishQueryPresets.inventory,
  });

  const assemblies = ref<ProcessedAssemblyItem[]>([]);
  const dataMap = new Map<string, AssemblyItemData>();
  const uiStateMap = new Map<string, AssemblyItemUIState>();

  watch(
    assemblyQuery.data,
    (rawItems) => {
      if (!rawItems) {
        assemblies.value = [];
        dataMap.clear();
        uiStateMap.clear();
        return;
      }

      const newAssemblies: ProcessedAssemblyItem[] = [];
      const currentIds = new Set<string>();

      for (const item of rawItems) {
        // Assembly items use MemberId as the stable key (not @odata.id)
        const key = item.id || item.uri;
        currentIds.add(key);

        dataMap.set(key, item);
        if (!uiStateMap.has(key)) {
          uiStateMap.set(key, getDefaultUIState());
        }

        newAssemblies.push({ ...item, ...uiStateMap.get(key)! });
      }

      for (const [key] of dataMap.entries()) {
        if (!currentIds.has(key)) {
          dataMap.delete(key);
          uiStateMap.delete(key);
        }
      }

      assemblies.value = newAssemblies;
    },
    { immediate: true },
  );

  const updateIdentifyLedMutation = useMutation({
    mutationFn: async ({
      uri,
      memberId,
      identifyLed,
    }: {
      uri: string;
      memberId: string;
      identifyLed: boolean;
    }) => {
      await api.patch(uri, {
        Assemblies: [
          { MemberId: memberId, LocationIndicatorActive: identifyLed },
        ],
      });
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
    memberId: string,
    identifyLed: boolean,
  ): Promise<string> => {
    try {
      return await updateIdentifyLedMutation.mutateAsync({
        uri,
        memberId,
        identifyLed,
      });
    } catch {
      throw new Error(
        identifyLed
          ? i18n.global.t('pageInventory.toast.errorEnableIdentifyLed')
          : i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
      );
    }
  };

  return {
    assemblies,
    isLoading: computed(
      () => chassisLoading.value || assemblyQuery.isLoading.value,
    ),
    refetch: assemblyQuery.refetch,
    updateIdentifyLed,
  };
}
