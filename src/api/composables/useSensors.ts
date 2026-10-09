import { computed } from 'vue';
import { useQueries } from '@tanstack/vue-query';
import {
  useRedfishCollection,
  fetchRedfishCollection,
} from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { UseQueryOptions } from '@tanstack/vue-query';
import type { Sensor, Chassis } from '@/types/redfish';

export interface SensorData {
  /** Redfish unique identifier — preserved for deduplication and future deep-links */
  odataId: string;
  isSelected: boolean;
  name: string;
  status: string;
  currentValue: number | undefined;
  units: string | undefined;
}

export interface ChassisSensorGroup {
  /** Chassis Id (e.g. "chassis0") */
  chassisId: string;
  /** Human-readable chassis name */
  chassisName: string;
  sensors: SensorData[];
}

function mapSensor(sensor: Sensor): SensorData {
  return {
    odataId: sensor['@odata.id'],
    isSelected: false,
    name: sensor.Name || '',
    status: sensor.Status?.Health || 'Unknown',
    currentValue: sensor.Reading,
    units: sensor.ReadingUnits,
  };
}

/**
 * Composable for fetching all sensors from all chassis, grouped by chassis.
 *
 * Returns:
 *  - `sensors`          — flat list (backward-compatible, all chassis combined)
 *  - `sensorsByChassis` — array of { chassisId, chassisName, sensors[] }
 *    one entry per chassis that has a Sensors sub-resource.
 */
export function useSensors() {
  // Fetch the chassis collection (members fully expanded where possible)
  const chassisQuery = useRedfishCollection<Chassis>('/redfish/v1/Chassis', {
    queryConfig: RedfishQueryPresets.sensors as Partial<UseQueryOptions<any>>,
  });

  // Derived: list of { chassisId, chassisName, sensorsPath }
  const chassisSensorPaths = computed<
    { chassisId: string; chassisName: string; sensorsPath: string }[]
  >(() => {
    if (!chassisQuery.data.value) return [];
    return chassisQuery.data.value
      .filter((c: Chassis) => c?.Sensors?.['@odata.id'])
      .map((c: Chassis) => ({
        chassisId: c.Id as string,
        chassisName: c.Name as string,
        sensorsPath: c.Sensors!['@odata.id'] as string,
      }));
  });

  const isSubQueryEnabled = computed(
    () => !chassisQuery.isLoading.value && chassisSensorPaths.value.length > 0,
  );

  // One query per chassis — runs in parallel.
  // fetchRedfishCollection handles the $expand → batch fallback so the logic
  // isn't duplicated here.
  const perChassisQueries = useQueries({
    queries: computed(() =>
      chassisSensorPaths.value.map(
        ({ chassisId, chassisName, sensorsPath }) => ({
          queryKey: ['redfish', 'sensors', sensorsPath],
          queryFn: async (): Promise<ChassisSensorGroup> => {
            const members = await fetchRedfishCollection<Sensor>(sensorsPath);

            // Deduplicate by @odata.id and sort for stable ordering
            const seen = new Set<string>();
            const deduped = members
              .filter((s) => {
                const id = s['@odata.id'];
                if (id && seen.has(id)) return false;
                if (id) seen.add(id);
                return true;
              })
              .sort((a, b) =>
                (a['@odata.id'] || '').localeCompare(b['@odata.id'] || ''),
              );

            return { chassisId, chassisName, sensors: deduped.map(mapSensor) };
          },
          enabled: isSubQueryEnabled.value,
          ...(RedfishQueryPresets.sensors as Partial<UseQueryOptions<any>>),
        }),
      ),
    ),
  });

  // Flat list of all sensors (all chassis combined) — backward-compatible
  const sensors = computed<SensorData[]>(() =>
    perChassisQueries.value.flatMap((q) => q.data?.sensors ?? []),
  );

  // Per-chassis grouping — only include chassis whose query has resolved
  const sensorsByChassis = computed<ChassisSensorGroup[]>(() =>
    perChassisQueries.value
      .map((q) => q.data)
      .filter((g): g is ChassisSensorGroup => g != null),
  );

  const refetch = async () => {
    await chassisQuery.refetch();
    await Promise.all(perChassisQueries.value.map((q) => q.refetch()));
  };

  return {
    sensors,
    sensorsByChassis,
    isLoading: computed(
      () =>
        chassisQuery.isLoading.value ||
        perChassisQueries.value.some((q) => q.isLoading),
    ),
    isFetching: computed(
      () =>
        chassisQuery.isFetching.value ||
        perChassisQueries.value.some((q) => q.isFetching),
    ),
    error: computed(
      () =>
        chassisQuery.error.value ??
        perChassisQueries.value.find((q) => q.error)?.error ??
        null,
    ),
    isError: computed(
      () =>
        !!chassisQuery.error.value ||
        perChassisQueries.value.some((q) => q.isError),
    ),
    refetch,
  };
}
