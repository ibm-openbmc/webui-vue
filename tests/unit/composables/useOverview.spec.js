import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import {
  useOverviewFirmware,
  useOverviewLicense,
  useOverviewNetwork,
  useOverviewEvents,
  useOverviewInventory,
  useOverviewQuickLinks,
  useUpdateIdentifyLed,
} from '@/api/composables/useOverview';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/vue-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@/api/composables/useRedfishCollection', () => ({
  useRedfishResource: vi.fn(),
  useRedfishCollection: vi.fn(),
}));

vi.mock('@/api/composables/usePatchResource', () => ({
  usePatchResource: vi.fn(),
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    successToast: vi.fn(),
    errorToast: vi.fn(),
  })),
}));

import {
  useRedfishResource,
  useRedfishCollection,
} from '@/api/composables/useRedfishCollection';
import { usePatchResource } from '@/api/composables/usePatchResource';
import { useQueryClient } from '@tanstack/vue-query';
import useToast from '@/components/Composables/useToastComposable';

// ── Shared helpers ─────────────────────────────────────────────────────────────

function stubResource(data = null, overrides = {}) {
  return {
    data: ref(data),
    isLoading: ref(false),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    ...overrides,
  };
}

function stubCollection(items = [], overrides = {}) {
  return {
    data: ref(items),
    isLoading: ref(false),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useOverviewFirmware', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns null firmware versions when no data', () => {
    useRedfishResource.mockReturnValue(stubResource(null));
    useRedfishCollection.mockReturnValue(stubCollection([]));

    const {
      runningVersion,
      backupVersion,
      activeBmcFirmware,
      backupBmcFirmware,
    } = useOverviewFirmware();

    expect(runningVersion.value).toBeNull();
    expect(backupVersion.value).toBeNull();
    expect(activeBmcFirmware.value).toBeNull();
    expect(backupBmcFirmware.value).toBeNull();
  });

  it('returns correct active and backup firmware versions', () => {
    const bmcManager = {
      Links: {
        ActiveSoftwareImage: {
          '@odata.id': '/redfish/v1/UpdateService/FirmwareInventory/bmc_active',
        },
      },
    };

    const firmwareInventory = [
      {
        Id: 'bmc_active',
        Version: '1.2.3',
        RelatedItem: [{ '@odata.id': '/redfish/v1/Managers/bmc' }],
      },
      {
        Id: 'bmc_backup',
        Version: '1.1.0',
        RelatedItem: [{ '@odata.id': '/redfish/v1/Managers/bmc' }],
      },
    ];

    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return stubResource(callCount++ === 0 ? bmcManager : null);
    });
    useRedfishCollection.mockReturnValue(stubCollection(firmwareInventory));

    const { runningVersion, backupVersion } = useOverviewFirmware();

    expect(runningVersion.value).toBe('1.2.3');
    expect(backupVersion.value).toBe('1.1.0');
  });

  it('exposes combined isLoading and isError', () => {
    useRedfishResource.mockReturnValue(
      stubResource(null, { isLoading: ref(true), isError: ref(true) }),
    );
    useRedfishCollection.mockReturnValue(stubCollection([]));

    const { isLoading, isError } = useOverviewFirmware();

    expect(isLoading.value).toBe(true);
    expect(isError.value).toBe(true);
  });

  it('isLoading is true when firmware collection is loading', () => {
    useRedfishResource.mockReturnValue(stubResource(null));
    useRedfishCollection.mockReturnValue(
      stubCollection([], { isLoading: ref(true) }),
    );

    const { isLoading } = useOverviewFirmware();
    expect(isLoading.value).toBe(true);
  });

  it('isError is true when firmware collection has error (bmc is fine)', () => {
    let callCount = 0;
    useRedfishResource.mockImplementation(() =>
      stubResource(null, {
        isError: callCount++ === 0 ? ref(false) : ref(true),
      }),
    );
    useRedfishCollection.mockReturnValue(
      stubCollection([], { isError: ref(true) }),
    );

    const { isError } = useOverviewFirmware();
    expect(isError.value).toBe(true);
  });

  it('returns null activeBmcFirmware when no firmware matches activeFirmwareId', () => {
    const bmcManager = {
      Links: {
        ActiveSoftwareImage: {
          '@odata.id':
            '/redfish/v1/UpdateService/FirmwareInventory/bmc_nonexistent',
        },
      },
    };
    const firmwareInventory = [
      {
        Id: 'bmc_other',
        Version: '1.0.0',
        RelatedItem: [{ '@odata.id': '/redfish/v1/Managers/bmc' }],
      },
    ];
    let callCount = 0;
    useRedfishResource.mockImplementation(() =>
      stubResource(callCount++ === 0 ? bmcManager : null),
    );
    useRedfishCollection.mockReturnValue(stubCollection(firmwareInventory));

    const { activeBmcFirmware } = useOverviewFirmware();
    expect(activeBmcFirmware.value).toBeNull();
  });

  it('returns null backupBmcFirmware when only one firmware item exists and it is active', () => {
    const bmcManager = {
      Links: {
        ActiveSoftwareImage: {
          '@odata.id': '/redfish/v1/UpdateService/FirmwareInventory/bmc_active',
        },
      },
    };
    const firmwareInventory = [
      {
        Id: 'bmc_active',
        Version: '2.0.0',
        RelatedItem: [{ '@odata.id': '/redfish/v1/Managers/bmc' }],
      },
    ];
    let callCount = 0;
    useRedfishResource.mockImplementation(() =>
      stubResource(callCount++ === 0 ? bmcManager : null),
    );
    useRedfishCollection.mockReturnValue(stubCollection(firmwareInventory));

    const { activeBmcFirmware, backupBmcFirmware } = useOverviewFirmware();
    expect(activeBmcFirmware.value?.version).toBe('2.0.0');
    expect(backupBmcFirmware.value).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useOverviewLicense', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns null expirationDate when licenses data is null', () => {
    useRedfishCollection.mockReturnValue(stubCollection(null));

    const { firmwareAccessKeyInfo } = useOverviewLicense();
    expect(firmwareAccessKeyInfo.value.expirationDate).toBeNull();
  });

  it('returns null expirationDate when no licenses', () => {
    useRedfishCollection.mockReturnValue(stubCollection([]));

    const { firmwareAccessKeyInfo } = useOverviewLicense();
    expect(firmwareAccessKeyInfo.value.expirationDate).toBeNull();
  });

  it('returns null when UAK license is absent', () => {
    useRedfishCollection.mockReturnValue(
      stubCollection([{ Id: 'OTHER', ExpirationDate: '2030-01-01T00:00:00Z' }]),
    );

    const { firmwareAccessKeyInfo } = useOverviewLicense();
    expect(firmwareAccessKeyInfo.value.expirationDate).toBeNull();
  });

  it('returns expirationDate from UAK license', () => {
    const dateStr = '2030-06-15T00:00:00Z';
    useRedfishCollection.mockReturnValue(
      stubCollection([{ Id: 'UAK', ExpirationDate: dateStr }]),
    );

    const { firmwareAccessKeyInfo } = useOverviewLicense();
    expect(firmwareAccessKeyInfo.value.expirationDate).toEqual(
      new Date(dateStr),
    );
  });

  it('exposes isLoading and isError', () => {
    useRedfishCollection.mockReturnValue(
      stubCollection([], { isLoading: ref(true), isError: ref(true) }),
    );

    const { isLoading, isError } = useOverviewLicense();
    expect(isLoading.value).toBe(true);
    expect(isError.value).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useOverviewNetwork', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns empty network data when no interfaces', () => {
    useRedfishCollection.mockReturnValue(stubCollection([]));

    const { network } = useOverviewNetwork();
    expect(network.value).toEqual({
      hostname: null,
      staticAddress: null,
      dhcpAddress: [],
    });
  });

  it('returns hostname, static address, and DHCP address from first interface', () => {
    const iface = {
      HostName: 'my-bmc',
      IPv4StaticAddresses: [{ Address: '192.168.1.10' }],
      IPv4Addresses: [
        { Address: '10.0.0.1', AddressOrigin: 'DHCP' },
        { Address: '10.0.0.2', AddressOrigin: 'Static' },
      ],
    };
    useRedfishCollection.mockReturnValue(stubCollection([iface]));

    const { network } = useOverviewNetwork();
    expect(network.value.hostname).toBe('my-bmc');
    expect(network.value.staticAddress).toBe('192.168.1.10');
    expect(network.value.dhcpAddress).toHaveLength(1);
    expect(network.value.dhcpAddress[0].Address).toBe('10.0.0.1');
  });

  it('returns null for staticAddress when IPv4StaticAddresses is empty', () => {
    const iface = {
      HostName: 'bmc',
      IPv4StaticAddresses: [],
      IPv4Addresses: [],
    };
    useRedfishCollection.mockReturnValue(stubCollection([iface]));

    const { network } = useOverviewNetwork();
    expect(network.value.staticAddress).toBeNull();
  });

  it('returns null hostname when HostName is absent from interface', () => {
    const iface = {
      IPv4StaticAddresses: [{ Address: '10.0.0.1' }],
      IPv4Addresses: [],
    };
    useRedfishCollection.mockReturnValue(stubCollection([iface]));

    const { network } = useOverviewNetwork();
    expect(network.value.hostname).toBeNull();
  });

  it('returns empty dhcpAddress when IPv4Addresses is absent from interface', () => {
    const iface = {
      HostName: 'bmc',
      IPv4StaticAddresses: [],
    };
    useRedfishCollection.mockReturnValue(stubCollection([iface]));

    const { network } = useOverviewNetwork();
    expect(network.value.dhcpAddress).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useOverviewEvents', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns empty arrays when event logs data is null', () => {
    useRedfishCollection.mockReturnValue(stubCollection(null));

    const { allEvents, criticalEvents, warningEvents } = useOverviewEvents();
    expect(allEvents.value).toEqual([]);
    expect(criticalEvents.value).toEqual([]);
    expect(warningEvents.value).toEqual([]);
  });

  it('returns empty arrays when no event logs', () => {
    useRedfishCollection.mockReturnValue(stubCollection([]));

    const { allEvents, criticalEvents, warningEvents } = useOverviewEvents();
    expect(allEvents.value).toEqual([]);
    expect(criticalEvents.value).toEqual([]);
    expect(warningEvents.value).toEqual([]);
  });

  it('counts critical unresolved events correctly', () => {
    const logs = [
      { Id: '1', Severity: 'Critical', Resolved: false },
      { Id: '2', Severity: 'Critical', Resolved: true },
      { Id: '3', Severity: 'Warning', Resolved: false },
      { Id: '4', Severity: 'OK', Resolved: false },
    ];
    useRedfishCollection.mockReturnValue(stubCollection(logs));

    const { criticalEvents } = useOverviewEvents();
    expect(criticalEvents.value).toHaveLength(1);
    expect(criticalEvents.value[0].Id).toBe('1');
  });

  it('counts warning unresolved events correctly', () => {
    const logs = [
      { Id: '1', Severity: 'Warning', Resolved: false },
      { Id: '2', Severity: 'Warning', Resolved: true },
      { Id: '3', Severity: 'Critical', Resolved: false },
    ];
    useRedfishCollection.mockReturnValue(stubCollection(logs));

    const { warningEvents } = useOverviewEvents();
    expect(warningEvents.value).toHaveLength(1);
    expect(warningEvents.value[0].Id).toBe('1');
  });

  it('maps Resolved flag to filterByStatus field', () => {
    const logs = [
      { Id: '1', Severity: 'OK', Resolved: true },
      { Id: '2', Severity: 'OK', Resolved: false },
    ];
    useRedfishCollection.mockReturnValue(stubCollection(logs));

    const { allEvents } = useOverviewEvents();
    expect(allEvents.value[0].filterByStatus).toBe('Resolved');
    expect(allEvents.value[1].filterByStatus).toBe('Unresolved');
  });

  it('defaults Severity to OK when absent', () => {
    const logs = [{ Id: '1', Resolved: false }];
    useRedfishCollection.mockReturnValue(stubCollection(logs));

    const { allEvents } = useOverviewEvents();
    expect(allEvents.value[0].Severity).toBe('OK');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useOverviewInventory', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns false locationIndicatorActive when no system data', () => {
    useRedfishResource.mockReturnValue(stubResource(null));

    const { systems } = useOverviewInventory();
    expect(systems.value.locationIndicatorActive).toBe(false);
  });

  it('returns locationIndicatorActive from system data', () => {
    useRedfishResource.mockReturnValue(
      stubResource({ LocationIndicatorActive: true }),
    );

    const { systems } = useOverviewInventory();
    expect(systems.value.locationIndicatorActive).toBe(true);
  });

  it('returns false when LocationIndicatorActive is explicitly false', () => {
    useRedfishResource.mockReturnValue(
      stubResource({ LocationIndicatorActive: false }),
    );

    const { systems } = useOverviewInventory();
    expect(systems.value.locationIndicatorActive).toBe(false);
  });

  it('exposes isLoading and isError', () => {
    useRedfishResource.mockReturnValue(
      stubResource(null, { isLoading: ref(true), isError: ref(true) }),
    );

    const { isLoading, isError } = useOverviewInventory();
    expect(isLoading.value).toBe(true);
    expect(isError.value).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useOverviewQuickLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('testuser');
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns null bmcTime when no manager data', () => {
    useRedfishResource.mockReturnValue(stubResource(null));

    const { bmcTime } = useOverviewQuickLinks();
    expect(bmcTime.value).toBeNull();
  });

  it('returns parsed bmcTime from manager DateTime field', () => {
    const dateStr = '2024-05-01T12:00:00Z';
    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return callCount++ === 0
        ? stubResource({ DateTime: dateStr })
        : stubResource(null);
    });

    const { bmcTime } = useOverviewQuickLinks();
    expect(bmcTime.value).toEqual(new Date(dateStr));
  });

  it('canUseHostConsole is true for Administrator role', () => {
    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return callCount++ === 0
        ? stubResource({ DateTime: null })
        : stubResource({ RoleId: 'Administrator' });
    });

    const { canUseHostConsole } = useOverviewQuickLinks();
    expect(canUseHostConsole.value).toBe(true);
  });

  it('canUseHostConsole is true for OemIBMServiceAgent role', () => {
    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return callCount++ === 0
        ? stubResource({ DateTime: null })
        : stubResource({ RoleId: 'OemIBMServiceAgent' });
    });

    const { canUseHostConsole } = useOverviewQuickLinks();
    expect(canUseHostConsole.value).toBe(true);
  });

  it('canUseHostConsole is false for ReadOnly role', () => {
    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return callCount++ === 0
        ? stubResource({ DateTime: null })
        : stubResource({ RoleId: 'ReadOnly' });
    });

    const { canUseHostConsole } = useOverviewQuickLinks();
    expect(canUseHostConsole.value).toBe(false);
  });

  it('currentUserRole returns null when no user data', () => {
    useRedfishResource.mockReturnValue(stubResource(null));

    const { currentUserRole } = useOverviewQuickLinks();
    expect(currentUserRole.value).toBeNull();
  });

  it('currentUserRole reflects fetched RoleId', () => {
    let callCount = 0;
    useRedfishResource.mockImplementation(() => {
      return callCount++ === 0
        ? stubResource({ DateTime: null })
        : stubResource({ RoleId: 'Operator' });
    });

    const { currentUserRole } = useOverviewQuickLinks();
    expect(currentUserRole.value).toBe('Operator');
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('useUpdateIdentifyLed', () => {
  let mockQueryClient;
  let mockPatchResource;
  let mockSuccessToast;
  let mockErrorToast;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = { invalidateQueries: vi.fn(), setQueryData: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);

    mockSuccessToast = vi.fn();
    mockErrorToast = vi.fn();
    useToast.mockReturnValue({
      successToast: mockSuccessToast,
      errorToast: mockErrorToast,
    });

    mockPatchResource = vi.fn();
    usePatchResource.mockReturnValue({
      patchResource: mockPatchResource,
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    });
  });
  afterEach(() => vi.restoreAllMocks());

  it('returns updateIdentifyLed, isUpdating, isError, error', () => {
    const result = useUpdateIdentifyLed();

    expect(result).toHaveProperty('updateIdentifyLed');
    expect(result).toHaveProperty('updateIdentifyLedAsync');
    expect(result).toHaveProperty('isUpdating');
    expect(result).toHaveProperty('isError');
    expect(result).toHaveProperty('error');
  });

  it('calls patchResource with correct endpoint and field when LED is enabled', async () => {
    mockPatchResource.mockResolvedValue(undefined);

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);

    expect(mockPatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: '/redfish/v1/Systems/system',
        field: 'LocationIndicatorActive',
        value: true,
      }),
    );
  });

  it('calls patchResource with value false when LED is disabled', async () => {
    mockPatchResource.mockResolvedValue(undefined);

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(false);

    expect(mockPatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        value: false,
      }),
    );
  });

  it('isUpdating reflects usePatchResource isPending', () => {
    usePatchResource.mockReturnValue({
      patchResource: mockPatchResource,
      isPending: ref(true),
      isError: ref(false),
      error: ref(null),
    });

    const { isUpdating } = useUpdateIdentifyLed();
    expect(isUpdating.value).toBe(true);
  });

  // ── onSuccess callback ────────────────────────────────────────────────────────

  it('onSuccess calls successToast with enable message and updates cache when LED is on', async () => {
    // Capture the options passed to patchResource so we can invoke onSuccess
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);

    // Invoke the captured onSuccess callback
    capturedOptions.onSuccess();

    expect(mockSuccessToast).toHaveBeenCalledWith(
      'pageInventory.toast.successEnableIdentifyLed',
    );
    expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
      ['redfish', 'overview', 'inventory'],
      expect.any(Function),
    );
  });

  it('onSuccess calls successToast with disable message when LED is off', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(false);
    capturedOptions.onSuccess();

    expect(mockSuccessToast).toHaveBeenCalledWith(
      'pageInventory.toast.successDisableIdentifyLed',
    );
  });

  it('setQueryData updater merges locationIndicatorActive when old cache exists', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });
    // Capture the updater function passed to setQueryData
    let updaterFn;
    mockQueryClient.setQueryData.mockImplementation((key, fn) => {
      updaterFn = fn;
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);
    capturedOptions.onSuccess();

    const result = updaterFn({ locationIndicatorActive: false });
    expect(result).toEqual({ locationIndicatorActive: true });
  });

  it('setQueryData updater returns old value unchanged when cache is empty', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });
    let updaterFn;
    mockQueryClient.setQueryData.mockImplementation((key, fn) => {
      updaterFn = fn;
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);
    capturedOptions.onSuccess();

    expect(updaterFn(null)).toBeNull();
    expect(updaterFn(undefined)).toBeUndefined();
  });

  // ── onError callback ──────────────────────────────────────────────────────────

  it('onError calls errorToast with enable-error message when LED was being enabled', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);
    capturedOptions.onError(new Error('patch failed'));

    expect(mockErrorToast).toHaveBeenCalledWith(
      'pageInventory.toast.errorEnableIdentifyLed',
    );
  });

  it('onError calls errorToast with disable-error message when LED was being disabled', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(false);
    capturedOptions.onError(new Error('patch failed'));

    expect(mockErrorToast).toHaveBeenCalledWith(
      'pageInventory.toast.errorDisableIdentifyLed',
    );
  });

  it('invalidateQueries is passed with correct query keys', async () => {
    let capturedOptions;
    mockPatchResource.mockImplementation((opts) => {
      capturedOptions = opts;
      return Promise.resolve();
    });

    const { updateIdentifyLed } = useUpdateIdentifyLed();
    await updateIdentifyLed(true);

    expect(capturedOptions.invalidateQueries).toEqual([
      ['redfish', 'overview', 'inventory'],
      ['redfish', 'resource', '/redfish/v1/Systems/system'],
    ]);
  });
});
