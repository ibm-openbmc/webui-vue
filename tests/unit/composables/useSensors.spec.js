import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';

// Mock TanStack Query and useRedfishCollection so we don't need a live server
vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('@/api/composables/useRedfishCollection', () => ({
  useRedfishCollection: vi.fn(),
}));

vi.mock('@/api/composables/shared/useBatchedRequests', () => ({
  batchFetch: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: { get: vi.fn() },
}));

import { useRedfishCollection } from '@/api/composables/useRedfishCollection';
import { useSensors } from '@/api/composables/useSensors';

const makeMockChassisQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockSensorsQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

describe('useSensors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useRedfishCollection.mockReturnValue(makeMockChassisQuery());
    useQuery.mockReturnValue(makeMockSensorsQuery());
  });

  it('returns empty sensors array when query data is null', () => {
    useQuery.mockReturnValue(makeMockSensorsQuery({ data: ref(null) }));
    const { sensors } = useSensors();
    expect(sensors.value).toEqual([]);
  });

  it('returns empty sensorsByChassis array when query data is null', () => {
    useQuery.mockReturnValue(makeMockSensorsQuery({ data: ref(null) }));
    const { sensorsByChassis } = useSensors();
    expect(sensorsByChassis.value).toEqual([]);
  });

  it('flattens per-chassis groups into the sensors flat list', () => {
    const groups = [
      {
        chassisId: 'chassis0',
        chassisName: 'Chassis 0',
        sensors: [
          {
            odataId: '/redfish/v1/Chassis/chassis0/Sensors/Temp1',
            isSelected: false,
            name: 'CPU Temp',
            status: 'OK',
            currentValue: 55.5,
            units: 'Cel',
          },
        ],
      },
      {
        chassisId: 'chassis1',
        chassisName: 'Chassis 1',
        sensors: [
          {
            odataId: '/redfish/v1/Chassis/chassis1/Sensors/Fan1',
            isSelected: false,
            name: 'Fan Speed',
            status: 'Warning',
            currentValue: 2800,
            units: 'RPM',
          },
        ],
      },
    ];
    useQuery.mockReturnValue(makeMockSensorsQuery({ data: ref(groups) }));

    const { sensors } = useSensors();

    expect(sensors.value).toHaveLength(2);
    expect(sensors.value[0].name).toBe('CPU Temp');
    expect(sensors.value[1].name).toBe('Fan Speed');
  });

  it('exposes sensorsByChassis with one entry per chassis', () => {
    const groups = [
      {
        chassisId: 'chassis0',
        chassisName: 'Chassis 0',
        sensors: [],
      },
    ];
    useQuery.mockReturnValue(makeMockSensorsQuery({ data: ref(groups) }));

    const { sensorsByChassis } = useSensors();

    expect(sensorsByChassis.value).toHaveLength(1);
    expect(sensorsByChassis.value[0].chassisId).toBe('chassis0');
  });

  it('exposes isLoading as combined chassis + sensors loading', () => {
    useRedfishCollection.mockReturnValue(
      makeMockChassisQuery({ isLoading: ref(true) }),
    );
    useQuery.mockReturnValue(makeMockSensorsQuery({ isLoading: ref(false) }));

    const { isLoading } = useSensors();
    expect(isLoading.value).toBe(true);
  });

  it('exposes isFetching as combined chassis + sensors fetching', () => {
    useRedfishCollection.mockReturnValue(
      makeMockChassisQuery({ isFetching: ref(false) }),
    );
    useQuery.mockReturnValue(makeMockSensorsQuery({ isFetching: ref(true) }));

    const { isFetching } = useSensors();
    expect(isFetching.value).toBe(true);
  });

  it('exposes isError from sensors query', () => {
    useQuery.mockReturnValue(makeMockSensorsQuery({ isError: ref(true) }));

    const { isError } = useSensors();
    expect(isError.value).toBe(true);
  });

  it('exposes a refetch function', () => {
    const { refetch } = useSensors();
    expect(typeof refetch).toBe('function');
  });
});
