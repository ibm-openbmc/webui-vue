import { computed, ref } from 'vue';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import { find } from 'lodash';
import { RedfishQueryPresets } from './shared/queryConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EthernetInterfaceRaw {
  DHCPv4: {
    DHCPEnabled: boolean;
    UseDNSServers: boolean;
    UseDomainName: boolean;
    UseNTPServers: boolean;
  };
  DHCPv6?: {
    OperatingMode?: string;
    UseDNSServers?: boolean;
    UseDomainName?: boolean;
    UseNTPServers?: boolean;
  };
  HostName: string;
  Id: string;
  IPv4Addresses: Ipv4Address[];
  IPv4StaticAddresses: Ipv4StaticAddress[];
  IPv6StaticAddresses?: Ipv6Address[];
  IPv6Addresses?: Ipv6Address[];
  IPv6DefaultGateway?: string;
  IPv6StaticDefaultGateways?: Ipv6StaticGateway[];
  MACAddress: string;
  StaticNameServers: string[];
  StatelessAddressAutoConfig?: {
    IPv6AutoConfigEnabled?: boolean;
  };
}

export interface Ipv4Address {
  Address: string;
  SubnetMask: string;
  Gateway: string;
  AddressOrigin: string;
}

export interface Ipv4StaticAddress {
  Address?: string;
  SubnetMask?: string;
  Gateway?: string;
}

export interface Ipv6Address {
  Address: string;
  PrefixLength: number;
  AddressOrigin: string;
}

export interface Ipv6StaticGateway {
  Address: string;
}

export interface NetworkSetting {
  defaultGateway: string | undefined;
  dhcpAddress: Ipv4Address[];
  dhcpEnabled: boolean;
  hostname: string;
  id: string;
  ipv4: Ipv4Address[];
  macAddress: string;
  staticAddress: string | undefined;
  staticIpv4Addresses: Ipv4StaticAddress[];
  staticNameServers: string[];
  useDnsEnabled: boolean;
  useDomainNameEnabled: boolean;
  useNtpEnabled: boolean;
  staticIpv6Addresses: Ipv6Address[];
  ipv6: Ipv6Address[];
  ipv6DefaultGateway: string;
  ipv6OperatingMode: string;
  ipv6StaticDefaultGateways: Ipv6StaticGateway[];
  ipv6UseDnsEnabled: boolean;
  ipv6UseDomainNameEnabled: boolean;
  ipv6UseNtpEnabled: boolean;
  ipv6AutoConfigEnabled: boolean;
}

export interface LldpState {
  lldpEnabled: boolean;
}

const ETHERNET_INTERFACES_URL = '/redfish/v1/Managers/bmc/EthernetInterfaces';
const DEDICATED_NETWORK_PORTS_URL =
  '/redfish/v1/Managers/bmc/DedicatedNetworkPorts';

const QUERY_KEY_ETHERNET = [
  'redfish',
  'network',
  'ethernetInterfaces',
] as const;
const QUERY_KEY_LLDP = ['redfish', 'network', 'lldp'] as const;

function transformEthernetInterface(
  data: EthernetInterfaceRaw,
): NetworkSetting {
  const {
    DHCPv4,
    DHCPv6,
    HostName,
    Id,
    IPv4Addresses,
    IPv4StaticAddresses,
    IPv6StaticAddresses,
    IPv6Addresses,
    IPv6DefaultGateway,
    IPv6StaticDefaultGateways,
    MACAddress,
    StaticNameServers,
    StatelessAddressAutoConfig,
  } = data;
  return {
    defaultGateway: IPv4StaticAddresses[0]?.Gateway,
    dhcpAddress: IPv4Addresses.filter((ipv4) => ipv4.AddressOrigin === 'DHCP'),
    dhcpEnabled: DHCPv4.DHCPEnabled,
    hostname: HostName,
    id: Id,
    ipv4: IPv4Addresses,
    macAddress: MACAddress,
    staticAddress: IPv4StaticAddresses[0]?.Address,
    staticIpv4Addresses: IPv4StaticAddresses,
    staticNameServers: StaticNameServers,
    useDnsEnabled: DHCPv4.UseDNSServers,
    useDomainNameEnabled: DHCPv4.UseDomainName,
    useNtpEnabled: DHCPv4.UseNTPServers,
    staticIpv6Addresses: IPv6StaticAddresses ?? [],
    ipv6: IPv6Addresses ?? [],
    ipv6DefaultGateway: IPv6DefaultGateway ?? '',
    ipv6OperatingMode: DHCPv6?.OperatingMode ?? '',
    ipv6StaticDefaultGateways: IPv6StaticDefaultGateways ?? [],
    ipv6UseDnsEnabled: DHCPv6?.UseDNSServers ?? false,
    ipv6UseDomainNameEnabled: DHCPv6?.UseDomainName ?? false,
    ipv6UseNtpEnabled: DHCPv6?.UseNTPServers ?? false,
    ipv6AutoConfigEnabled:
      StatelessAddressAutoConfig?.IPv6AutoConfigEnabled ?? false,
  };
}

