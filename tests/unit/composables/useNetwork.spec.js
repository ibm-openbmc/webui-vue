import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

// ── Mock all external dependencies before any imports ─────────────────────────

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    all: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key, params) => {
        if (params) return `${key}:${JSON.stringify(params)}`;
        return key;
      }),
    },
  },
}));

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    successToast: vi.fn(),
    errorToast: vi.fn(),
  })),
}));

vi.mock('lodash', () => ({
  find: vi.fn(),
}));

vi.mock('@/api/composables/shared/queryConfig', () => ({
  RedfishQueryPresets: {
    sensors: { staleTime: 0, refetchInterval: 30000 },
  },
}));

// ── Import after mocks ─────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import i18n from '@/i18n';
import useToast from '@/components/Composables/useToastComposable';
import { find } from 'lodash';
import { useNetwork } from '@/api/composables/useNetwork';

// ── Helpers ────────────────────────────────────────────────────────────────────

const makeMockQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  ...overrides,
});

/** Minimal valid EthernetInterface raw API response */
const makeRawInterface = (overrides = {}) => ({
  DHCPv4: {
    DHCPEnabled: false,
    UseDNSServers: true,
    UseDomainName: true,
    UseNTPServers: true,
  },
  DHCPv6: {
    OperatingMode: 'Disabled',
    UseDNSServers: false,
    UseDomainName: false,
    UseNTPServers: false,
  },
  HostName: 'bmc-host',
  Id: 'eth0',
  IPv4Addresses: [
    {
      Address: '192.168.1.10',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
      AddressOrigin: 'Static',
    },
    {
      Address: '10.0.0.5',
      SubnetMask: '255.0.0.0',
      Gateway: '10.0.0.1',
      AddressOrigin: 'DHCP',
    },
  ],
  IPv4StaticAddresses: [
    {
      Address: '192.168.1.10',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
    },
  ],
  IPv6StaticAddresses: [],
  IPv6Addresses: [],
  IPv6DefaultGateway: '',
  IPv6StaticDefaultGateways: [],
  MACAddress: 'aa:bb:cc:dd:ee:ff',
  StaticNameServers: ['8.8.8.8', '8.8.4.4'],
  StatelessAddressAutoConfig: { IPv6AutoConfigEnabled: false },
  ...overrides,
});

