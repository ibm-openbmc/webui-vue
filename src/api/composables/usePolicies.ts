import { ref } from 'vue';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

/**
 * Composable for Policies page operations
 * Replaces PoliciesStore with a simple composable
 */
export function usePolicies() {
    // Reactive state for all policy toggles
    const sshProtocolEnabled = ref(false);
    const ipmiProtocolEnabled = ref(false);
    const rtadEnabled = ref(false);
    const vtpmEnabled = ref(false);
    const svleEnabled = ref(false);
    const tpmPolicyEnabled = ref(false);
    const usbFirmwareUpdatePolicyEnabled = ref(false);
    const hostUsbEnabled = ref(false);
    const acfUploadEnablement = ref(false);
    const unAuthenticatedACFUploadEnablementState = ref(false);
    const basicAuthEnabled = ref(true);

    // ---------- Fetch functions ----------

    async function fetchNetworkProtocol() {
        return await api
            .get('/redfish/v1/Managers/bmc/NetworkProtocol')
            .then((response: { data: { SSH: { ProtocolEnabled: boolean }; IPMI: { ProtocolEnabled: boolean } } }) => {
                sshProtocolEnabled.value = response.data.SSH.ProtocolEnabled;
                ipmiProtocolEnabled.value = response.data.IPMI.ProtocolEnabled;
            })
            .catch((error: Error) => console.log(error));
    }

    async function fetchNetworkProtocolAfterDelay() {
        setTimeout(() => {
            fetchNetworkProtocol();
        }, 30000);
    }

    async function fetchBiosStatus() {
        return await api
            .get('/redfish/v1/Systems/system/Bios')
            .then((response: { data: { Attributes: Record<string, string> } }) => {
                rtadEnabled.value =
                    response.data.Attributes.pvm_rtad === 'Enabled' ? true : false;
                vtpmEnabled.value =
                    response.data.Attributes.pvm_vtpm === 'Enabled' ? true : false;
                svleEnabled.value =
                    response.data.Attributes.hb_secure_ver_lockin_enabled === 'Enabled'
                        ? true
                        : false;
                hostUsbEnabled.value =
                    response.data.Attributes.hb_host_usb_enablement === 'Enabled'
                        ? true
                        : false;
            })
            .catch((error: Error) => console.log(error));
    }

    async function fetchTpmPolicy() {
        return await api
            .get('/redfish/v1/Systems/system')
            .then((response: { data: { Boot: { TrustedModuleRequiredToBoot: string } } }) => {
                tpmPolicyEnabled.value =
                    response.data.Boot.TrustedModuleRequiredToBoot === 'Required';
            })
            .catch((error: Error) => console.log(error));
    }

    async function fetchUsbFirmwareUpdatePolicy() {
        return await api
            .get('/redfish/v1/Managers/bmc')
            .then((response: { data: { Oem: { IBM: { USBCodeUpdateEnabled: boolean } } } }) => {
                usbFirmwareUpdatePolicyEnabled.value =
                    response.data.Oem.IBM.USBCodeUpdateEnabled;
            })
            .catch((error: Error) => console.log(error));
    }

    async function fetchAcfUploadEnablement() {
        return await api
            .get('/redfish/v1/AccountService/Accounts/service')
            .then((response: { data: { Oem?: { IBM?: { ACF?: { AllowUnauthACFUpload?: boolean } } } } }) => {
                acfUploadEnablement.value =
                    response?.data?.Oem?.IBM?.ACF?.AllowUnauthACFUpload ?? false;
            })
            .catch((error: Error) => console.log(error));
    }

    async function fetchBasicAuth() {
        return await api
            .get('/redfish/v1/AccountService')
            .then((response: { data: { Oem?: { OpenBMC?: { AuthMethods?: { BasicAuth?: boolean } } } } }) => {
                basicAuthEnabled.value =
                    response?.data?.Oem?.OpenBMC?.AuthMethods?.BasicAuth ?? true;
            })
            .catch((error: Error) => console.log(error));
    }

    async function loadAllPolicies() {
        return Promise.all([
            fetchBiosStatus(),
            fetchNetworkProtocolAfterDelay(),
            fetchUsbFirmwareUpdatePolicy(),
            fetchAcfUploadEnablement(),
            fetchTpmPolicy(),
            fetchBasicAuth(),
        ]);
    }

    // ---------- Save functions ----------

    async function saveSshProtocolState(protocolEnabled: boolean): Promise<string> {
        sshProtocolEnabled.value = protocolEnabled;
        const ssh = {
            SSH: { ProtocolEnabled: protocolEnabled },
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
            .catch((error: Error) => {
                console.log(error);
                sshProtocolEnabled.value = !protocolEnabled;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.ssh'),
                    }),
                );
            });
    }

    async function saveIpmiProtocolState(protocolEnabled: boolean): Promise<string> {
        ipmiProtocolEnabled.value = protocolEnabled;
        const ipmi = {
            IPMI: { ProtocolEnabled: protocolEnabled },
        };
        return await api
            .patch('/redfish/v1/Managers/bmc/NetworkProtocol', ipmi)
            .then(() => {
                fetchNetworkProtocolAfterDelay();
            })
            .then(() => {
                return i18n.global.t(
                    'pagePolicies.toast.successIpmiNetworkPolicyUpdate',
                    { policy: i18n.global.t('pagePolicies.ipmi') },
                );
            })
            .catch((error: Error) => {
                console.log(error);
                ipmiProtocolEnabled.value = !protocolEnabled;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.ipmi'),
                    }),
                );
            });
    }

    async function saveTpmPolicy(protocolEnabled: boolean): Promise<string> {
        tpmPolicyEnabled.value = protocolEnabled;
        const data = {
            Boot: { TrustedModuleRequiredToBoot: protocolEnabled },
        };
        return api
            .patch('/redfish/v1/Systems/system', data)
            .then(() => {
                return i18n.global.t(
                    'pagePolicies.toast.successNetworkPolicyUpdate',
                    { policy: i18n.global.t('pagePolicies.hostTpm') },
                );
            })
            .catch((error: Error) => {
                console.log(error);
                tpmPolicyEnabled.value = !protocolEnabled;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.hostTpm'),
                    }),
                );
            });
    }

    async function saveVtpmState(updatedVtpm: string): Promise<string> {
        vtpmEnabled.value = updatedVtpm === 'Enabled' ? true : false;
        return await api
            .patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { pvm_vtpm: updatedVtpm },
            })
            .then(() => {
                return i18n.global.t(
                    'pagePolicies.toast.successNetworkPolicyUpdate',
                    { policy: i18n.global.t('pagePolicies.vtpm') },
                );
            })
            .catch((error: Error) => {
                console.log(error);
                vtpmEnabled.value = updatedVtpm === 'Enabled' ? false : true;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.vtpm'),
                    }),
                );
            });
    }

    async function saveRtadState(updatedRtad: string): Promise<string> {
        rtadEnabled.value = updatedRtad === 'Enabled' ? true : false;
        return await api
            .patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { pvm_rtad: updatedRtad },
            })
            .then(() => {
                return i18n.global.t('pagePolicies.toast.successNextBootToast', {
                    policy: i18n.global.t('pagePolicies.rtad'),
                });
            })
            .catch((error: Error) => {
                console.log(error);
                rtadEnabled.value = updatedRtad === 'Enabled' ? false : true;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.rtad'),
                    }),
                );
            });
    }

    async function saveSvleState(updatedSvle: string): Promise<string> {
        svleEnabled.value = updatedSvle === 'Enabled' ? true : false;
        return await api
            .patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { hb_secure_ver_lockin_enabled: updatedSvle },
            })
            .then(() => {
                return i18n.global.t(
                    'pagePolicies.toast.successNetworkPolicyUpdate',
                    { policy: i18n.global.t('pagePolicies.secureVersion') },
                );
            })
            .catch((error: Error) => {
                console.log(error);
                svleEnabled.value = updatedSvle === 'Enabled' ? false : true;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.secureVersion'),
                    }),
                );
            });
    }

    async function saveHostUsbEnabled(updatedHostUsb: string): Promise<string> {
        hostUsbEnabled.value = updatedHostUsb === 'Enabled' ? true : false;
        return await api
            .patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { hb_host_usb_enablement: updatedHostUsb },
            })
            .then(() => {
                return i18n.global.t('pagePolicies.toast.successNextBootToast', {
                    policy: i18n.global.t('pagePolicies.hostUsb'),
                });
            })
            .catch((error: Error) => {
                console.log(error);
                hostUsbEnabled.value = updatedHostUsb === 'Enabled' ? false : true;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.hostUsb'),
                    }),
                );
            });
    }

    async function saveUsbFirmwareUpdatePolicyEnabled(
        updatedUsbCode: boolean,
    ): Promise<string> {
        usbFirmwareUpdatePolicyEnabled.value = updatedUsbCode;
        const oem = {
            Oem: { IBM: { USBCodeUpdateEnabled: updatedUsbCode } },
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
            .catch((error: Error) => {
                console.log(error);
                usbFirmwareUpdatePolicyEnabled.value = !updatedUsbCode;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
                    }),
                );
            });
    }

    async function saveUnauthenticatedACFUploadEnablement(
        updatedAcfUploadEnablement: boolean,
    ): Promise<string> {
        acfUploadEnablement.value = updatedAcfUploadEnablement;
        const oem = {
            Oem: {
                IBM: {
                    ACF: { AllowUnauthACFUpload: updatedAcfUploadEnablement },
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
            .catch((error: Error) => {
                console.log(error);
                acfUploadEnablement.value = !updatedAcfUploadEnablement;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
                    }),
                );
            });
    }

    async function saveBasicAuthEnabled(
        updatedBasicAuth: boolean,
    ): Promise<string> {
        basicAuthEnabled.value = updatedBasicAuth;
        return await api
            .patch('/redfish/v1/AccountService', {
                Oem: { OpenBMC: { AuthMethods: { BasicAuth: updatedBasicAuth } } },
            })
            .then(() => {
                return i18n.global.t(
                    'pagePolicies.toast.successNetworkPolicyUpdate',
                    { policy: i18n.global.t('pagePolicies.basicAuth') },
                );
            })
            .catch((error: Error) => {
                console.log(error);
                basicAuthEnabled.value = !updatedBasicAuth;
                throw new Error(
                    i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                        policy: i18n.global.t('pagePolicies.basicAuth'),
                    }),
                );
            });
    }

    return {
        // State
        sshProtocolEnabled,
        ipmiProtocolEnabled,
        rtadEnabled,
        vtpmEnabled,
        svleEnabled,
        tpmPolicyEnabled,
        usbFirmwareUpdatePolicyEnabled,
        hostUsbEnabled,
        acfUploadEnablement,
        unAuthenticatedACFUploadEnablementState,
        basicAuthEnabled,
        // Fetch
        loadAllPolicies,
        // Save
        saveSshProtocolState,
        saveIpmiProtocolState,
        saveTpmPolicy,
        saveVtpmState,
        saveRtadState,
        saveSvleState,
        saveHostUsbEnabled,
        saveUsbFirmwareUpdatePolicyEnabled,
        saveUnauthenticatedACFUploadEnablement,
        saveBasicAuthEnabled,
    };
}
