import { computed } from 'vue';
import { useAllSubResources } from './useAllSubResources';
import type { Sensor } from '@/types/redfish';

export interface SensorData {
  /** Redfish unique identifier — preserved for deduplication and future deep-links */
  odataId: string;
  isSelected: boolean;
  name: string;
  status: string;
  currentValue: number | undefined;
  units: string | undefined;
}

/**
 * Composable for fetching all sensors from all chassis
 * Replaces the SensorsStore with TanStack Query
 */
export function useSensors() {
  const {
    data: sensorsData,
    isLoading,
    error,
    isError,
    refetch,
  } = useAllSubResources<Sensor>('/redfish/v1/Chassis', 'Sensors');

  const sensors = computed<SensorData[]>(() => {
    if (!sensorsData.value) {
      return [];
    }

    return sensorsData.value.map((sensor) => ({
      odataId: sensor['@odata.id'],
      isSelected: false,
      name: sensor.Name || '',
      status: sensor.Status?.Health || 'Unknown',
      currentValue: sensor.Reading,
      units: sensor.ReadingUnits,
    }));
  });

  return {
    sensors,
    isLoading,
    error,
    isError,
    refetch,
  };
}
