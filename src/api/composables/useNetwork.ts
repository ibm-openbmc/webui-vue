import { computed, ref, watchEffect } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import { usePatchResource } from './usePatchResource';
import type { Resource } from '@/types/redfish';
// @ts-ignore - lodash types
import { find } from 'lodash';

// Type definitions for Network resources
interface DHCPv4Config {
  DHCPEnabled: boolean;
  UseDNSServers: boolean;
  UseDomainName: boolean;
  UseNTPServers: boolean;
}

interface DHCPv6Config {
  OperatingMode: string;
  UseDNSServers?: boolean;
  UseDomainName?: boolean;
  UseNTPServers?: boolean;
}

interface IPv4Address {
  Address: string;
  AddressOrigin?: string;
  Gateway?: string;
  SubnetMask?: string;
  Subnet?: string;
}

interface IPv6Address {
  Address: string;
  AddressOrigin?: string;
  PrefixLength: number;
}

interface IPv6StaticDefaultGateway {
  Address: string;
}

interface StatelessAddressAutoConfig {
  IPv6AutoConfigEnabled: boolean;
}

interface EthernetInterface extends Resource {
  HostName: string;
  MACAddress: string;
  DHCPv4: DHCPv4Config;
  DHCPv6?: DHCPv6Config;
  IPv4Addresses: IPv4Address[];
  IPv4StaticAddresses: IPv4Address[];
  IPv6Addresses?: IPv6Address[];
  IPv6StaticAddresses?: IPv6Address[];
  IPv6DefaultGateway?: string;
  IPv6StaticDefaultGateways?: IPv6StaticDefaultGateway[];
  StaticNameServers: string[];
  StatelessAddressAutoConfig?: StatelessAddressAutoConfig;
}

interface LLDPEthernet {
  LLDPEnabled: boolean;
}

interface DedicatedNetworkPort extends Resource {
  Ethernet: LLDPEthernet;
}

export interface NetworkSettings {
  id: string;
  hostname: string;
  macAddress: string;
  dhcpEnabled: boolean;
  useDnsEnabled: boolean;
  useDomainNameEnabled: boolean;
  useNtpEnabled: boolean;
  defaultGateway: string;
  dhcpAddress: IPv4Address[];
  staticAddress: string;
  staticIpv4Addresses: IPv4Address[];
  staticNameServers: string[];
  ipv4: IPv4Address[];
  ipv6: IPv6Address[];
  staticIpv6Addresses: IPv6Address[];
  ipv6DefaultGateway: string;
  ipv6OperatingMode: string;
  ipv6StaticDefaultGateways: IPv6StaticDefaultGateway[];
  ipv6UseDnsEnabled: boolean;
  ipv6UseDomainNameEnabled: boolean;
  ipv6UseNtpEnabled: boolean;
  ipv6AutoConfigEnabled: boolean;
}

export interface LLDPState {
  lldpEnabled: boolean;
}

/**
 * Composable for Network page operations
 * Replaces NetworkStore with TanStack Query
 */
// Shared state across all useNetwork() instances
// These refs are defined outside the composable to act as singletons
const selectedInterfaceIndex = ref(0);
const selectedInterfaceId = ref('');
const isTableBusy = ref(false);

