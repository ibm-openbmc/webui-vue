import { ref, computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { useRedfishResource } from './useAllSubResources';
import type { Resource } from '@/types/redfish';

// Type definitions for the resources
interface NetworkProtocol extends Resource {
    SSH: { ProtocolEnabled: boolean };
    IPMI: { ProtocolEnabled: boolean };
}

interface BiosAttributes extends Resource {
    Attributes: {
        pvm_rtad?: string;
        pvm_vtpm?: string;
        hb_secure_ver_lockin_enabled?: string;
        hb_host_usb_enablement?: string;
    };
}

interface SystemResource extends Resource {
    Boot: { TrustedModuleRequiredToBoot: string };
}

interface ManagerResource extends Resource {
    Oem: { IBM: { USBCodeUpdateEnabled: boolean } };
}

interface ServiceAccount extends Resource {
    Oem?: { IBM?: { ACF?: { AllowUnauthACFUpload?: boolean } } };
}

interface AccountService extends Resource {
    Oem?: { OpenBMC?: { AuthMethods?: { BasicAuth?: boolean } } };
}

/**
 * Composable for Policies page operations
 * Replaces PoliciesStore with a simple composable
 */
export function usePolicies() {
    const queryClient = useQueryClient();
    const unAuthenticatedACFUploadEnablementState = ref(false);

    // ---------- Fetch using useRedfishResource ----------

    // Fetch Network Protocol
    const networkProtocolQuery = useRedfishResource<NetworkProtocol>(
        '/redfish/v1/Managers/bmc/NetworkProtocol'
    );

    const sshProtocolEnabled = computed(() =>
        networkProtocolQuery.data.value?.SSH?.ProtocolEnabled ?? false
    );
    
    const ipmiProtocolEnabled = computed(() =>
        networkProtocolQuery.data.value?.IPMI?.ProtocolEnabled ?? false
    );

    // Fetch BIOS Status
    const biosQuery = useRedfishResource<BiosAttributes>(
        '/redfish/v1/Systems/system/Bios'
    );

    const rtadEnabled = computed(() =>
        biosQuery.data.value?.Attributes?.pvm_rtad === 'Enabled'
    );
    
    const vtpmEnabled = computed(() =>
        biosQuery.data.value?.Attributes?.pvm_vtpm === 'Enabled'
    );
    
    const svleEnabled = computed(() =>
        biosQuery.data.value?.Attributes?.hb_secure_ver_lockin_enabled === 'Enabled'
    );
    
    const hostUsbEnabled = computed(() =>
        biosQuery.data.value?.Attributes?.hb_host_usb_enablement === 'Enabled'
    );

    // Fetch TPM Policy
    const systemQuery = useRedfishResource<SystemResource>(
        '/redfish/v1/Systems/system'
    );

    const tpmPolicyEnabled = computed(() =>
        systemQuery.data.value?.Boot?.TrustedModuleRequiredToBoot === 'Required'
    );

    // Fetch USB Firmware Update Policy
    const managerQuery = useRedfishResource<ManagerResource>(
        '/redfish/v1/Managers/bmc'
    );

    const usbFirmwareUpdatePolicyEnabled = computed(() =>
        managerQuery.data.value?.Oem?.IBM?.USBCodeUpdateEnabled ?? false
    );

    // Fetch ACF Upload Enablement
    const serviceAccountQuery = useRedfishResource<ServiceAccount>(
        '/redfish/v1/AccountService/Accounts/service'
    );

    const acfUploadEnablement = computed(() =>
        serviceAccountQuery.data.value?.Oem?.IBM?.ACF?.AllowUnauthACFUpload ?? false
    );

    // Fetch Basic Auth
    const accountServiceQuery = useRedfishResource<AccountService>(
        '/redfish/v1/AccountService'
    );

    const basicAuthEnabled = computed(() =>
        accountServiceQuery.data.value?.Oem?.OpenBMC?.AuthMethods?.BasicAuth ?? true
    );

    // Refetch all policies
    async function loadAllPolicies() {
        await Promise.all([
            biosQuery.refetch(),
            networkProtocolQuery.refetch(),
            managerQuery.refetch(),
            serviceAccountQuery.refetch(),
            systemQuery.refetch(),
            accountServiceQuery.refetch(),
        ]);
    }

    // ---------- Save functions using mutations ----------

    const saveSshMutation = useMutation({
        mutationFn: async (protocolEnabled: boolean): Promise<string> => {
            const ssh = { SSH: { ProtocolEnabled: protocolEnabled } };
            await api.patch('/redfish/v1/Managers/bmc/NetworkProtocol', ssh);
            return protocolEnabled
                ? i18n.global.t('pagePolicies.toast.successEnableBmcShell')
                : i18n.global.t('pagePolicies.toast.successDisableBmcShell');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Managers/bmc/NetworkProtocol'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.ssh'),
                })
            );
        },
    });

    const saveIpmiMutation = useMutation({
        mutationFn: async (protocolEnabled: boolean): Promise<string> => {
            const ipmi = { IPMI: { ProtocolEnabled: protocolEnabled } };
            await api.patch('/redfish/v1/Managers/bmc/NetworkProtocol', ipmi);
            return i18n.global.t('pagePolicies.toast.successIpmiNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.ipmi'),
            });
        },
        onSuccess: () => {
            // Refetch after 30 seconds
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Managers/bmc/NetworkProtocol'] });
            }, 30000);
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.ipmi'),
                })
            );
        },
    });

    const saveTpmMutation = useMutation({
        mutationFn: async (protocolEnabled: boolean): Promise<string> => {
            const data = { Boot: { TrustedModuleRequiredToBoot: protocolEnabled } };
            await api.patch('/redfish/v1/Systems/system', data);
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.hostTpm'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.hostTpm'),
                })
            );
        },
    });

    const saveVtpmMutation = useMutation({
        mutationFn: async (updatedVtpm: string): Promise<string> => {
            await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { pvm_vtpm: updatedVtpm },
            });
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.vtpm'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.vtpm'),
                })
            );
        },
    });

    const saveRtadMutation = useMutation({
        mutationFn: async (updatedRtad: string): Promise<string> => {
            await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { pvm_rtad: updatedRtad },
            });
            return i18n.global.t('pagePolicies.toast.successNextBootToast', {
                policy: i18n.global.t('pagePolicies.rtad'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.rtad'),
                })
            );
        },
    });

    const saveSvleMutation = useMutation({
        mutationFn: async (updatedSvle: string): Promise<string> => {
            await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { hb_secure_ver_lockin_enabled: updatedSvle },
            });
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.secureVersion'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.secureVersion'),
                })
            );
        },
    });

    const saveHostUsbMutation = useMutation({
        mutationFn: async (updatedHostUsb: string): Promise<string> => {
            await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: { hb_host_usb_enablement: updatedHostUsb },
            });
            return i18n.global.t('pagePolicies.toast.successNextBootToast', {
                policy: i18n.global.t('pagePolicies.hostUsb'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.hostUsb'),
                })
            );
        },
    });

    const saveUsbFirmwareMutation = useMutation({
        mutationFn: async (updatedUsbCode: boolean): Promise<string> => {
            const oem = { Oem: { IBM: { USBCodeUpdateEnabled: updatedUsbCode } } };
            await api.patch('/redfish/v1/Managers/bmc', oem);
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/Managers/bmc'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.usbFirmwareUpdatePolicy'),
                })
            );
        },
    });

    const saveAcfUploadMutation = useMutation({
        mutationFn: async (updatedAcfUploadEnablement: boolean): Promise<string> => {
            const oem = {
                Oem: {
                    IBM: {
                        ACF: { AllowUnauthACFUpload: updatedAcfUploadEnablement },
                    },
                },
            };
            await api.patch('/redfish/v1/AccountService/Accounts/service', oem);
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/AccountService/Accounts/service'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.acfUploadEnablement'),
                })
            );
        },
    });

    const saveBasicAuthMutation = useMutation({
        mutationFn: async (updatedBasicAuth: boolean): Promise<string> => {
            await api.patch('/redfish/v1/AccountService', {
                Oem: { OpenBMC: { AuthMethods: { BasicAuth: updatedBasicAuth } } },
            });
            return i18n.global.t('pagePolicies.toast.successNetworkPolicyUpdate', {
                policy: i18n.global.t('pagePolicies.basicAuth'),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'] });
        },
        onError: () => {
            throw new Error(
                i18n.global.t('pagePolicies.toast.errorNetworkPolicyUpdate', {
                    policy: i18n.global.t('pagePolicies.basicAuth'),
                })
            );
        },
    });

    // Wrapper functions to maintain API compatibility
    async function saveSshProtocolState(protocolEnabled: boolean): Promise<string> {
        return await saveSshMutation.mutateAsync(protocolEnabled);
    }

    async function saveIpmiProtocolState(protocolEnabled: boolean): Promise<string> {
        return await saveIpmiMutation.mutateAsync(protocolEnabled);
    }

    async function saveTpmPolicy(protocolEnabled: boolean): Promise<string> {
        return await saveTpmMutation.mutateAsync(protocolEnabled);
    }

    async function saveVtpmState(updatedVtpm: string): Promise<string> {
        return await saveVtpmMutation.mutateAsync(updatedVtpm);
    }

    async function saveRtadState(updatedRtad: string): Promise<string> {
        return await saveRtadMutation.mutateAsync(updatedRtad);
    }

    async function saveSvleState(updatedSvle: string): Promise<string> {
        return await saveSvleMutation.mutateAsync(updatedSvle);
    }

    async function saveHostUsbEnabled(updatedHostUsb: string): Promise<string> {
        return await saveHostUsbMutation.mutateAsync(updatedHostUsb);
    }

    async function saveUsbFirmwareUpdatePolicyEnabled(updatedUsbCode: boolean): Promise<string> {
        return await saveUsbFirmwareMutation.mutateAsync(updatedUsbCode);
    }

    async function saveUnauthenticatedACFUploadEnablement(updatedAcfUploadEnablement: boolean): Promise<string> {
        return await saveAcfUploadMutation.mutateAsync(updatedAcfUploadEnablement);
    }

    async function saveBasicAuthEnabled(updatedBasicAuth: boolean): Promise<string> {
        return await saveBasicAuthMutation.mutateAsync(updatedBasicAuth);
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