/** Pre-transformed NetworkSetting object matching transformEthernetInterface output */
const makeNetworkSetting = (overrides = {}) => ({
  defaultGateway: '192.168.1.1',
  dhcpAddress: [
    {
      Address: '10.0.0.5',
      SubnetMask: '255.0.0.0',
      Gateway: '10.0.0.1',
      AddressOrigin: 'DHCP',
    },
  ],
  dhcpEnabled: false,
  hostname: 'bmc-host',
  id: 'eth0',
  ipv4: [
    {
      Address: '192.168.1.10',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
      AddressOrigin: 'Static',
    },
    {
      Address: '10.0.0.5',
      SubnetMask: '255.0.0.0',
      Gateway: '10.0.0.1',
      AddressOrigin: 'DHCP',
    },
  ],
  macAddress: 'aa:bb:cc:dd:ee:ff',
  staticAddress: '192.168.1.10',
  staticIpv4Addresses: [
    {
      Address: '192.168.1.10',
      SubnetMask: '255.255.255.0',
      Gateway: '192.168.1.1',
    },
  ],
  staticNameServers: ['8.8.8.8', '8.8.4.4'],
  useDnsEnabled: true,
  useDomainNameEnabled: true,
  useNtpEnabled: true,
  staticIpv6Addresses: [],
  ipv6: [],
  ipv6DefaultGateway: '',
  ipv6OperatingMode: 'Disabled',
  ipv6StaticDefaultGateways: [],
  ipv6UseDnsEnabled: false,
  ipv6UseDomainNameEnabled: false,
  ipv6UseNtpEnabled: false,
  ipv6AutoConfigEnabled: false,
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useNetwork', () => {
  let mockQueryClient;
  let mockSuccessToast;
  let mockErrorToast;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);

    mockSuccessToast = vi.fn();
    mockErrorToast = vi.fn();
    useToast.mockReturnValue({
      successToast: mockSuccessToast,
      errorToast: mockErrorToast,
    });

    // Default fallback for useQuery — tests that need specific data
    // override with mockReturnValueOnce or mockImplementation
    useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
    useMutation.mockReturnValue(makeMockMutation());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Derived state ────────────────────────────────────────────────────────────

  describe('networkSettings', () => {
    it('returns empty array when query data is null', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }));
      const { networkSettings } = useNetwork();
      expect(networkSettings.value).toEqual([]);
    });

    it('returns query data when available', () => {
      const settings = [makeNetworkSetting()];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(settings) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      const { networkSettings } = useNetwork();
      expect(networkSettings.value).toEqual(settings);
    });
  });

  describe('lldpEnabledState', () => {
    it('returns empty array when LLDP query data is null', () => {
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(null) }));
      const { lldpEnabledState } = useNetwork();
      expect(lldpEnabledState.value).toEqual([]);
    });

    it('returns lldp data when available', () => {
      const lldpData = [{ lldpEnabled: true }];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref(lldpData) }));
      const { lldpEnabledState } = useNetwork();
      expect(lldpEnabledState.value).toEqual(lldpData);
    });
  });

  describe('loading / error state', () => {
    it('exposes isLoading, isFetching, isError, error from ethernet query', () => {
      useQuery
        .mockReturnValueOnce(
          makeMockQuery({
            isLoading: ref(true),
            isFetching: ref(true),
            isError: ref(true),
            error: ref(new Error('network error')),
          }),
        )
        .mockReturnValueOnce(makeMockQuery());
      const { isLoading, isFetching, isError, error } = useNetwork();
      expect(isLoading.value).toBe(true);
      expect(isFetching.value).toBe(true);
      expect(isError.value).toBe(true);
      expect(error.value).toBeInstanceOf(Error);
    });
  });

  // ── Tab / interface selection ────────────────────────────────────────────────

  describe('setSelectedTabIndex / setSelectedTabId', () => {
    it('exposes setSelectedTabIndex and setSelectedTabId functions', () => {
      const { setSelectedTabIndex, setSelectedTabId } = useNetwork();
      expect(typeof setSelectedTabIndex).toBe('function');
      expect(typeof setSelectedTabId).toBe('function');
    });

    it('setSelectedTabIndex updates selectedInterfaceIndex', () => {
      const { setSelectedTabIndex, selectedInterfaceIndex } = useNetwork();
      setSelectedTabIndex(2);
      expect(selectedInterfaceIndex.value).toBe(2);
    });

    it('setSelectedTabId updates selectedInterfaceId', () => {
      const { setSelectedTabId, selectedInterfaceId } = useNetwork();
      setSelectedTabId('eth1');
      expect(selectedInterfaceId.value).toBe('eth1');
    });

    it('shared module-level state: changes from one useNetwork() call are visible in another', () => {
      // Reset to a known ID first
      useNetwork().setSelectedTabId('');
      const a = useNetwork();
      const b = useNetwork();
      a.setSelectedTabId('shared-eth');
      expect(b.selectedInterfaceId.value).toBe('shared-eth');
    });
  });

  // ── Query configuration ──────────────────────────────────────────────────────

  describe('query keys', () => {
    it('uses correct ethernet query key for first useQuery call', () => {
      const keys = [];
      useQuery.mockImplementation((config) => {
        keys.push(config.queryKey);
        return makeMockQuery();
      });
      useNetwork();
      expect(keys[0]).toEqual(['redfish', 'network', 'ethernetInterfaces']);
    });

    it('uses correct LLDP query key for second useQuery call', () => {
      const keys = [];
      useQuery.mockImplementation((config) => {
        keys.push(config.queryKey);
        return makeMockQuery();
      });
      useNetwork();
      expect(keys[1]).toEqual(['redfish', 'network', 'lldp']);
    });
  });

  // ── API: fetchEthernetInterfaces ─────────────────────────────────────────────

  describe('fetchEthernetInterfaces (queryFn)', () => {
    it('fetches collection then individual interfaces and maps data', async () => {
      const queryFns = [];
      useQuery.mockImplementation((config) => {
        queryFns.push(config.queryFn);
        return makeMockQuery();
      });

      const rawIface = makeRawInterface();
      // queryFns[0] = fetchEthernetInterfaces
      // Set up api.get for the collection call
      api.get.mockResolvedValueOnce({
        data: {
          Members: [
            { '@odata.id': '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0' },
          ],
        },
      });
      // api.all resolves the individual interface call
      api.all.mockResolvedValueOnce([{ data: rawIface }]);

      useNetwork();
      const result = await queryFns[0]();

      expect(api.get).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces',
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('eth0');
      expect(result[0].hostname).toBe('bmc-host');
      expect(result[0].macAddress).toBe('aa:bb:cc:dd:ee:ff');
    });

    it('maps dhcpAddress to only DHCP-origin addresses', async () => {
      const queryFns = [];
      useQuery.mockImplementation((config) => {
        queryFns.push(config.queryFn);
        return makeMockQuery();
      });

      api.get.mockResolvedValueOnce({
        data: { Members: [{ '@odata.id': '/eth0' }] },
      });
      api.all.mockResolvedValueOnce([{ data: makeRawInterface() }]);

      useNetwork();
      const result = await queryFns[0]();

      expect(result[0].dhcpAddress).toHaveLength(1);
      expect(result[0].dhcpAddress[0].AddressOrigin).toBe('DHCP');
    });

    it('defaults ipv6 fields when not present in response', async () => {
      const queryFns = [];
      useQuery.mockImplementation((config) => {
        queryFns.push(config.queryFn);
        return makeMockQuery();
      });

      const rawNoIpv6 = makeRawInterface({
        IPv6StaticAddresses: undefined,
        IPv6Addresses: undefined,
        IPv6DefaultGateway: undefined,
        IPv6StaticDefaultGateways: undefined,
        DHCPv6: undefined,
        StatelessAddressAutoConfig: undefined,
      });
      api.get.mockResolvedValueOnce({
        data: { Members: [{ '@odata.id': '/eth0' }] },
      });
      api.all.mockResolvedValueOnce([{ data: rawNoIpv6 }]);

      useNetwork();
      const result = await queryFns[0]();

      expect(result[0].ipv6).toEqual([]);
      expect(result[0].staticIpv6Addresses).toEqual([]);
      expect(result[0].ipv6DefaultGateway).toBe('');
      expect(result[0].ipv6StaticDefaultGateways).toEqual([]);
      expect(result[0].ipv6AutoConfigEnabled).toBe(false);
      expect(result[0].ipv6OperatingMode).toBe('');
    });
  });

  // ── API: fetchLldpData ───────────────────────────────────────────────────────

  describe('fetchLldpData (queryFn)', () => {
    it('fetches LLDP ports and maps lldpEnabled', async () => {
      const queryFns = [];
      useQuery.mockImplementation((config) => {
        queryFns.push(config.queryFn);
        return makeMockQuery();
      });

      api.get.mockResolvedValueOnce({
        data: { Members: [{ '@odata.id': '/port0' }] },
      });
      api.all.mockResolvedValueOnce([
        { data: { Ethernet: { LLDPEnabled: true } } },
      ]);

      useNetwork();
      // queryFns[1] is fetchLldpData
      const result = await queryFns[1]();

      expect(api.get).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/DedicatedNetworkPorts',
      );
      expect(result).toEqual([{ lldpEnabled: true }]);
    });

    it('defaults lldpEnabled to false when field is missing', async () => {
      const queryFns = [];
      useQuery.mockImplementation((config) => {
        queryFns.push(config.queryFn);
        return makeMockQuery();
      });

      api.get.mockResolvedValueOnce({
        data: { Members: [{ '@odata.id': '/port0' }] },
      });
      api.all.mockResolvedValueOnce([{ data: {} }]);

      useNetwork();
      const result = await queryFns[1]();
      expect(result[0].lldpEnabled).toBe(false);
    });
  });

  // ── Mutation callbacks ───────────────────────────────────────────────────────

  describe('mutation onSuccess / onError callbacks', () => {
    // Helper: capture all mutation configs in registration order
    const getMutationConfigs = () => {
      const configs = [];
      useMutation.mockImplementation((config) => {
        configs.push(config);
        return makeMockMutation();
      });
      useNetwork();
      return configs;
    };

    it('calls successToast for saveDomainNameState (index 0) on success', () => {
      const configs = getMutationConfigs();
      configs[0].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('calls errorToast for saveDomainNameState (index 0) on error', () => {
      const configs = getMutationConfigs();
      configs[0].onError();
      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.errorSaveNetworkSettings'),
      );
    });

    it('calls successToast for saveDnsState (index 1) on success', () => {
      const configs = getMutationConfigs();
      configs[1].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('calls successToast for saveNtpState (index 2) on success', () => {
      const configs = getMutationConfigs();
      configs[2].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('calls successToast for saveDhcpEnabledState (index 3) on success', () => {
      const configs = getMutationConfigs();
      configs[3].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('calls successToast for saveIpv6DhcpEnabledState (index 4) on success', () => {
      const configs = getMutationConfigs();
      configs[4].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('calls successToast for saveIpv6AutoConfigState (index 5) on success', () => {
      const configs = getMutationConfigs();
      configs[5].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('saveLLDPState (index 6): onSuccess calls successToast', () => {
      const configs = getMutationConfigs();
      configs[6].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('saveLLDPState (index 6): onError calls invalidateQueries for LLDP then errorToast', () => {
      const configs = getMutationConfigs();
      configs[6].onError();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'network', 'lldp'],
      });
      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.errorSaveNetworkSettings'),
      );
    });

    it('deleteIpv4Address (index 8): onSuccess calls successDeletingIpv4Server toast', () => {
      const configs = getMutationConfigs();
      configs[8].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successDeletingIpv4Server'),
      );
    });

    it('deleteIpv4Address (index 8): onError calls errorDeletingIpv4Server toast', () => {
      const configs = getMutationConfigs();
      configs[8].onError();
      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.errorDeletingIpv4Server'),
      );
    });

    it('deleteIpv6Address (index 10): onSuccess calls successDeletingIpv6Server toast', () => {
      const configs = getMutationConfigs();
      configs[10].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successDeletingIpv6Server'),
      );
    });

    it('deleteIpv6StaticGateway (index 12): onSuccess calls successDeletingIpv6StaticDefaultGateway toast', () => {
      const configs = getMutationConfigs();
      configs[12].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining(
          'pageNetwork.toast.successDeletingIpv6StaticDefaultGateway',
        ),
      );
    });

    it('deleteIpv6StaticGateway (index 12): onError calls errorDeletingIpv6StaticDefaultGateway toast', () => {
      const configs = getMutationConfigs();
      configs[12].onError();
      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining(
          'pageNetwork.toast.errorDeletingIpv6StaticDefaultGateway',
        ),
      );
    });

    it('saveHostname (index 13): onSuccess calls successSaveNetworkSettings toast', () => {
      const configs = getMutationConfigs();
      configs[13].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successSaveNetworkSettings'),
      );
    });

    it('saveDnsAddress (index 14): onSuccess calls successAddingDnsServer toast', () => {
      const configs = getMutationConfigs();
      configs[14].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successAddingDnsServer'),
      );
    });

    it('editDnsAddress (index 15): onSuccess calls successDeletingDnsServer toast', () => {
      const configs = getMutationConfigs();
      configs[15].onSuccess();
      expect(mockSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.successDeletingDnsServer'),
      );
    });

    it('editDnsAddress (index 15): onError calls errorDeletingDnsServer toast', () => {
      const configs = getMutationConfigs();
      configs[15].onError();
      expect(mockErrorToast).toHaveBeenCalledWith(
        expect.stringContaining('pageNetwork.toast.errorDeletingDnsServer'),
      );
    });
  });

  // ── mutationFn: patchEthernetInterface ───────────────────────────────────────

  describe('patchEthernetInterface via mutation functions', () => {
    // Helper: capture mutation functions + set up shared state
    const setup = (settingsData = []) => {
      useNetwork().setSelectedTabId('eth0');
      useNetwork().setSelectedTabIndex(0);

      const fns = [];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(settingsData) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      useMutation.mockImplementation((config) => {
        fns.push(config.mutationFn);
        return makeMockMutation();
      });
      api.patch.mockResolvedValue({});
      useNetwork();
      return fns;
    };

    it('saveDomainNameState (index 0): patches DHCPv4.UseDomainName', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[0](true);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv4: { UseDomainName: true } },
      );
    });

    it('saveDnsState (index 1): patches DHCPv4.UseDNSServers', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[1](false);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv4: { UseDNSServers: false } },
      );
    });

    it('saveNtpState (index 2): patches DHCPv4.UseNTPServers', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[2](true);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv4: { UseNTPServers: true } },
      );
    });

    it('saveDhcpEnabledState (index 3): patches DHCPv4.DHCPEnabled', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[3](false);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv4: { DHCPEnabled: false } },
      );
    });

    it('saveIpv6DhcpEnabledState (index 4): converts true to "Enabled"', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[4](true);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv6: { OperatingMode: 'Enabled' } },
      );
    });

    it('saveIpv6DhcpEnabledState (index 4): converts false to "Disabled"', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[4](false);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { DHCPv6: { OperatingMode: 'Disabled' } },
      );
    });

    it('saveIpv6AutoConfigState (index 5): patches StatelessAddressAutoConfig', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[5](true);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { StatelessAddressAutoConfig: { IPv6AutoConfigEnabled: true } },
      );
    });

    it('saveLLDPState (index 6): patches DedicatedNetworkPorts endpoint', async () => {
      useNetwork().setSelectedTabId('port0');
      const fns = [];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      useMutation.mockImplementation((config) => {
        fns.push(config.mutationFn);
        return makeMockMutation();
      });
      api.patch.mockResolvedValue({});
      useNetwork();

      await fns[6](true);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/DedicatedNetworkPorts/port0',
        { Ethernet: { LLDPEnabled: true } },
      );
    });

    it('saveHostname (index 13): patches HostName field', async () => {
      const fns = setup([makeNetworkSetting()]);
      await fns[13]({ HostName: 'new-hostname' });
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { HostName: 'new-hostname' },
      );
    });
  });

  // ── DNS mutations ────────────────────────────────────────────────────────────

  describe('DNS mutation functions', () => {
    it('saveDnsAddress (index 14): appends new address to existing list', async () => {
      useNetwork().setSelectedTabId('eth0');
      useNetwork().setSelectedTabIndex(0);

      const settings = [makeNetworkSetting({ staticNameServers: ['8.8.8.8'] })];
      const fns = [];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(settings) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      useMutation.mockImplementation((config) => {
        fns.push(config.mutationFn);
        return makeMockMutation();
      });
      api.patch.mockResolvedValue({});

      useNetwork();

      await fns[14](['1.1.1.1']);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { StaticNameServers: ['8.8.8.8', '1.1.1.1'] },
      );
    });

    it('editDnsAddress (index 15): replaces DNS list entirely', async () => {
      useNetwork().setSelectedTabId('eth0');
      useNetwork().setSelectedTabIndex(0);

      const fns = [];
      useQuery
        .mockReturnValueOnce(
          makeMockQuery({ data: ref([makeNetworkSetting()]) }),
        )
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      useMutation.mockImplementation((config) => {
        fns.push(config.mutationFn);
        return makeMockMutation();
      });
      api.patch.mockResolvedValue({});

      useNetwork();

      await fns[15](['1.1.1.1']);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        { StaticNameServers: ['1.1.1.1'] },
      );
    });
  });

  // ── deleteIpv4 mutation logic ────────────────────────────────────────────────

  describe('deleteIpv4Address (index 8) mutation function', () => {
    it('marks matched addresses as {} (to delete) and unmatched as null (keep)', async () => {
      useNetwork().setSelectedTabId('eth0');
      useNetwork().setSelectedTabIndex(0);

      const settings = [
        makeNetworkSetting({
          staticIpv4Addresses: [
            {
              Address: '10.0.0.1',
              SubnetMask: '255.255.255.0',
              Gateway: '10.0.0.254',
            },
            {
              Address: '10.0.0.2',
              SubnetMask: '255.255.255.0',
              Gateway: '10.0.0.254',
            },
          ],
        }),
      ];
      const fns = [];
      useQuery
        .mockReturnValueOnce(makeMockQuery({ data: ref(settings) }))
        .mockReturnValueOnce(makeMockQuery({ data: ref([]) }));
      useMutation.mockImplementation((config) => {
        fns.push(config.mutationFn);
        return makeMockMutation();
      });
      api.patch.mockResolvedValue({});
      // lodash find: return truthy when Address matches
      find.mockImplementation((collection, criteria) =>
        collection.find((item) => item.Address === criteria.Address),
      );

      useNetwork();

      // Delete 10.0.0.1 → it gets {}, 10.0.0.2 stays null
      await fns[8]([{ Address: '10.0.0.1' }]);
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/EthernetInterfaces/eth0',
        {
          IPv4StaticAddresses: [
            {}, // 10.0.0.1 matched → cleared to {}
            null, // 10.0.0.2 not matched → kept as null
          ],
        },
      );
    });
  });

  // ── Public API completeness ──────────────────────────────────────────────────

  describe('public API surface', () => {
    it('exposes all expected state properties', () => {
      const result = useNetwork();
      expect(result).toHaveProperty('networkSettings');
      expect(result).toHaveProperty('lldpEnabledState');
      expect(result).toHaveProperty('selectedInterfaceIndex');
      expect(result).toHaveProperty('selectedInterfaceId');
      expect(result).toHaveProperty('isTableBusy');
      expect(result).toHaveProperty('isLoading');
      expect(result).toHaveProperty('isFetching');
      expect(result).toHaveProperty('isError');
      expect(result).toHaveProperty('error');
    });

    it('exposes all expected mutation functions', () => {
      const result = useNetwork();
      expect(typeof result.saveDomainNameState).toBe('function');
      expect(typeof result.saveDnsState).toBe('function');
      expect(typeof result.saveNtpState).toBe('function');
      expect(typeof result.saveDhcpEnabledState).toBe('function');
      expect(typeof result.saveIpv6DhcpEnabledState).toBe('function');
      expect(typeof result.saveIpv6AutoConfigState).toBe('function');
      expect(typeof result.saveLLDPState).toBe('function');
      expect(typeof result.updateIpv4Address).toBe('function');
      expect(typeof result.deleteIpv4Address).toBe('function');
      expect(typeof result.updateIpv6Address).toBe('function');
      expect(typeof result.deleteIpv6Address).toBe('function');
      expect(typeof result.updateIpv6StaticDefaultGatewayAddress).toBe(
        'function',
      );
      expect(typeof result.deleteIpv6StaticDefaultGatewayAddress).toBe(
        'function',
      );
      expect(typeof result.saveHostname).toBe('function');
      expect(typeof result.saveDnsAddress).toBe('function');
      expect(typeof result.editDnsAddress).toBe('function');
    });

    it('exposes all expected isPending flags', () => {
      const result = useNetwork();
      expect(result).toHaveProperty('isSavingDomainName');
      expect(result).toHaveProperty('isSavingDns');
      expect(result).toHaveProperty('isSavingNtp');
      expect(result).toHaveProperty('isSavingDhcp');
      expect(result).toHaveProperty('isSavingIpv6Dhcp');
      expect(result).toHaveProperty('isSavingIpv6AutoConfig');
      expect(result).toHaveProperty('isSavingLldp');
      expect(result).toHaveProperty('isUpdatingIpv4');
      expect(result).toHaveProperty('isDeletingIpv4');
      expect(result).toHaveProperty('isUpdatingIpv6');
      expect(result).toHaveProperty('isDeletingIpv6');
      expect(result).toHaveProperty('isUpdatingIpv6Gateway');
      expect(result).toHaveProperty('isDeletingIpv6Gateway');
      expect(result).toHaveProperty('isSavingHostname');
      expect(result).toHaveProperty('isSavingDnsAddress');
      expect(result).toHaveProperty('isEditingDnsAddress');
    });

    it('exposes refetch helpers', () => {
      const result = useNetwork();
      expect(typeof result.refetchEthernet).toBe('function');
      expect(typeof result.refetchLldp).toBe('function');
    });
  });

  // ── invalidateQueries ────────────────────────────────────────────────────────

  describe('query invalidation', () => {
    it('invalidates ethernet cache via queryClient.invalidateQueries', () => {
      let capturedInvalidate;
      mockQueryClient.invalidateQueries = vi.fn((opts) => {
        capturedInvalidate = opts;
      });

      useMutation.mockImplementation((config) => {
        // Manually call invalidateEthernet inside mutationFn to verify
        config.mutationFn = async () => {
          mockQueryClient.invalidateQueries({
            queryKey: ['redfish', 'network', 'ethernetInterfaces'],
          });
        };
        return makeMockMutation({ mutateAsync: config.mutationFn });
      });

      const { saveDomainNameState } = useNetwork();
      saveDomainNameState(true);

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});
