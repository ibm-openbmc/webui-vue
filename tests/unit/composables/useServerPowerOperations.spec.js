import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// ── Mock @tanstack/vue-query ──────────────────────────────────────────────────
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

// ── Mock i18n ─────────────────────────────────────────────────────────────────
vi.mock('@/i18n', () => ({
  default: {
    global: { t: vi.fn((key) => key) },
  },
}));

// ── Mock shared queryConfig ───────────────────────────────────────────────────
vi.mock('@/api/composables/shared/queryConfig', () => ({
  RedfishQueryPresets: {
    metadata: { staleTime: 600000, gcTime: 1800000 },
  },
}));

// ── Mock useSystemInfo (for serverStateMapper) ────────────────────────────────
vi.mock('@/api/composables/useSystemInfo', () => ({
  serverStateMapper: vi.fn((state) => {
    if (state === 'On') return 'on';
    if (state === 'Off') return 'off';
    if (state === 'Quiesced') return 'error';
    if (state === 'InTest') return 'diagnosticMode';
    return 'unreachable';
  }),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  useBootBiosAttributes,
  useServerSystemInfo,
  useServerBmcInfo,
  useLocationCodes,
} from '@/api/composables/useServerPowerOperations';

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeMockQuery = (overrides = {}) => ({
  data: ref(null),
  isFetching: ref(false),
  isLoading: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn().mockResolvedValue({}),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null),
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// useBootBiosAttributes
// ─────────────────────────────────────────────────────────────────────────────

describe('useBootBiosAttributes', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    useMutation.mockReturnValue(makeMockMutation());
    // Default: both queries return null data
    useQuery.mockReturnValue(makeMockQuery());
  });

  describe('BIOS attributes data', () => {
    it('returns null biosAttributes when query data is null', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { biosAttributes } = useBootBiosAttributes();
      expect(biosAttributes.value).toBeNull();
    });

    it('returns biosAttributes when query data is present', () => {
      const attrs = { pvm_default_os_type: 'IBM I', pvm_sys_dump_active: 'Disabled' };
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(attrs) })) // bios
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));   // registry
      const { biosAttributes } = useBootBiosAttributes();
      expect(biosAttributes.value).toEqual(attrs);
    });
  });

  describe('attributeValues derived from registry', () => {
    it('returns null when registry is not loaded', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).toBeNull();
    });

    it('derives attributeValues from registry entries', () => {
      const registry = [
        {
          AttributeName: 'pvm_default_os_type',
          CurrentValue: 'AIX',
          Value: [{ ValueName: 'AIX' }, { ValueName: 'IBM I' }],
        },
      ];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))      // bios
        .mockReturnValueOnce(makeMockQuery({ data: ref(registry) })); // registry
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).toHaveProperty('pvm_default_os_type');
      expect(attributeValues.value['pvm_default_os_type']).toHaveLength(2);
      expect(attributeValues.value['pvm_default_os_type'][0].value).toBe('AIX');
    });

    it('skips pvm_sys_dump_active from attributeValues', () => {
      const registry = [
        { AttributeName: 'pvm_sys_dump_active', Value: [{ ValueName: 'Enabled' }] },
      ];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registry) }));
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).not.toHaveProperty('pvm_sys_dump_active');
    });
  });

  describe('hmcManaged derived from registry', () => {
    it('returns null when registry has no pvm_hmc_managed entry', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      const { hmcManaged } = useBootBiosAttributes();
      expect(hmcManaged.value).toBeNull();
    });

    it('returns hmcManaged CurrentValue from registry', () => {
      const registry = [{ AttributeName: 'pvm_hmc_managed', CurrentValue: 'Enabled' }];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registry) }));
      const { hmcManaged } = useBootBiosAttributes();
      expect(hmcManaged.value).toBe('Enabled');
    });
  });

  describe('linuxKvmPercentageValue', () => {
    it('returns null when registry entry is absent', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      const { linuxKvmPercentageValue } = useBootBiosAttributes();
      expect(linuxKvmPercentageValue.value).toBeNull();
    });

    it('divides CurrentValue by 10', () => {
      const registry = [{ AttributeName: 'pvm_linux_kvm_percentage', CurrentValue: 500 }];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registry) }));
      const { linuxKvmPercentageValue } = useBootBiosAttributes();
      expect(linuxKvmPercentageValue.value).toBe(50);
    });
  });

  describe('IBM i tagged settings', () => {
    it('falls back to "Current configuration" when registry entry missing', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      const { ibmiLoadSourceValue, ibmiAltLoadSourceValue, ibmiConsoleValue } =
        useBootBiosAttributes();
      expect(ibmiLoadSourceValue.value).toBe('Current configuration');
      expect(ibmiAltLoadSourceValue.value).toBe('Current configuration');
      expect(ibmiConsoleValue.value).toBe('Current configuration');
    });

    it('returns CurrentValue from registry for IBM i tagged settings', () => {
      const registry = [
        { AttributeName: 'pvm_ibmi_load_source', CurrentValue: 'SlotA' },
        { AttributeName: 'pvm_ibmi_alt_load_source', CurrentValue: 'SlotB' },
        { AttributeName: 'pvm_ibmi_console', CurrentValue: 'HMC' },
      ];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref({}) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registry) }));
      const { ibmiLoadSourceValue, ibmiAltLoadSourceValue, ibmiConsoleValue } =
        useBootBiosAttributes();
      expect(ibmiLoadSourceValue.value).toBe('SlotA');
      expect(ibmiAltLoadSourceValue.value).toBe('SlotB');
      expect(ibmiConsoleValue.value).toBe('HMC');
    });
  });

  describe('combined isLoading / isError', () => {
    it('isLoading is true when either bios or registry is loading', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ isLoading: ref(true) }))
        .mockReturnValueOnce(makeMockQuery({ isLoading: ref(false) }));
      const { isLoading } = useBootBiosAttributes();
      expect(isLoading.value).toBe(true);
    });

    it('isLoading is false when both queries are done', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(false) }));
      const { isLoading } = useBootBiosAttributes();
      expect(isLoading.value).toBe(false);
    });

    it('isError is true when bios query errors', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ isError: ref(true) }))
        .mockReturnValueOnce(makeMockQuery({ isError: ref(false) }));
      const { isError } = useBootBiosAttributes();
      expect(isError.value).toBe(true);
    });
  });

  describe('saveBiosSettings mutation', () => {
    it('exposes saveBiosSettings as mutateAsync', () => {
      const mutateFn = vi.fn().mockResolvedValue(undefined);
      useQuery.mockReturnValue(makeMockQuery({ data: ref({}) }));
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync: mutateFn }));
      const { saveBiosSettings } = useBootBiosAttributes();
      expect(saveBiosSettings).toBe(mutateFn);
    });

    it('invalidates bios queries on success', () => {
      let onSuccessCallback;
      useMutation.mockImplementation(({ onSuccess }) => {
        if (onSuccess) onSuccessCallback = onSuccess;
        return makeMockMutation();
      });
      useQuery.mockReturnValue(makeMockQuery({ data: ref({}) }));
      useBootBiosAttributes();
      onSuccessCallback?.();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['spo', 'bios', 'attributes'] }),
      );
    });

    it('exposes isSavingBios from mutation isPending', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref({}) }));
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));
      const { isSavingBios } = useBootBiosAttributes();
      expect(isSavingBios.value).toBe(true);
    });
  });

  describe('refetch', () => {
    it('exposes a refetch function', () => {
      useQuery.mockReturnValue(makeMockQuery());
      useMutation.mockReturnValue(makeMockMutation());
      const { refetch } = useBootBiosAttributes();
      expect(typeof refetch).toBe('function');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useServerSystemInfo
// ─────────────────────────────────────────────────────────────────────────────

describe('useServerSystemInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('serverStatus', () => {
    it('returns "unreachable" when data is null', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('unreachable');
    });

    it('maps PowerState "On" to "on"', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref({ PowerState: 'On' }) }));
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('on');
    });

    it('maps PowerState "Off" to "off"', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref({ PowerState: 'Off' }) }));
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('off');
    });

    it('prefers Status.State over PowerState for Quiesced', () => {
      useQuery.mockReturnValue(
        makeMockQuery({
          data: ref({ PowerState: 'On', Status: { State: 'Quiesced' } }),
        }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('error');
    });

    it('prefers Status.State over PowerState for InTest', () => {
      useQuery.mockReturnValue(
        makeMockQuery({
          data: ref({ PowerState: 'On', Status: { State: 'InTest' } }),
        }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('diagnosticMode');
    });
  });

  describe('isInPhypStandby', () => {
    const cases = [
      { state: 'SystemHardwareInitializationComplete', expected: true },
      { state: 'SetupEntered', expected: true },
      { state: 'OSBootStarted', expected: false },
      { state: 'OSRunning', expected: false },
      { state: null, expected: false },
    ];

    cases.forEach(({ state, expected }) => {
      it(`returns ${expected} for BootProgress.LastState="${state}"`, () => {
        useQuery.mockReturnValue(
          makeMockQuery({
            data: ref({ BootProgress: { LastState: state } }),
          }),
        );
        const { isInPhypStandby } = useServerSystemInfo();
        expect(isInPhypStandby.value).toBe(expected);
      });
    });
  });

  describe('lastPowerOperationTime', () => {
    it('returns null when LastResetTime is absent', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref({}) }));
      const { lastPowerOperationTime } = useServerSystemInfo();
      expect(lastPowerOperationTime.value).toBeNull();
    });

    it('returns a Date when LastResetTime is present', () => {
      useQuery.mockReturnValue(
        makeMockQuery({ data: ref({ LastResetTime: '2024-01-15T12:00:00Z' }) }),
      );
      const { lastPowerOperationTime } = useServerSystemInfo();
      expect(lastPowerOperationTime.value).toBeInstanceOf(Date);
    });
  });

  describe('powerRestorePolicy', () => {
    it('returns empty string when data is null', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { powerRestorePolicy } = useServerSystemInfo();
      expect(powerRestorePolicy.value).toBe('');
    });

    it('returns PowerRestorePolicy from system data', () => {
      useQuery.mockReturnValue(
        makeMockQuery({ data: ref({ PowerRestorePolicy: 'AlwaysOn' }) }),
      );
      const { powerRestorePolicy } = useServerSystemInfo();
      expect(powerRestorePolicy.value).toBe('AlwaysOn');
    });
  });

  describe('loading and error states', () => {
    it('exposes isSystemLoading', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(true) }));
      const { isSystemLoading } = useServerSystemInfo();
      expect(isSystemLoading.value).toBe(true);
    });

    it('exposes isSystemError', () => {
      useQuery.mockReturnValue(makeMockQuery({ isError: ref(true) }));
      const { isSystemError } = useServerSystemInfo();
      expect(isSystemError.value).toBe(true);
    });

    it('exposes refetchSystem function', () => {
      const refetchFn = vi.fn();
      useQuery.mockReturnValue(makeMockQuery({ refetch: refetchFn }));
      const { refetchSystem } = useServerSystemInfo();
      expect(refetchSystem).toBe(refetchFn);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useServerBmcInfo
// ─────────────────────────────────────────────────────────────────────────────

describe('useServerBmcInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null bmc data when query has no data', () => {
    useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value).toBeNull();
  });

  it('returns mapped BmcInfo fields when query provides them', () => {
    // useQuery is mocked — data holds the already-mapped BmcInfo shape.
    // (The queryFn mapping only runs in the real implementation.)
    const mappedBmc = {
      id: 'bmc',
      name: 'BMC',
      dateTime: new Date('2024-01-15T12:00:00Z'),
      description: 'Baseboard Management Controller',
      powerState: 'On',
      health: 'OK',
      statusState: 'Enabled',
      locationNumber: 'U1234',
      model: 'ASTBMC',
      partNumber: 'P001',
      serialNumber: 'S001',
      sparePartNumber: 'SP001',
      identifyLed: false,
      uri: '/redfish/v1/Managers/bmc',
    };
    useQuery.mockReturnValue(makeMockQuery({ data: ref(mappedBmc) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value.id).toBe('bmc');
    expect(bmc.value.powerState).toBe('On');
    expect(bmc.value.health).toBe('OK');
    expect(bmc.value.statusState).toBe('Enabled');
    expect(bmc.value.locationNumber).toBe('U1234');
    expect(bmc.value.dateTime).toBeInstanceOf(Date);
    expect(bmc.value.uri).toBe('/redfish/v1/Managers/bmc');
  });

  it('identifyLed is false in the returned BmcInfo', () => {
    const mappedBmc = { id: 'bmc', name: 'BMC', identifyLed: false, uri: '/redfish/v1/Managers/bmc' };
    useQuery.mockReturnValue(makeMockQuery({ data: ref(mappedBmc) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value.identifyLed).toBe(false);
  });

  it('exposes isLoading and isFetching', () => {
    useQuery.mockReturnValue(
      makeMockQuery({ isLoading: ref(true), isFetching: ref(true) }),
    );
    const { isLoading, isFetching } = useServerBmcInfo();
    expect(isLoading.value).toBe(true);
    expect(isFetching.value).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useLocationCodes
// ─────────────────────────────────────────────────────────────────────────────

describe('useLocationCodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when data is null', () => {
    useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));
    const { locationCodes } = useLocationCodes();
    expect(locationCodes.value).toBeNull();
  });

  it('returns location codes array when data is present', () => {
    useQuery.mockReturnValue(makeMockQuery({ data: ref(['U78DA.001.XYZ-P1-C1', 'U78DA.001.XYZ-P1-C2']) }));
    const { locationCodes } = useLocationCodes();
    expect(locationCodes.value).toEqual(['U78DA.001.XYZ-P1-C1', 'U78DA.001.XYZ-P1-C2']);
  });

  it('exposes a refetch function', () => {
    const refetchFn = vi.fn();
    useQuery.mockReturnValue(makeMockQuery({ refetch: refetchFn }));
    const { refetch } = useLocationCodes();
    expect(refetch).toBe(refetchFn);
  });
});
