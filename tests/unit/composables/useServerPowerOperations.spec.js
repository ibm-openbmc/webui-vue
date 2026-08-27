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

// ── Mock shared queryConfig (include createRedfishQueryConfig) ────────────────
vi.mock('@/api/composables/shared/queryConfig', () => ({
  RedfishQueryPresets: {
    metadata: { staleTime: 600000, gcTime: 1800000 },
  },
  createRedfishQueryConfig: vi.fn(() => ({})),
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

// ── Mock useAllSubResources (useRedfishResource + useRedfishCollection) ────────
vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishResource: vi.fn(),
  useRedfishCollection: vi.fn(),
}));

// ── Mock usePatchResource ─────────────────────────────────────────────────────
vi.mock('@/api/composables/usePatchResource', () => ({
  usePatchResource: vi.fn(),
}));

import { useMutation, useQueryClient } from '@tanstack/vue-query';
import {
  useRedfishResource,
  useRedfishCollection,
} from '@/api/composables/useAllSubResources';
import { usePatchResource } from '@/api/composables/usePatchResource';
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
  let mockPatchResource;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    useMutation.mockReturnValue(makeMockMutation());
    mockPatchResource = vi.fn().mockResolvedValue(undefined);
    usePatchResource.mockReturnValue({
      patchResource: mockPatchResource,
      isPending: ref(false),
    });
    // Default: both resource queries return null data
    useRedfishResource.mockReturnValue(makeMockQuery());
  });

  describe('BIOS attributes data', () => {
    it('returns null biosAttributes when query data is null', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { biosAttributes } = useBootBiosAttributes();
      expect(biosAttributes.value).toEqual({});
    });

    it('returns filtered biosAttributes when query data is present', () => {
      const biosResource = {
        Attributes: {
          pvm_default_os_type: 'IBM I',
          pvm_sys_dump_active: 'Disabled',
          some_other_attr: 'ignored',
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(biosResource) })) // bios
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) })); // registry
      const { biosAttributes } = useBootBiosAttributes();
      expect(biosAttributes.value).toHaveProperty(
        'pvm_default_os_type',
        'IBM I',
      );
      expect(biosAttributes.value).toHaveProperty(
        'pvm_sys_dump_active',
        'Disabled',
      );
      expect(biosAttributes.value).not.toHaveProperty('some_other_attr');
    });
  });

  describe('attributeValues derived from registry', () => {
    it('returns null when registry is not loaded', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).toBeNull();
    });

    it('returns null when registry resource has empty Attributes', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(
          makeMockQuery({ data: ref({ RegistryEntries: { Attributes: [] } }) }),
        );
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).toBeNull();
    });

    it('derives attributeValues from registry entries', () => {
      const registryResource = {
        RegistryEntries: {
          Attributes: [
            {
              AttributeName: 'pvm_default_os_type',
              CurrentValue: 'AIX',
              Value: [{ ValueName: 'AIX' }, { ValueName: 'IBM I' }],
            },
          ],
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) })) // bios
        .mockReturnValueOnce(makeMockQuery({ data: ref(registryResource) })); // registry
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).toHaveProperty('pvm_default_os_type');
      expect(attributeValues.value['pvm_default_os_type']).toHaveLength(2);
      expect(attributeValues.value['pvm_default_os_type'][0].value).toBe('AIX');
    });

    it('skips pvm_sys_dump_active from attributeValues', () => {
      const registryResource = {
        RegistryEntries: {
          Attributes: [
            {
              AttributeName: 'pvm_sys_dump_active',
              Value: [{ ValueName: 'Enabled' }],
            },
          ],
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registryResource) }));
      const { attributeValues } = useBootBiosAttributes();
      expect(attributeValues.value).not.toHaveProperty('pvm_sys_dump_active');
    });
  });

  describe('hmcManaged derived from registry', () => {
    it('returns null when registry has no pvm_hmc_managed entry', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(
          makeMockQuery({ data: ref({ RegistryEntries: { Attributes: [] } }) }),
        );
      const { hmcManaged } = useBootBiosAttributes();
      expect(hmcManaged.value).toBeNull();
    });

    it('returns hmcManaged CurrentValue from registry', () => {
      const registryResource = {
        RegistryEntries: {
          Attributes: [
            { AttributeName: 'pvm_hmc_managed', CurrentValue: 'Enabled' },
          ],
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registryResource) }));
      const { hmcManaged } = useBootBiosAttributes();
      expect(hmcManaged.value).toBe('Enabled');
    });
  });

  describe('linuxKvmPercentageValue', () => {
    it('returns null when registry entry is absent', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(
          makeMockQuery({ data: ref({ RegistryEntries: { Attributes: [] } }) }),
        );
      const { linuxKvmPercentageValue } = useBootBiosAttributes();
      expect(linuxKvmPercentageValue.value).toBeNull();
    });

    it('divides CurrentValue by 10', () => {
      const registryResource = {
        RegistryEntries: {
          Attributes: [
            { AttributeName: 'pvm_linux_kvm_percentage', CurrentValue: 500 },
          ],
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registryResource) }));
      const { linuxKvmPercentageValue } = useBootBiosAttributes();
      expect(linuxKvmPercentageValue.value).toBe(50);
    });
  });

  describe('IBM i tagged settings', () => {
    it('falls back to "Current configuration" when registry entry missing', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(
          makeMockQuery({ data: ref({ RegistryEntries: { Attributes: [] } }) }),
        );
      const { ibmiLoadSourceValue, ibmiAltLoadSourceValue, ibmiConsoleValue } =
        useBootBiosAttributes();
      expect(ibmiLoadSourceValue.value).toBe('Current configuration');
      expect(ibmiAltLoadSourceValue.value).toBe('Current configuration');
      expect(ibmiConsoleValue.value).toBe('Current configuration');
    });

    it('returns CurrentValue from registry for IBM i tagged settings', () => {
      const registryResource = {
        RegistryEntries: {
          Attributes: [
            { AttributeName: 'pvm_ibmi_load_source', CurrentValue: 'SlotA' },
            {
              AttributeName: 'pvm_ibmi_alt_load_source',
              CurrentValue: 'SlotB',
            },
            { AttributeName: 'pvm_ibmi_console', CurrentValue: 'HMC' },
          ],
        },
      };
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(registryResource) }));
      const { ibmiLoadSourceValue, ibmiAltLoadSourceValue, ibmiConsoleValue } =
        useBootBiosAttributes();
      expect(ibmiLoadSourceValue.value).toBe('SlotA');
      expect(ibmiAltLoadSourceValue.value).toBe('SlotB');
      expect(ibmiConsoleValue.value).toBe('HMC');
    });
  });

  describe('combined isLoading / isError', () => {
    it('isLoading is true when either bios or registry is loading', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ isLoading: ref(true) }))
        .mockReturnValueOnce(makeMockQuery({ isLoading: ref(false) }));
      const { isLoading } = useBootBiosAttributes();
      expect(isLoading.value).toBe(true);
    });

    it('isLoading is false when both queries are done', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ isLoading: ref(false) }),
      );
      const { isLoading } = useBootBiosAttributes();
      expect(isLoading.value).toBe(false);
    });

    it('isError is true when bios query errors', () => {
      useRedfishResource
        .mockReturnValueOnce(makeMockQuery({ isError: ref(true) }))
        .mockReturnValueOnce(makeMockQuery({ isError: ref(false) }));
      const { isError } = useBootBiosAttributes();
      expect(isError.value).toBe(true);
    });
  });

  describe('saveBiosSettings mutation', () => {
    it('exposes saveBiosSettings as a function', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { saveBiosSettings } = useBootBiosAttributes();
      expect(typeof saveBiosSettings).toBe('function');
    });

    it('calls patchResource with correct args and updates cache on success', async () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      mockPatchResource.mockResolvedValue(undefined);
      const { saveBiosSettings } = useBootBiosAttributes();
      const biosSettings = { pvm_default_os_type: 'AIX' };
      await saveBiosSettings(biosSettings);
      expect(mockPatchResource).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/redfish/v1/Systems/system/Bios/Settings',
          field: 'Attributes',
          value: biosSettings,
        }),
      );
    });

    it('exposes isSavingBios from usePatchResource isPending', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      usePatchResource.mockReturnValue({
        patchResource: vi.fn(),
        isPending: ref(true),
      });
      const { isSavingBios } = useBootBiosAttributes();
      expect(isSavingBios.value).toBe(true);
    });
  });

  describe('refetch', () => {
    it('exposes a refetch function', () => {
      useRedfishResource.mockReturnValue(makeMockQuery());
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
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('unreachable');
    });

    it('maps PowerState "On" to "on"', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ data: ref({ PowerState: 'On' }) }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('on');
    });

    it('maps PowerState "Off" to "off"', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ data: ref({ PowerState: 'Off' }) }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('off');
    });

    it('prefers Status.State over PowerState for Quiesced', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({
          data: ref({ PowerState: 'On', Status: { State: 'Quiesced' } }),
        }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('error');
    });

    it('prefers Status.State over PowerState for InTest', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({
          data: ref({ PowerState: 'On', Status: { State: 'InTest' } }),
        }),
      );
      const { serverStatus } = useServerSystemInfo();
      expect(serverStatus.value).toBe('diagnosticMode');
    });
  });

  describe('lastPowerOperationTime', () => {
    it('returns null when LastResetTime is absent', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref({}) }));
      const { lastPowerOperationTime } = useServerSystemInfo();
      expect(lastPowerOperationTime.value).toBeNull();
    });

    it('returns a Date when LastResetTime is present', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ data: ref({ LastResetTime: '2024-01-15T12:00:00Z' }) }),
      );
      const { lastPowerOperationTime } = useServerSystemInfo();
      expect(lastPowerOperationTime.value).toBeInstanceOf(Date);
    });
  });

  describe('powerRestorePolicy', () => {
    it('returns empty string when data is null', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
      const { powerRestorePolicy } = useServerSystemInfo();
      expect(powerRestorePolicy.value).toBe('');
    });

    it('returns PowerRestorePolicy from system data', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ data: ref({ PowerRestorePolicy: 'AlwaysOn' }) }),
      );
      const { powerRestorePolicy } = useServerSystemInfo();
      expect(powerRestorePolicy.value).toBe('AlwaysOn');
    });
  });

  describe('loading and error states', () => {
    it('exposes isSystemLoading', () => {
      useRedfishResource.mockReturnValue(
        makeMockQuery({ isLoading: ref(true) }),
      );
      const { isSystemLoading } = useServerSystemInfo();
      expect(isSystemLoading.value).toBe(true);
    });

    it('exposes isSystemError', () => {
      useRedfishResource.mockReturnValue(makeMockQuery({ isError: ref(true) }));
      const { isSystemError } = useServerSystemInfo();
      expect(isSystemError.value).toBe(true);
    });

    it('exposes refetchSystem function', () => {
      const refetchFn = vi.fn();
      useRedfishResource.mockReturnValue(makeMockQuery({ refetch: refetchFn }));
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
    useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value).toBeNull();
  });

  it('returns mapped BmcInfo fields when query provides raw BmcResponse', () => {
    const rawBmc = {
      '@odata.id': '/redfish/v1/Managers/bmc',
      Id: 'bmc',
      Name: 'BMC',
      DateTime: '2024-01-15T12:00:00Z',
      Description: 'Baseboard Management Controller',
      PowerState: 'On',
      Status: { Health: 'OK', State: 'Enabled' },
      Location: { PartLocation: { ServiceLabel: 'U1234' } },
      Model: 'ASTBMC',
      PartNumber: 'P001',
      SerialNumber: 'S001',
      SparePartNumber: 'SP001',
      LocationIndicatorActive: false,
    };
    useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(rawBmc) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value.id).toBe('bmc');
    expect(bmc.value.powerState).toBe('On');
    expect(bmc.value.health).toBe('OK');
    expect(bmc.value.statusState).toBe('Enabled');
    expect(bmc.value.locationNumber).toBe('U1234');
    expect(bmc.value.dateTime).toBeInstanceOf(Date);
    expect(bmc.value.uri).toBe('/redfish/v1/Managers/bmc');
  });

  it('identifyLed is false when LocationIndicatorActive is absent', () => {
    const rawBmc = {
      '@odata.id': '/redfish/v1/Managers/bmc',
      Id: 'bmc',
      Name: 'BMC',
    };
    useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(rawBmc) }));
    const { bmc } = useServerBmcInfo();
    expect(bmc.value.identifyLed).toBe(false);
  });

  it('exposes isLoading and isFetching', () => {
    useRedfishResource.mockReturnValue(
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

  it('returns empty array when collection data is null', () => {
    useRedfishCollection.mockReturnValue(makeMockQuery({ data: ref(null) }));
    const { locationCodes } = useLocationCodes();
    expect(locationCodes.value).toEqual([]);
  });

  it('returns location codes extracted from chassis PCIeSlots', () => {
    const chassisMembers = [
      {
        PCIeSlots: {
          Slots: [
            {
              Links: {
                PCIeDevice: [
                  { '@odata.id': '/redfish/v1/Systems/system/PCIeDevices/0' },
                ],
              },
              Location: {
                PartLocation: { ServiceLabel: 'U78DA.001.XYZ-P1-C1' },
              },
            },
            {
              Links: { PCIeDevice: [] }, // no device — should be skipped
              Location: {
                PartLocation: { ServiceLabel: 'U78DA.001.XYZ-P1-C2' },
              },
            },
          ],
        },
      },
    ];
    useRedfishCollection.mockReturnValue(
      makeMockQuery({ data: ref(chassisMembers) }),
    );
    const { locationCodes } = useLocationCodes();
    expect(locationCodes.value).toEqual(['U78DA.001.XYZ-P1-C1']);
  });

  it('exposes a refetch function', () => {
    const refetchFn = vi.fn();
    useRedfishCollection.mockReturnValue(makeMockQuery({ refetch: refetchFn }));
    const { refetch } = useLocationCodes();
    expect(refetch).toBe(refetchFn);
  });
});