async function fetchEthernetInterfaces(): Promise<NetworkSetting[]> {
  const response = await api.get(ETHERNET_INTERFACES_URL);
  const ids: string[] = response.data.Members.map(
    (m: { '@odata.id': string }) => m['@odata.id'],
  );
  const responses = await api.all(ids.map((id) => api.get(id)));
  return responses.map((r: { data: EthernetInterfaceRaw }) =>
    transformEthernetInterface(r.data),
  );
}

async function fetchLldpData(): Promise<LldpState[]> {
  const response = await api.get(DEDICATED_NETWORK_PORTS_URL);
  const ids: string[] = response.data.Members.map(
    (m: { '@odata.id': string }) => m['@odata.id'],
  );
  const responses = await api.all(ids.map((id) => api.get(id)));
  return responses.map(
    (r: { data: { Ethernet: { LLDPEnabled: boolean } } }) => ({
      lldpEnabled: r.data?.Ethernet?.LLDPEnabled ?? false,
    }),
  );
}

// ── Module-level shared state ─────────────────────────────────────────────────
// These must live outside useNetwork() so every component calling useNetwork()
// shares the same selectedInterfaceIndex / selectedInterfaceId values.
const selectedInterfaceIndex = ref<number>(0);
const selectedInterfaceId = ref<string>('');
const isTableBusy = ref<boolean>(false);

/**
 * Composable for fetching and updating Network settings.
 * Replaces NetworkStore with TanStack Query.
 */
