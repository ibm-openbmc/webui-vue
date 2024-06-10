import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const PoliciesStore = defineStore('policies', () => {
  const sshProtocolEnabled = ref(false);
  const acfUploadEnablement = ref(false);
  const ipmiProtocolEnabled = ref(false);
  const rtadEnabled = ref('Disabled');
  const vtpmEnabled = ref('Disabled');
  const svleEnabled = ref('Disabled');
  const tpmPolicyEnabled = ref(false);
  const usbFirmwareUpdatePolicyEnabled = ref(false);
  const hostUsbEnabled = ref('Enabled');

  const getSshProtocolEnabled = computed(() => sshProtocolEnabled.value);
  const getAcfUploadEnablement = computed(() => acfUploadEnablement.value);
  const getIpmiProtocolEnabled = computed(() => ipmiProtocolEnabled.value);
  const getRtadEnabled = computed(() => rtadEnabled.value);
  const getVtpmEnabled = computed(() => vtpmEnabled.value);
  const getSvleEnabled = computed(() => svleEnabled.value);
  const getTpmPolicyEnabled = computed(() => tpmPolicyEnabled.value);
  const getUsbFirmwareUpdatePolicyEnable = computed(() => usbFirmwareUpdatePolicyEnabled.value);
  const getHostUsbEnabled = computed(() => hostUsbEnabled.value);

  async function getNetworkProtocolStatusAfterDelay() {
    setTimeout(() => {
      getNetworkProtocolStatus();
    }, 30000);
  }
  async function getNetworkProtocolStatus() {
    return await api
      .get('/redfish/v1/Managers/bmc/NetworkProtocol')
      .then((response) => {
        const sshProtocol = response.data.SSH.ProtocolEnabled;
        const ipmiProtocol = response.data.IPMI.ProtocolEnabled;
        this.sshProtocolEnabled = sshProtocol;
        this.ipmiProtocolEnabled = ipmiProtocol;
      })
      .catch((error) => console.log(error));
  }
  async function getUsbFirmwareUpdatePolicyEnabled() {
    return await api
      .get('/redfish/v1/Managers/bmc')
      .then((response) => {
        this.usbFirmwareUpdatePolicyEnabled = response.data.Oem.IBM.USBCodeUpdateEnabled;
      })
      .catch((error) => console.log(error));
  }
  async function getUnauthenticatedACFUploadEnablement() {
    return await api
      .get('/redfish/v1/AccountService/Accounts/service')
      .then((response) => {
        this.acfUploadEnablement = response?.data?.Oem?.IBM?.ACF?.AllowUnauthACFUpload;
      })
      .catch((error) => console.log(error));
  }

  async function getTpmPolicy() {
    // TODO: remove hardcoded endpoint when fix is available
    return await api
      .get('/redfish/v1/Systems/system')
      .then((response) => {
        const tpmState = response.data.Boot.TrustedModuleRequiredToBoot;
        this.tpmPolicyEnabled = tpmState === 'Required';
      })
      .catch((error) => console.log(error));
  }
  async function getBiosStatus() {
    return await api
      .get('/redfish/v1/Systems/system/Bios')
      .then((response) => {
        this.rtadEnabled = response.data.Attributes.pvm_rtad === 'Enabled' ? 'true' : 'false';
        this.vtpmEnabled = response.data.Attributes.pvm_vtpm === 'Enabled' ? 'true' : 'false';
        this.svleEnabled =
          response.data.Attributes.hb_secure_ver_lockin_enabled === 'Enabled' ? 'true' : 'false';
        this.hostUsbEnabled =
          response.data.Attributes.hb_host_usb_enablement === 'Enabled' ? 'true' : 'false';
      })
      .catch((error) => console.log(error));
  }
  async function saveSshProtocolState(protocolEnabled) {
    sshProtocolEnabled.value = protocolEnabled;
    console.log('sshProtocolEnabled.value: ', sshProtocolEnabled.value);
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
        sshProtocolEnabled.value = !protocolEnabled;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.ssh'),
          }),
        );
      });
  }
  async function saveIpmiProtocolState(protocolEnabled) {
    ipmiProtocolEnabled.value = protocolEnabled;
    const ipmi = {
      IPMI: {
        ProtocolEnabled: protocolEnabled,
      },
    };
    return await api
      .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ipmi)
      .then(() => {
        // Getting protocol data here so that the Ipmi gets enabled/disabled
        getNetworkProtocolStatusAfterDelay();
      })
      .then(() => {
        return i18n.global.t('pagePolicies.toast.successIpmiNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.ipmi'),
        });
      })
      .catch((error) => {
        console.log(error);
        ipmiProtocolEnabled.value = !protocolEnabled;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.ipmi'),
          }),
        );
      });
  }
  async function saveTpmPolicy(protocolEnabled) {
    tpmPolicyEnabled.value = protocolEnabled;
    const data = {
      Boot: {
        TrustedModuleRequiredToBoot: protocolEnabled,
      },
    };
    // TODO: remove hardcoded endpoint when fix is available
    return api
      .patch('/redfish/v1/Systems/system', data)
      .then(() => {
        return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.hostTpm'),
        });
      })
      .catch((error) => {
        console.log(error);
        this.setTpmPolicyEnabled = !protocolEnabled;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.hostTpm'),
          }),
        );
      });
  }
  async function saveVtpmState(updatedVtpm) {
    vtpmEnabled.value = updatedVtpm;
    return await api
      .patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: {
          pvm_vtpm: updatedVtpm === true ? 'Enabled' : 'Disabled',
        },
      })
      .then(() => {
        return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.vtpm'),
        });
      })
      .catch((error) => {
        console.log(error);
        vtpmEnabled.value = !updatedVtpm;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.vtpm'),
          }),
        );
      });
  }
  async function saveRtadState(updatedRtad) {
    rtadEnabled.value = updatedRtad;
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
        rtadEnabled.value = !updatedRtad;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.rtad'),
          }),
        );
      });
  }
  async function saveUsbFirmwareUpdatePolicyEnabled(updatedUsbCode) {
    usbFirmwareUpdatePolicyEnabled.value = updatedUsbCode;
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
        return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
        });
      })
      .catch((error) => {
        console.log(error);
        usbFirmwareUpdatePolicyEnabled.value = !updatedUsbCode;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
          }),
        );
      });
  }
  async function saveSvleState(updatedSvle) {
    svleEnabled.value = updatedSvle;
    return await api
      .patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: {
          hb_secure_ver_lockin_enabled: updatedSvle === true ? 'Enabled' : 'Disabled',
        },
      })
      .then(() => {
        return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.secureVersion'),
        });
      })
      .catch((error) => {
        console.log(error);
        svleEnabled.value = !updatedSvle;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.secureVersion'),
          }),
        );
      });
  }
  async function saveHostUsbEnabled(updatedHostUsb) {
    hostUsbEnabled.value = updatedHostUsb;
    return await api
      .patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: {
          hb_host_usb_enablement: updatedHostUsb === true ? 'Enabled' : 'Disabled',
        },
      })
      .then(() => {
        return i18n.global.t('pagePolicies.toast.successNextBootToast', {
          policy: i18n.global.t('pagePolicies.hostUsb'),
        });
      })
      .catch((error) => {
        console.log(error);
        hostUsbEnabled.value = !updatedHostUsb;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.hostUsb'),
          }),
        );
      });
  }
  async function saveUnauthenticatedACFUploadEnablement(updatedAcfUploadEnablement) {
    acfUploadEnablement.value = updatedAcfUploadEnablement;
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
        return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
          policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
        });
      })
      .catch((error) => {
        console.log(error);
        acfUploadEnablement.value = !updatedAcfUploadEnablement;
        throw new Error(
          i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
            policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
          }),
        );
      });
  }

  return {
    sshProtocolEnabled,
    acfUploadEnablement,
    ipmiProtocolEnabled,
    rtadEnabled,
    vtpmEnabled,
    svleEnabled,
    tpmPolicyEnabled,
    usbFirmwareUpdatePolicyEnabled,
    hostUsbEnabled,

    getSshProtocolEnabled,
    getAcfUploadEnablement,
    getIpmiProtocolEnabled,
    getRtadEnabled,
    getVtpmEnabled,
    getSvleEnabled,
    getTpmPolicyEnabled,
    getUsbFirmwareUpdatePolicyEnable,
    getHostUsbEnabled,

    getNetworkProtocolStatusAfterDelay,
    getUnauthenticatedACFUploadEnablement,
    getUsbFirmwareUpdatePolicyEnabled,
    getNetworkProtocolStatus,
    getBiosStatus,
    getTpmPolicy,
    saveSshProtocolState,
    saveIpmiProtocolState,
    saveTpmPolicy,
    saveVtpmState,
    saveRtadState,
    saveUsbFirmwareUpdatePolicyEnabled,
    saveSvleState,
    saveHostUsbEnabled,
    saveUnauthenticatedACFUploadEnablement,
  };
});
