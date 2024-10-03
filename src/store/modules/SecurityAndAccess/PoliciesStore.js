import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const PoliciesStore = defineStore('policies', {
  namespaced: true,
  state: () => {
    return {
      acfUploadEnablement: false,
      sshProtocolEnabled: false,
      ipmiProtocolEnabled: false,
      rtadEnabled: 'Disabled',
      vtpmEnabled: 'Disabled',
      svleEnabled: 'Disabled',
      tpmPolicyEnabled: false,
      usbFirmwareUpdatePolicyEnabled: false,
      hostUsbEnabled: 'Enabled',
    };
  },
  getters: {
    getAcfUploadEnablement: (state) => state.acfUploadEnablement,
    getSshProtocolEnabled: (state) => state.sshProtocolEnabled,
    getIpmiProtocolEnabled: (state) => state.ipmiProtocolEnabled,
    getRtadEnabled: (state) => state.rtadEnabled,
    getVtpmEnabled: (state) => state.vtpmEnabled,
    getSvleEnabled: (state) => state.svleEnabled,
    getTpmPolicyEnabled: (state) => state.tpmPolicyEnabled,
    getUsbFirmwareUpdatePolicyEnable: (state) =>
      state.usbFirmwareUpdatePolicyEnabled,
    getHostUsbEnabled: (state) => state.hostUsbEnabled,
  },
  actions: {
    async getNetworkProtocolStatusAfterDelay() {
      setTimeout(() => {
        this.getNetworkProtocolStatus();
      }, 30000);
    },
    async getNetworkProtocolStatus() {
      return await api
        .get('/redfish/v1/Managers/bmc/NetworkProtocol')
        .then((response) => {
          const sshProtocol = response.data.SSH.ProtocolEnabled;
          const ipmiProtocol = response.data.IPMI.ProtocolEnabled;
          this.sshProtocolEnabled = sshProtocol;
          this.ipmiProtocolEnabled = ipmiProtocol;
        })
        .catch((error) => console.log(error));
    },
    async getUsbFirmwareUpdatePolicyEnabled() {
      return await api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          this.usbFirmwareUpdatePolicyEnabled =
            response.data.Oem.IBM.USBCodeUpdateEnabled;
        })
        .catch((error) => console.log(error));
    },
    async getUnauthenticatedACFUploadEnablement() {
      return await api
        .get('/redfish/v1/AccountService/Accounts/service')
        .then((response) => {
          this.acfUploadEnablement =
            response?.data?.Oem?.IBM?.ACF?.AllowUnauthACFUpload;
        })
        .catch((error) => console.log(error));
    },
    async getBiosStatus() {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then((response) => {
          this.rtadEnabled =
            response.data.Attributes.pvm_rtad === 'Enabled' ? 'true' : 'false';
          this.vtpmEnabled =
            response.data.Attributes.pvm_vtpm === 'Enabled' ? 'true' : 'false';
          this.svleEnabled =
            response.data.Attributes.hb_secure_ver_lockin_enabled === 'Enabled'
              ? 'true'
              : 'false';
          this.hostUsbEnabled =
            response.data.Attributes.hb_host_usb_enablement === 'Enabled'
              ? 'true'
              : 'false';
        })
        .catch((error) => console.log(error));
    },
    async getTpmPolicy() {
      // TODO: remove hardcoded endpoint when fix is available
      return await api
        .get('/redfish/v1/Systems/system')
        .then((response) => {
          const tpmState = response.data.Boot.TrustedModuleRequiredToBoot;
          this.tpmPolicyEnabled = tpmState === 'Required';
        })
        .catch((error) => console.log(error));
    },
    async saveTpmPolicy(protocolEnabled) {
      this.tpmPolicyEnabled = protocolEnabled;
      const data = {
        Boot: {
          TrustedModuleRequiredToBoot: protocolEnabled,
        },
      };
      // TODO: remove hardcoded endpoint when fix is available
      return api
        .patch('/redfish/v1/Systems/system', data)
        .then(() => {
          return i18n.global.t(
            'pagePolicies.toast.successNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.hostTpm'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.tpmPolicyEnabled = !protocolEnabled;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.hostTpm'),
            }),
          );
        });
    },
    async saveUsbFirmwareUpdatePolicyEnabled(updatedUsbCode) {
      this.usbFirmwareUpdatePolicyEnabled = updatedUsbCode;
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
          return i18n.global.t(
            'pagePolicies.toast.successNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.usbFirmwareUpdatePolicyEnabled = !updatedUsbCode;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
            }),
          );
        });
    },
    async saveUnauthenticatedACFUploadEnablement(updatedAcfUploadEnablement) {
      this.setAcfUploadEnablement = updatedAcfUploadEnablement;
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
          return i18n.global.t(
            'pagePolicies.toast.successNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.setAcfUploadEnablement = !updatedAcfUploadEnablement;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
            }),
          );
        });
    },
    async saveIpmiProtocolState(protocolEnabled) {
      this.ipmiProtocolEnabled = protocolEnabled;
      const ipmi = {
        IPMI: {
          ProtocolEnabled: protocolEnabled,
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ipmi)
        .then(() => {
          // Getting protocol data here so that the Ipmi gets enabled/disabled
          this.getNetworkProtocolStatusAfterDelay();
        })
        .then(() => {
          return i18n.global.t(
            'pagePolicies.toast.successIpmiNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.ipmi'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.ipmiProtocolEnabled = !protocolEnabled;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.ipmi'),
            }),
          );
        });
    },
    async saveSshProtocolState(protocolEnabled) {
      this.sshProtocolEnabled = protocolEnabled;
      const ssh = {
        SSH: {
          ProtocolEnabled: protocolEnabled,
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ssh)
        .then(() => {
          if (protocolEnabled) {
            return i18n.global.t('pagePolicies.toast.successEnableBmcShell');
          } else {
            return i18n.global.t('pagePolicies.toast.successDisableBmcShell');
          }
        })
        .catch((error) => {
          console.log(error);
          this.sshProtocolEnabled = !protocolEnabled;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.ssh'),
            }),
          );
        });
    },
    async saveRtadState(updatedRtad) {
      this.rtadEnabled = updatedRtad;
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            pvm_rtad: updatedRtad === true ? 'Enabled' : 'Disabled',
          },
        })
        .then(() => {
          return i18n.global.t('pagePolicies.toast.successNextBootToast', {
            policy: i18n.global.t('pagePolicies.rtad'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.rtadEnabled = !updatedRtad;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.rtad'),
            }),
          );
        });
    },
    async saveVtpmState(updatedVtpm) {
      this.vtpmEnabled = updatedVtpm;
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            pvm_vtpm: updatedVtpm === true ? 'Enabled' : 'Disabled',
          },
        })
        .then(() => {
          return i18n.global.t(
            'pagePolicies.toast.successNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.vtpm'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.vtpmEnabled = !updatedVtpm;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.vtpm'),
            }),
          );
        });
    },
    async saveSvleState(updatedSvle) {
      this.svleEnabled = updatedSvle;
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            hb_secure_ver_lockin_enabled:
              updatedSvle === true ? 'Enabled' : 'Disabled',
          },
        })
        .then(() => {
          return i18n.global.t(
            'pagePolicies.toast.successNetworkPolicyUpdate',
            {
              policy: i18n.global.t('pagePolicies.secureVersion'),
            },
          );
        })
        .catch((error) => {
          console.log(error);
          this.svleEnabled = !updatedSvle;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.secureVersion'),
            }),
          );
        });
    },
    async saveHostUsbEnabled(updatedHostUsb) {
      this.hostUsbEnabled = updatedHostUsb;
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: {
            hb_host_usb_enablement:
              updatedHostUsb === true ? 'Enabled' : 'Disabled',
          },
        })
        .then(() => {
          return i18n.global.t('pagePolicies.toast.successNextBootToast', {
            policy: i18n.global.t('pagePolicies.hostUsb'),
          });
        })
        .catch((error) => {
          console.log(error);
          this.hostUsbEnabled = !updatedHostUsb;
          throw new Error(
            i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
              policy: i18n.global.t('pagePolicies.hostUsb'),
            }),
          );
        });
    },
  },
});

export default PoliciesStore;