export function useNetwork() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();
  const { patchResource, isPending: isPatchPending } = usePatchResource();

  // Query keys for invalidation
  const ethernetQueryKey = ['redfish', 'managers', 'bmc', 'ethernetInterfaces'];
  const lldpQueryKey = ['redfish', 'managers', 'bmc', 'dedicatedNetworkPorts'];

  // Fetch Ethernet Interfaces
  const {
    data: ethernetData,
    isLoading: isLoadingEthernet,
    isFetching: isFetchingEthernet,
    refetch: refetchEthernet,
  } = useQuery({
    queryKey: ethernetQueryKey,
    queryFn: async (): Promise<EthernetInterface[]> => {
      const response = await api.get(
        '/redfish/v1/Managers/bmc/EthernetInterfaces',
      );
      const members = response.data.Members || [];

      const promises = members.map((member: { '@odata.id': string }) =>
        api.get<EthernetInterface>(member['@odata.id']),
      );

      const responses = await Promise.all(promises);
      return responses.map((res) => res.data);
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch LLDP Data
  const {
    data: lldpData,
    isLoading: isLoadingLLDP,
    isFetching: isFetchingLLDP,
    refetch: refetchLLDP,
  } = useQuery({
    queryKey: lldpQueryKey,
    queryFn: async (): Promise<LLDPState[]> => {
      const response = await api.get(
        '/redfish/v1/Managers/bmc/DedicatedNetworkPorts',
      );
      const members = response.data.Members || [];

      const promises = members.map((member: { '@odata.id': string }) =>
        api.get<DedicatedNetworkPort>(member['@odata.id']),
      );

      const responses = await Promise.all(promises);
      return responses.map((res) => ({
        lldpEnabled: res.data?.Ethernet?.LLDPEnabled ?? false,
      }));
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Computed: Network settings
  const networkSettings = computed<NetworkSettings[]>(() => {
    if (!ethernetData.value) return [];

    return ethernetData.value.map((data) => ({
      id: data.Id,
      hostname: data.HostName,
      macAddress: data.MACAddress,
      dhcpEnabled: data.DHCPv4.DHCPEnabled,
      useDnsEnabled: data.DHCPv4.UseDNSServers,
      useDomainNameEnabled: data.DHCPv4.UseDomainName,
      useNtpEnabled: data.DHCPv4.UseNTPServers,
      defaultGateway: data.IPv4StaticAddresses[0]?.Gateway || '',
      dhcpAddress: data.IPv4Addresses.filter(
        (ipv4) => ipv4.AddressOrigin === 'DHCP',
      ),
      staticAddress: data.IPv4StaticAddresses[0]?.Address || '',
      staticIpv4Addresses: data.IPv4StaticAddresses,
      staticNameServers: data.StaticNameServers,
      ipv4: data.IPv4Addresses,
      ipv6: data.IPv6Addresses ?? [],
      staticIpv6Addresses: data.IPv6StaticAddresses ?? [],
      ipv6DefaultGateway: data.IPv6DefaultGateway ?? '',
      ipv6OperatingMode: data.DHCPv6?.OperatingMode ?? '',
      ipv6StaticDefaultGateways: data.IPv6StaticDefaultGateways ?? [],
      ipv6UseDnsEnabled: data.DHCPv6?.UseDNSServers ?? false,
      ipv6UseDomainNameEnabled: data.DHCPv6?.UseDomainName ?? false,
      ipv6UseNtpEnabled: data.DHCPv6?.UseNTPServers ?? false,
      ipv6AutoConfigEnabled:
        data.StatelessAddressAutoConfig?.IPv6AutoConfigEnabled ?? false,
    }));
  });

  // Computed: LLDP enabled state
  const lldpEnabledState = computed<LLDPState[]>(() => lldpData.value || []);

  // Computed: Loading state
  const isLoading = computed(
    () => isLoadingEthernet.value || isLoadingLLDP.value,
  );

  const isFetching = computed(
    () => isFetchingEthernet.value || isFetchingLLDP.value,
  );

  // Helper function to get current interface ID based on selectedInterfaceIndex
  const getCurrentInterfaceId = (): string => {
    return (
      networkSettings.value[selectedInterfaceIndex.value]?.id ||
      networkSettings.value[0]?.id ||
      ''
    );
  };

  // Helper function to invalidate queries with delay
  const invalidateQueriesWithDelay = async (
    queryKeys: string[][],
    delay: number = 10000,
  ) => {
    isTableBusy.value = true;
    setTimeout(async () => {
      for (const key of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      setTimeout(() => {
        isTableBusy.value = false;
      }, 5000);
    }, delay);
  };

  // Simplified mutation functions using usePatchResource
  async function saveDomainNameState(domainState: boolean): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'DHCPv4.UseDomainName',
        value: domainState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.domainName'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save domain name state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.domainName'),
        }),
      );
      throw error;
    }
  }

  async function saveDnsState(dnsState: boolean): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'DHCPv4.UseDNSServers',
        value: dnsState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dns'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save DNS state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dns'),
        }),
      );
      throw error;
    }
  }

  async function saveNtpState(ntpState: boolean): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'DHCPv4.UseNTPServers',
        value: ntpState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ntp'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save NTP state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ntp'),
        }),
      );
      throw error;
    }
  }

  async function saveDhcpEnabledState(dhcpState: boolean): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'DHCPv4.DHCPEnabled',
        value: dhcpState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dhcp'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save DHCP enabled state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
      throw error;
    }
  }

  async function saveLLDPState(lldpState: boolean): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/DedicatedNetworkPorts/${getCurrentInterfaceId()}`,
        field: 'Ethernet.LLDPEnabled',
        value: lldpState,
        invalidateQueries: [lldpQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.lldp'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save LLDP state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.lldp'),
        }),
      );
      throw error;
    }
  }

  async function saveIpv6DhcpEnabledState(dhcpState: boolean): Promise<string> {
    try {
      const updatedDhcpState = dhcpState ? 'Enabled' : 'Disabled';

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'DHCPv6.OperatingMode',
        value: updatedDhcpState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.dhcp'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save IPv6 DHCP enabled state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.dhcp'),
        }),
      );
      throw error;
    }
  }

  async function saveIpv6AutoConfigState(
    ipv6AutoConfigState: boolean,
  ): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'StatelessAddressAutoConfig.IPv6AutoConfigEnabled',
        value: ipv6AutoConfigState,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save IPv6 auto-config state:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6AutoConfig'),
        }),
      );
      throw error;
    }
  }

  async function updateIpv4Address(
    newIpv4Address: IPv4Address[],
  ): Promise<string> {
    try {
      const originalAddresses =
        networkSettings.value[selectedInterfaceIndex.value].staticIpv4Addresses;

      const updatedIpv4 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv4Address, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });

      const filteredAddress = newIpv4Address.filter(
        (item) => item.Subnet !== '',
      );

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv4StaticAddresses',
        value: [...updatedIpv4, ...filteredAddress],
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv4'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to update IPv4 address:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv4'),
        }),
      );
      throw error;
    }
  }

  async function updateIpv6Address(
    newIpv6Address: IPv6Address[],
  ): Promise<string> {
    try {
      const originalAddresses =
        networkSettings.value[selectedInterfaceIndex.value].staticIpv6Addresses;

      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv6Address, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });

      const filteredAddress = newIpv6Address.filter(
        (item) => item.PrefixLength !== 0,
      );

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv6StaticAddresses',
        value: [...updatedIpv6, ...filteredAddress],
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to update IPv6 address:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6'),
        }),
      );
      throw error;
    }
  }

  async function updateIpv6StaticDefaultGatewayAddress(
    newIpv6StaticDefaultGatewayAddress: IPv6StaticDefaultGateway[],
  ): Promise<string> {
    try {
      const originalAddresses =
        networkSettings.value[selectedInterfaceIndex.value]
          .ipv6StaticDefaultGateways;

      const updatedIpv6 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv6StaticDefaultGatewayAddress, { Address: address })) {
          return null;
        } else {
          return {};
        }
      });

      const filteredAddress = [newIpv6StaticDefaultGatewayAddress[0]];

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv6StaticDefaultGateways',
        value: [...updatedIpv6, ...filteredAddress],
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to update IPv6 static default gateway:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.ipv6StaticDefaultGateway'),
        }),
      );
      throw error;
    }
  }

  async function deleteIpv4Address(
    updatedIpv4Array: IPv4Address[],
  ): Promise<string> {
    try {
      const originalAddressArray =
        networkSettings.value[selectedInterfaceIndex.value].staticIpv4Addresses;

      // updatedIpv4Array contains addresses to KEEP, not delete
      const newIpv4Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv4Array, { Address: address })) {
          return {}; // Keep addresses that match the updated array
        } else {
          return null; // Delete addresses that do not match updated array
        }
      });

      // Ensure at least one element exists in the array (null or {})
      const finalArray = newIpv4Array.length > 0 ? newIpv4Array : [null];

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv4StaticAddresses',
        value: finalArray,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successDeletingIpv4Server'),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to delete IPv4 address:', error);
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingIpv4Server'));
      throw error;
    }
  }

  async function deleteIpv6Address(
    updatedIpv6Array: IPv6Address[],
  ): Promise<string> {
    try {
      const originalAddressArray =
        networkSettings.value[selectedInterfaceIndex.value].staticIpv6Addresses;

      // updatedIpv6Array contains addresses to KEEP, not delete
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv6Array, { Address: address })) {
          return {}; // Keep addresses that match the updated array
        } else {
          return null; // Delete addresses that do not match updated array
        }
      });

      // Ensure at least one element exists in the array (null or {})
      const finalArray = newIpv6Array.length > 0 ? newIpv6Array : [null];

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv6StaticAddresses',
        value: finalArray,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successDeletingIpv6Server'),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to delete IPv6 address:', error);
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingIpv6Server'));
      throw error;
    }
  }

  async function deleteIpv6StaticDefaultGatewayAddress(
    updatedIpv6Array: IPv6StaticDefaultGateway[],
  ): Promise<string> {
    try {
      const originalAddressArray =
        networkSettings.value[selectedInterfaceIndex.value]
          .ipv6StaticDefaultGateways;

      // updatedIpv6Array contains addresses to KEEP, not delete
      const newIpv6Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv6Array, { Address: address })) {
          return {}; // Keep addresses that match the updated array
        } else {
          return null; // Delete addresses that do not match updated array
        }
      });

      // Ensure at least one element exists in the array (null or {})
      const finalArray = newIpv6Array.length > 0 ? newIpv6Array : [null];

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'IPv6StaticDefaultGateways',
        value: finalArray,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t(
              'pageNetwork.toast.successDeletingIpv6StaticDefaultGateway',
            ),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to delete IPv6 static default gateway:', error);
      errorToast(
        i18n.global.t(
          'pageNetwork.toast.errorDeletingIpv6StaticDefaultGateway',
        ),
      );
      throw error;
    }
  }

  async function saveHostname(hostname: { HostName: string }): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'HostName',
        value: hostname.HostName,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successSaveNetworkSettings', {
              setting: i18n.global.t('pageNetwork.network'),
            }),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save hostname:', error);
      errorToast(
        i18n.global.t('pageNetwork.toast.errorSaveNetworkSettings', {
          setting: i18n.global.t('pageNetwork.network'),
        }),
      );
      throw error;
    }
  }

  async function saveDnsAddress(dnsForm: string[]): Promise<string> {
    try {
      const originalAddresses =
        networkSettings.value[selectedInterfaceIndex.value].staticNameServers;
      const newDnsArray = originalAddresses.concat(dnsForm);

      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'StaticNameServers',
        value: newDnsArray,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successAddingDnsServer'),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to save DNS address:', error);
      errorToast(i18n.global.t('pageNetwork.toast.errorAddingDnsServer'));
      throw error;
    }
  }

  async function editDnsAddress(dnsTableData: string[]): Promise<string> {
    try {
      await patchResource({
        endpoint: `/redfish/v1/Managers/bmc/EthernetInterfaces/${getCurrentInterfaceId()}`,
        field: 'StaticNameServers',
        value: dnsTableData,
        invalidateQueries: [ethernetQueryKey],
        onSuccess: () => {
          successToast(
            i18n.global.t('pageNetwork.toast.successDeletingDnsServer'),
          );
        },
      });
      return 'success';
    } catch (error) {
      console.error('Failed to edit DNS address:', error);
      errorToast(i18n.global.t('pageNetwork.toast.errorDeletingDnsServer'));
      throw error;
    }
  }

  // Set selected interface
  function setSelectedTabIndex(tabIndex: number): void {
    selectedInterfaceIndex.value = tabIndex;
  }

  function setSelectedTabId(tabId: string): void {
    selectedInterfaceId.value = tabId;
  }

  // Initialize selected interface when networkSettings becomes available
  watchEffect(() => {
    if (networkSettings.value.length > 0 && !selectedInterfaceId.value) {
      selectedInterfaceId.value = networkSettings.value[0].id;
    }
  });

  return {
    // State
    networkSettings,
    lldpEnabledState,
    selectedInterfaceIndex,
    selectedInterfaceId,
    isTableBusy,
    isLoading,
    isFetching,

    // Refetch
    refetchEthernet,
    refetchLLDP,

    // Mutations
    saveDomainNameState,
    saveDnsState,
    saveNtpState,
    saveDhcpEnabledState,
    saveLLDPState,
    saveIpv6DhcpEnabledState,
    saveIpv6AutoConfigState,
    updateIpv4Address,
    updateIpv6Address,
    updateIpv6StaticDefaultGatewayAddress,
    deleteIpv4Address,
    deleteIpv6Address,
    deleteIpv6StaticDefaultGatewayAddress,
    saveHostname,
    saveDnsAddress,
    editDnsAddress,

    // Setters
    setSelectedTabIndex,
    setSelectedTabId,

    // Mutation states
    isSaving: isPatchPending,
  };
}
