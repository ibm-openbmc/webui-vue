import api from '@/store/api';
import i18n from '@/i18n';

const PoliciesStore = {
  namespaced: true,
  state: {
    acfUploadEnablement: false,
    sshProtocolEnabled: false,
    ipmiProtocolEnabled: false,
    rtadEnabled: 'Disabled',
    vtpmEnabled: 'Disabled',
    svleEnabled: 'Disabled',
    tpmPolicyEnabled: false,
    usbFirmwareUpdatePolicyEnabled: false,
    hostUsbEnabled: 'Enabled',
  },
  getters: {
    acfUploadEnablement: (state) => state.acfUploadEnablement,
    sshProtocolEnabled: (state) => state.sshProtocolEnabled,
    ipmiProtocolEnabled: (state) => state.ipmiProtocolEnabled,
    rtadEnabled: (state) => state.rtadEnabled,
    vtpmEnabled: (state) => state.vtpmEnabled,
    svleEnabled: (state) => state.svleEnabled,
    tpmPolicyEnabled: (state) => state.tpmPolicyEnabled,
    usbFirmwareUpdatePolicyEnabled: (state) =>
      state.usbFirmwareUpdatePolicyEnabled,
    hostUsbEnabled: (state) => state.hostUsbEnabled,
  },
  mutations: {
    setAcfUploadEnablement: (state, acfUploadEnablement) =>
      (state.acfUploadEnablement = acfUploadEnablement),
    setSshProtocolEnabled: (state, sshProtocolEnabled) =>
      (state.sshProtocolEnabled = sshProtocolEnabled),
    setIpmiProtocolEnabled: (state, ipmiProtocolEnabled) =>
      (state.ipmiProtocolEnabled = ipmiProtocolEnabled),
    setRtadEnabled: (state, rtadEnabled) => (state.rtadEnabled = rtadEnabled),
    setVtpmEnabled: (state, vtpmEnabled) => (state.vtpmEnabled = vtpmEnabled),
    setSvleEnabled: (state, svleEnabled) => (state.svleEnabled = svleEnabled),
    setTpmPolicyEnabled: (state, tpmPolicyEnabled) =>
      (state.tpmPolicyEnabled = tpmPolicyEnabled),
    setUsbFirmwareUpdatePolicyEnabled: (
      state,
      usbFirmwareUpdatePolicyEnabled,
    ) =>
      (state.usbFirmwareUpdatePolicyEnabled = usbFirmwareUpdatePolicyEnabled),
    setHostUsbEnabled: (state, hostUsbEnabled) =>
      (state.hostUsbEnabled = hostUsbEnabled),
  },
  actions: {
    async getNetworkProtocolStatus({ commit }) {
      return await api
        .get('/redfish/v1/Managers/bmc/NetworkProtocol')
        .then((response) => {
          const sshProtocol = response.data.SSH.ProtocolEnabled;
          const ipmiProtocol = response.data.IPMI.ProtocolEnabled;
          commit('setSshProtocolEnabled', sshProtocol);
          commit('setIpmiProtocolEnabled', ipmiProtocol);
        })
        .catch((error) => console.log(error));
    },
    async getUsbFirmwareUpdatePolicyEnabled({ commit }) {
      return await api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          commit(
            'setUsbFirmwareUpdatePolicyEnabled',
            response.data.Oem.IBM.USBCodeUpdateEnabled,
          );
        })
        .catch((error) => console.log(error));
    },
    async getUnauthenticatedACFUploadEnablement({ commit }) {
      return await api
        .get('/redfish/v1/AccountService/Accounts/service')
        .then((response) => {
          commit(
            'setAcfUploadEnablement',
            response?.data?.Oem?.IBM?.ACF?.AllowUnauthACFUpload,
          );
        })
        .catch((error) => console.log(error));
    },
    async getBiosStatus({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then((response) => {
          commit('setRtadEnabled', response.data.Attributes.pvm_rtad);
          commit('setVtpmEnabled', response.data.Attributes.pvm_vtpm);
          commit(
            'setSvleEnabled',
            response.data.Attributes.hb_secure_ver_lockin_enabled,
          );
          commit(
            'setHostUsbEnabled',
            response.data.Attributes.hb_host_usb_enablement,
          );
        })
        .catch((error) => console.log(error));
    },
    async getTpmPolicy({ commit }) {
      // TODO: remove hardcoded endpoint when fix is available
      return await api
        .get('/redfish/v1/Systems/system')
        .then((response) => {
          const tpmState = response.data.Boot.TrustedModuleRequiredToBoot;
          commit('setTpmPolicyEnabled', tpmState === 'Required');
        })
        .catch((error) => console.log(error));
    },
    async saveTpmPolicy({ commit }, protocolEnabled) {
      commit('setTpmPolicyEnabled', protocolEnabled);
      const data = {
        Boot: {
          TrustedModuleRequiredToBoot: protocolEnabled,
        },
      };
      // TODO: remove hardcoded endpoint when fix is available
      return api
        .patch('/redfish/v1/Systems/system', data)
        .then(() => {
          return i18n.t('pagePolicies.toast.successNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.hostTpm'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setTpmPolicyEnabled', !protocolEnabled);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.hostTpm'),
            }),
          );
        });
    },
    async saveUsbFirmwareUpdatePolicyEnabled({ commit }, updatedUsbCode) {
      commit('setUsbFirmwareUpdatePolicyEnabled', updatedUsbCode);
      const oem = {
        Oem: {
          IBM: {
            USBCodeUpdateEnabled: updatedUsbCode,
          },
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc', oem)
        .then(() => {
          return i18n.t('pagePolicies.toast.successNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.usbFirmwareUpdatePolicy'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setUsbFirmwareUpdatePolicyEnabled', !updatedUsbCode);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.usbFirmwareUpdatePolicy'),
            }),
          );
        });
    },
    async saveUnauthenticatedACFUploadEnablement(
      { commit },
      updatedAcfUploadEnablement,
    ) {
      commit('setAcfUploadEnablement', updatedAcfUploadEnablement);
      const oem = {
        Oem: {
          IBM: {
            ACF: {
              AllowUnauthACFUpload: updatedAcfUploadEnablement,
            },
          },
        },
      };
      return await api
        .patch('/redfish/v1/AccountService/Accounts/service', oem)
        .then(() => {
          return i18n.t('pagePolicies.toast.successNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.acfUploadEnablement'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setAcfUploadEnablement', !updatedAcfUploadEnablement);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.acfUploadEnablement'),
            }),
          );
        });
    },
    async getNetworkProtocolStatusAfterDelay({ dispatch }) {
      setTimeout(() => {
        dispatch('getNetworkProtocolStatus');
      }, 30000);
    },
    async saveIpmiProtocolState({ commit, dispatch }, protocolEnabled) {
      commit('setIpmiProtocolEnabled', protocolEnabled);
      const ipmi = {
        IPMI: {
          ProtocolEnabled: protocolEnabled,
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ipmi)
        .then(() => {
          // Getting protocol data here so that the Ipmi gets enabled/disabled
          dispatch('getNetworkProtocolStatusAfterDelay');
        })
        .then(() => {
          return i18n.t('pagePolicies.toast.successIpmiNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.ipmi'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setIpmiProtocolEnabled', !protocolEnabled);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.ipmi'),
            }),
          );
        });
    },
    async saveSshProtocolState({ commit }, protocolEnabled) {
      commit('setSshProtocolEnabled', protocolEnabled);
      const ssh = {
        SSH: {
          ProtocolEnabled: protocolEnabled,
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ssh)
        .then(() => {
          if (protocolEnabled) {
            return i18n.t('pagePolicies.toast.successEnableBmcShell');
          } else {
            return i18n.t('pagePolicies.toast.successDisableBmcShell');
          }
        })
        .catch((error) => {
          console.log(error);
          commit('setSshProtocolEnabled', !protocolEnabled);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.ssh'),
            }),
          );
        });
    },
    async saveRtadState({ commit }, updatedRtad) {
      commit('setRtadEnabled', updatedRtad);
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            pvm_rtad: updatedRtad,
          },
        })
        .then(() => {
          return i18n.t('pagePolicies.toast.successNextBootToast', {
            policy: i18n.t('pagePolicies.rtad'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setRtadEnabled', !updatedRtad);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.rtad'),
            }),
          );
        });
    },
    async saveVtpmState({ commit }, updatedVtpm) {
      commit('setVtpmEnabled', updatedVtpm);
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            pvm_vtpm: updatedVtpm,
          },
        })
        .then(() => {
          return i18n.t('pagePolicies.toast.successNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.vtpm'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setVtpmEnabled', !updatedVtpm);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.vtpm'),
            }),
          );
        });
    },
    async saveSvleState({ commit }, updatedSvle) {
      commit('setSvleEnabled', updatedSvle);
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            hb_secure_ver_lockin_enabled: updatedSvle,
          },
        })
        .then(() => {
          return i18n.t('pagePolicies.toast.successNetworkPolicyUpdate', {
            policy: i18n.t('pagePolicies.secureVersion'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setSvleEnabled', !updatedSvle);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.secureVersion'),
            }),
          );
        });
    },
    async saveHostUsbEnabled({ commit }, updatedHostUsb) {
      commit('setHostUsbEnabled', updatedHostUsb);
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            hb_host_usb_enablement: updatedHostUsb,
          },
        })
        .then(() => {
          return i18n.t('pagePolicies.toast.successNextBootToast', {
            policy: i18n.t('pagePolicies.hostUsb'),
          });
        })
        .catch((error) => {
          console.log(error);
          commit('setHostUsbEnabled', !updatedHostUsb);
          throw new Error(
            i18n.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.t('pagePolicies.hostUsb'),
            }),
          );
        });
    },
  },
};

export default PoliciesStore;
