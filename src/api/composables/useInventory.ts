import { ref, watch } from 'vue';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Chassis } from '@/types/redfish';

// Base chassis data interface (server data only)
export interface ChassisItemData {
  id: string;
  health: string | undefined;
  statusState: string | undefined;
  name: string;
  identifyLed: boolean | undefined;
  uri: string;
  locationNumber: string | undefined;
  firmwareVersion: string | undefined;
}

/**
 * Process raw Chassis resource into a flat, UI-ready data object
 */
function processChassis(item: Chassis): ChassisItemData {
  const {
    Id,
    Status = {},
    LocationIndicatorActive,
    Name,
    Location,
    Version,
  } = item as Chassis & {
    LocationIndicatorActive?: boolean;
    Location?: { PartLocation?: { ServiceLabel?: string } };
    Version?: string;
  };

  return {
    id: Id,
    health: Status.Health,
    statusState: Status.State,
    name: Name,
    identifyLed: LocationIndicatorActive,
    uri: item['@odata.id'],
    locationNumber: (Location as any)?.PartLocation?.ServiceLabel,
    firmwareVersion: Version,
  };
}

/**
 * Composable for fetching the /redfish/v1/Chassis collection with TanStack Query.
 * Follows the same pattern as useAuditLogs — useRedfishCollection handles
 * OData $expand, batching and caching; a watch converts raw data to the
 * processed shape while preserving reactivity.
 */
export function useInventory() {
  const {
    data: chassisRaw,
    isLoading,
    refetch,
  } = useRedfishCollection<Chassis>('/redfish/v1/Chassis', {
    queryConfig: RedfishQueryPresets.inventory,
  });

  const chassis = ref<ChassisItemData[]>([]);

  watch(
    chassisRaw,
    (rawItems) => {
      if (!rawItems) {
        chassis.value = [];
        return;
      }
      chassis.value = rawItems.map(processChassis);
    },
    { immediate: true },
  );

  return {
    chassis,
    isLoading,
    refetch,
  };
}
