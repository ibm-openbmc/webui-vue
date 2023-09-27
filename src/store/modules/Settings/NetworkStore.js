import api from '@/store/api';
import i18n from '@/i18n';
import { find } from 'lodash';

const NetworkStore = {
  namespaced: true,
  state: {
    dchpEnabledState: false,
    networkSettings: [],
    selectedInterfaceId: '', // which tab is selected
    selectedInterfaceIndex: 0, // which tab is selected
  },
  getters: {
    dchpEnabledState: (state) => state.dchpEnabledState,
    networkSettings: (state) => state.networkSettings,
    selectedInterfaceId: (state) => state.selectedInterfaceId,
    selectedInterfaceIndex: (state) => state.selectedInterfaceIndex,
  },
  mutations: {
    setDchpEnabledState: (state, dchpEnabledState) =>
      (state.dchpEnabledState = dchpEnabledState),
    setDomainNameState: (state, domainState) =>
      (state.domainState = domainState),
    setDnsState: (state, dnsState) => (state.dnsState = dnsState),
    setNtpState: (state, ntpState) => (state.ntpState = ntpState),
    setSelectedInterfaceId: (state, selectedInterfaceId) =>
      (state.selectedInterfaceId = selectedInterfaceId),
    setSelectedInterfaceIndex: (state, selectedInterfaceIndex) =>
      (state.selectedInterfaceIndex = selectedInterfaceIndex),
    setNetworkSettings: (state, data) => {
      state.networkSettings = data.map(({ data }) => {
        const {
          DHCPv4,
          HostName,
          Id,
          IPv4Addresses,
          IPv4StaticAddresses,
          MACAddress,
          StaticNameServers,
        } = data;
        return {
          defaultGateway: IPv4StaticAddresses[0]?.Gateway, //First static gateway is the default gateway
          dhcpAddress: IPv4Addresses.filter(
            (ipv4) => ipv4.AddressOrigin === 'DHCP'
          ),
          dhcpEnabled: DHCPv4.DHCPEnabled,
          hostname: HostName,
          id: Id,
          ipv4: IPv4Addresses,
          macAddress: MACAddress,
          staticAddress: IPv4StaticAddresses[0]?.Address, // Display first static address on overview page
          staticIpv4Addresses: IPv4StaticAddresses,
          staticNameServers: StaticNameServers,
          useDnsEnabled: DHCPv4.UseDNSServers,
          useDomainNameEnabled: DHCPv4.UseDomainName,
          useNtpEnabled: DHCPv4.UseNTPServers,
        };
      });
    },
  },
  actions: {
    async getEthernetData({ commit, state }) {
      return await api
        .get('/redfish/v1/Managers/bmc/EthernetInterfaces')
        .then((response) =>
          response.data.Members.map(
            (ethernetInterface) => ethernetInterface['@odata.id']
          )
        )
        .then((ethernetInterfaceIds) =>
          api.all(
            ethernetInterfaceIds.map((ethernetInterface) =>
              api.get(ethernetInterface)
            )
          )
        )
        .then((ethernetInterfaces) => {
          const ethernetData = ethernetInterfaces.map(
            (ethernetInterface) => ethernetInterface.data
          );

          commit('setNetworkSettings', ethernetInterfaces);
          let currentInterfaceIndex = 0;
          if (state.selectedInterfaceIndex) {
            currentInterfaceIndex = state.selectedInterfaceIndex;
          }
          commit(
            'setSelectedInterfaceId',
            ethernetData[currentInterfaceIndex].Id
          );
        })
        .catch((error) => {
          console.log('Network Data:', error);
        });
    },
    async saveDomainNameState({ commit, state, dispatch }, domainState) {
      commit('setDomainNameState', domainState);
      const data = {
        DHCPv4: {
          UseDomainName: domainState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          data
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.domainName'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setDomainNameState', !domainState);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.domainName'),
            })
          );
        });
    },
    async saveDnsState({ commit, state, dispatch }, dnsState) {
      commit('setDnsState', dnsState);
      const data = {
        DHCPv4: {
          UseDNSServers: dnsState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          data
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.dns'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setDnsState', !dnsState);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.dns'),
            })
          );
        });
    },
    async saveNtpState({ commit, state, dispatch }, ntpState) {
      commit('setNtpState', ntpState);
      const data = {
        DHCPv4: {
          UseNTPServers: ntpState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          data
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.ntp'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setNtpState', !ntpState);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.ntp'),
            })
          );
        });
    },
    async saveDhcpEnabledState({ commit, state, dispatch }, dhcpState) {
      commit('setDhcpEnabled', dhcpState);
      const data = {
        DHCPv4: {
          DHCPEnabled: dhcpState,
        },
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          data
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.dhcp'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setDhcpEnabled', !dhcpState);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.dhcp'),
            })
          );
        });
    },
    async setSelectedTabIndex({ commit }, tabIndex) {
      commit('setSelectedInterfaceIndex', tabIndex);
    },
    async setSelectedTabId({ commit }, tabId) {
      commit('setSelectedInterfaceId', tabId);
    },
    async updateIpv4Address({ dispatch, state }, newIpv4Address) {
      const originalAddresses =
        state.networkSettings[state.selectedInterfaceIndex].staticIpv4Addresses;
      const updatedIpv4 = originalAddresses.map((item) => {
        const address = item.Address;
        if (find(newIpv4Address, { Address: address })) {
          return null; // if address matches then delete address to "edit"
        } else {
          return {}; // if address doesn't match then skip address, no change
        }
      });
      const filteredAddress = newIpv4Address.filter(
        (item) => item.Subnet !== ''
      );
      const updatedIpv4Array = {
        IPv4StaticAddresses: [...updatedIpv4, ...filteredAddress],
      };
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          updatedIpv4Array
        )
        .then(() => {
          setTimeout(() => {
            dispatch('getEthernetData');
          }, 10000);
        })
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.ipv4'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.ipv4'),
            })
          );
        });
    },
    async deleteIpv4Address({ dispatch, state }, updatedIpv4Array) {
      const originalAddressArray =
        state.networkSettings[state.selectedInterfaceIndex].staticIpv4Addresses;
      const newIpv4Array = originalAddressArray.map((item) => {
        const address = item.Address;
        if (find(updatedIpv4Array, { Address: address })) {
          return {}; //return addresses that match the updated array
        } else {
          return null; // delete address that do not match updated array
        }
      });

      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          { IPv4StaticAddresses: newIpv4Array }
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.ipv4'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.ipv4'),
            })
          );
        });
    },
    async saveHostname({ state, dispatch }, hostname) {
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          hostname
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.network'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.network'),
            })
          );
        });
    },
    async saveDnsAddress({ dispatch, state }, dnsForm) {
      const newAddress = dnsForm;
      const originalAddresses =
        state.networkSettings[state.selectedInterfaceIndex].staticNameServers;
      const newDnsArray = originalAddresses.concat(newAddress);
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          { StaticNameServers: newDnsArray }
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.dns'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.dns'),
            })
          );
        });
    },
    async editDnsAddress({ dispatch, state }, dnsTableData) {
      return api
        .patch(
          `/redfish/v1/Managers/bmc/EthernetInterfaces/${state.selectedInterfaceId}`,
          { StaticNameServers: dnsTableData }
        )
        .then(dispatch('getEthernetData'))
        .then(() => {
          return i18n.t('pageNetwork.toast.successSaveNetworkSettings', {
            setting: i18n.t('pageNetwork.dns'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageNetwork.toast.errorSaveNetworkSettings', {
              setting: i18n.t('pageNetwork.dns'),
            })
          );
        });
    },
  },
};

export default NetworkStore;