export function useNetwork() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  // ── Queries ─────────────────────────────────────────────────────────────────

  const {
    data: ethernetData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: refetchEthernet,
  } = useQuery<NetworkSetting[]>({
    queryKey: QUERY_KEY_ETHERNET,
    queryFn: fetchEthernetInterfaces,
    ...(RedfishQueryPresets.network as Partial<
      UseQueryOptions<NetworkSetting[]>
    >),
  });

  const { data: lldpData, refetch: refetchLldp } = useQuery<LldpState[]>({
    queryKey: QUERY_KEY_LLDP,
    queryFn: fetchLldpData,
    ...(RedfishQueryPresets.network as Partial<UseQueryOptions<LldpState[]>>),
  });

  // ── Derived computed ─────────────────────────────────────────────────────────

  const networkSettings = computed<NetworkSetting[]>(
    () => ethernetData.value ?? [],
  );

  const lldpEnabledState = computed<LldpState[]>(() => lldpData.value ?? []);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function setSelectedTabIndex(index: number): void {
    selectedInterfaceIndex.value = index;
  }

  function setSelectedTabId(id: string): void {
    selectedInterfaceId.value = id;
  }

  function invalidateEthernet(): void {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY_ETHERNET });
  }

  function invalidateLldp(): void {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY_LLDP });
  }

  /**
   * After a mutation that requires a BMC-side delay, mark tables busy and
   * then re-fetch after the usual 10 s / 15 s windows.
   */
  function refetchAfterDelay(): void {
    isTableBusy.value = true;
    setTimeout(() => {
      invalidateEthernet();
    }, 10000);
    setTimeout(() => {
      isTableBusy.value = false;
    }, 15000);
  }

  // ── Patch helper ─────────────────────────────────────────────────────────────

  async function patchEthernetInterface(
    payload: Record<string, unknown>,
  ): Promise<void> {
    // selectedInterfaceId is only set on tab click; fall back to the id of the
    // currently selected interface so tab-0 operations work on first load.
    const id =
      selectedInterfaceId.value ||
      networkSettings.value[selectedInterfaceIndex.value]?.id ||
      '';
    await api.patch(`${ETHERNET_INTERFACES_URL}/${id}`, payload);
  }

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const saveDomainNameMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      await patchEthernetInterface({ DHCPv4: { UseDomainName: state } });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.domainName'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.domainName'),
        }),
      );
    },
  });

  const saveDnsMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      await patchEthernetInterface({ DHCPv4: { UseDNSServers: state } });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dns'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dns'),
        }),
      );
    },
  });

  const saveNtpMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      await patchEthernetInterface({ DHCPv4: { UseNTPServers: state } });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ntp'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ntp'),
        }),
      );
    },
  });

  const saveDhcpMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      await patchEthernetInterface({ DHCPv4: { DHCPEnabled: state } });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
    },
  });

  const saveIpv6DhcpMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      const updatedDhcpState = state ? 'Enabled' : 'Disabled';
      await patchEthernetInterface({
        DHCPv6: { OperatingMode: updatedDhcpState },
      });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
    },
  });

  const saveIpv6AutoConfigMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      await patchEthernetInterface({
        StatelessAddressAutoConfig: { IPv6AutoConfigEnabled: state },
      });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
        }),
      );
    },
  });

  const saveLldpMutation = useMutation({
    mutationFn: async (state: boolean): Promise<void> => {
      const id =
        selectedInterfaceId.value ||
        networkSettings.value[selectedInterfaceIndex.value]?.id ||
        '';
      await api.patch(`${DEDICATED_NETWORK_PORTS_URL}/${id}`, {
        Ethernet: { LLDPEnabled: state },
      });
      invalidateLldp();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.lldp'),
        }),
      );
    },
    onError: () => {
      invalidateLldp();
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.lldp'),
        }),
      );
    },
  });

  const updateIpv4Mutation = useMutation({
    mutationFn: async (
      newIpv4Address: Array<Partial<Ipv4Address & { Subnet: string }>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddresses = iface.staticIpv4Addresses;
      const updatedIpv4 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv4Address, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });
      const filteredAddress = newIpv4Address.filter(
        (item) => (item as any).Subnet !== '',
      );
      await patchEthernetInterface({
        IPv4StaticAddresses: [...updatedIpv4, ...filteredAddress],
      });
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv4'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv4'),
        }),
      );
    },
  });

  const deleteIpv4Mutation = useMutation({
    mutationFn: async (
      updatedIpv4Array: Array<Partial<Ipv4StaticAddress>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddressArray = iface.staticIpv4Addresses;
      const newIpv4Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv4Array, { Address: address })) {
          return {};
        } else {
          return null;
        }
      });
      await patchEthernetInterface({ IPv4StaticAddresses: newIpv4Array });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successDeletingIpv4Server'),
      );
    },
    onError: () => {
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingIpv4Server'));
    },
  });

  const updateIpv6Mutation = useMutation({
    mutationFn: async (
      newIpv6Address: Array<Partial<Ipv6Address>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddresses = iface.staticIpv6Addresses;
      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv6Address, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });
      const filteredAddress = newIpv6Address.filter(
        (item) => (item as any).PrefixLength !== 0,
      );
      await patchEthernetInterface({
        IPv6StaticAddresses: [...updatedIpv6, ...filteredAddress],
      });
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6'),
        }),
      );
    },
  });

  const deleteIpv6Mutation = useMutation({
    mutationFn: async (
      updatedIpv6Array: Array<Partial<Ipv6Address>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddressArray = iface.staticIpv6Addresses;
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv6Array, { Address: address })) {
          return {};
        } else {
          return null;
        }
      });
      await patchEthernetInterface({ IPv6StaticAddresses: newIpv6Array });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successDeletingIpv6Server'),
      );
    },
    onError: () => {
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingIpv6Server'));
    },
  });

  const updateIpv6StaticGatewayMutation = useMutation({
    mutationFn: async (
      newAddresses: Array<Partial<Ipv6StaticGateway>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddresses = iface.ipv6StaticDefaultGateways;
      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newAddresses, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });
      const filteredAddress = [newAddresses[0]];
      await patchEthernetInterface({
        IPv6StaticDefaultGateways: [...updatedIpv6, ...filteredAddress],
      });
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
        }),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
        }),
      );
    },
  });

  const deleteIpv6StaticGatewayMutation = useMutation({
    mutationFn: async (
      updatedArray: Array<Partial<Ipv6StaticGateway>>,
    ): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddressArray = iface.ipv6StaticDefaultGateways;
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedArray, { Address: address })) {
          return {};
        } else {
          return null;
        }
      });
      await patchEthernetInterface({
        IPv6StaticDefaultGateways: newIpv6Array,
      });
      invalidateEthernet();
      refetchAfterDelay();
    },
    onSuccess: () => {
      successToast(
        i18n.global.t(
          'pageNetwork.toast.successDeletingIpv6StaticDefaultGateway',
        ),
      );
    },
    onError: () => {
      errorToast(
        i18n.global.t(
          'pageNetwork.toast.errorDeletingIpv6StaticDefaultGateway',
        ),
      );
    },
  });

  const saveHostnameMutation = useMutation({
    mutationFn: async (hostname: { HostName: string }): Promise<void> => {
      await patchEthernetInterface(hostname);
    },
    // No onSuccess toast — the view calls authenticationStore.logout() on
    // success, matching the original NetworkStore behaviour where hostname
    // save triggered an immediate logout rather than a toast.
    onError: () => {
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.network'),
        }),
      );
    },
  });

  const saveDnsAddressMutation = useMutation({
    mutationFn: async (newAddresses: string[]): Promise<void> => {
      const iface = networkSettings.value[selectedInterfaceIndex.value];
      const originalAddresses = iface.staticNameServers;
      const newDnsArray = originalAddresses.concat(newAddresses);
      await patchEthernetInterface({ StaticNameServers: newDnsArray });
      invalidateEthernet();
    },
    onSuccess: () => {
      successToast(i18n.global.t('pageNetwork.toast.successAddingDnsServer'));
    },
    onError: () => {
      errorToast(i18n.global.t('pageNetwork.toast.errorAddingDnsServer'));
    },
  });

  const editDnsAddressMutation = useMutation({
    mutationFn: async (dnsTableData: string[]): Promise<void> => {
      await patchEthernetInterface({ StaticNameServers: dnsTableData });
      invalidateEthernet();
    },
    onSuccess: () => {
      successToast(i18n.global.t('pageNetwork.toast.successDeletingDnsServer'));
    },
    onError: () => {
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingDnsServer'));
    },
  });

  // ── Public API ────────────────────────────────────────────────────────────────

  return {
    // State
    networkSettings,
    lldpEnabledState,
    selectedInterfaceIndex,
    selectedInterfaceId,
    isTableBusy,
    isLoading,
    isFetching,
    isError,
    error,

    // Tab helpers
    setSelectedTabIndex,
    setSelectedTabId,

    // Refetch
    refetchEthernet,
    refetchLldp,

    // Mutations (return Promise<void>; toasts are handled in onSuccess/onError)
    saveDomainNameState: saveDomainNameMutation.mutateAsync,
    saveDnsState: saveDnsMutation.mutateAsync,
    saveNtpState: saveNtpMutation.mutateAsync,
    saveDhcpEnabledState: saveDhcpMutation.mutateAsync,
    saveIpv6DhcpEnabledState: saveIpv6DhcpMutation.mutateAsync,
    saveIpv6AutoConfigState: saveIpv6AutoConfigMutation.mutateAsync,
    saveLLDPState: saveLldpMutation.mutateAsync,
    updateIpv4Address: updateIpv4Mutation.mutateAsync,
    deleteIpv4Address: deleteIpv4Mutation.mutateAsync,
    updateIpv6Address: updateIpv6Mutation.mutateAsync,
    deleteIpv6Address: deleteIpv6Mutation.mutateAsync,
    updateIpv6StaticDefaultGatewayAddress:
      updateIpv6StaticGatewayMutation.mutateAsync,
    deleteIpv6StaticDefaultGatewayAddress:
      deleteIpv6StaticGatewayMutation.mutateAsync,
    saveHostname: saveHostnameMutation.mutateAsync,
    saveDnsAddress: saveDnsAddressMutation.mutateAsync,
    editDnsAddress: editDnsAddressMutation.mutateAsync,

    // Mutation pending states
    isSavingDomainName: saveDomainNameMutation.isPending,
    isSavingDns: saveDnsMutation.isPending,
    isSavingNtp: saveNtpMutation.isPending,
    isSavingDhcp: saveDhcpMutation.isPending,
    isSavingIpv6Dhcp: saveIpv6DhcpMutation.isPending,
    isSavingIpv6AutoConfig: saveIpv6AutoConfigMutation.isPending,
    isSavingLldp: saveLldpMutation.isPending,
    isUpdatingIpv4: updateIpv4Mutation.isPending,
    isDeletingIpv4: deleteIpv4Mutation.isPending,
    isUpdatingIpv6: updateIpv6Mutation.isPending,
    isDeletingIpv6: deleteIpv6Mutation.isPending,
    isUpdatingIpv6Gateway: updateIpv6StaticGatewayMutation.isPending,
    isDeletingIpv6Gateway: deleteIpv6StaticGatewayMutation.isPending,
    isSavingHostname: saveHostnameMutation.isPending,
    isSavingDnsAddress: saveDnsAddressMutation.isPending,
    isEditingDnsAddress: editDnsAddressMutation.isPending,
  };
}
