import { computed, ref, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

interface SystemData {
    LastResetTime?: string;
    PowerRestorePolicy?: string;
    Boot?: {
        AutomaticRetryConfig?: string;
        StopBootOnFault?: string;
    };
}

interface BiosData {
    Attributes: Record<string, any>;
}

interface BiosAttributeRegistry {
    RegistryEntries: {
        Attributes: Array<{
            AttributeName: string;
            CurrentValue?: number;
            Value?: Array<{
                ValueName: string;
            }>;
        }>;
    };
}

interface PowerOperationData {
    ResetType: 'On' | 'GracefulRestart' | 'ForceRestart' | 'GracefulShutdown' | 'ForceOff';
}

interface BiosSettings {
    [key: string]: any;
}

interface SaveSettingsParams {
    biosSettings?: BiosSettings;
}

interface ChassisData {
    Members: Array<{
        PCIeSlots?: {
            Slots?: Array<{
                Links?: {
                    PCIeDevice?: any[];
                };
                Location?: {
                    PartLocation?: {
                        ServiceLabel?: string;
                    };
                };
            }>;
        };
    }>;
}

/**
 * Composable for Server Power Operations
 * Replaces ControlStore and parts of BootSettingsStore with TanStack Query
 */
export function useServerPowerOperations() {
    const queryClient = useQueryClient();
    const isOperationInProgress = ref(false);

    const attributeKeys = [
        'pvm_system_operating_mode',
        'pvm_system_power_off_policy',
        'pvm_stop_at_standby',
        'pvm_default_os_type',
        'pvm_rpa_boot_mode',
        'pvm_os_boot_type',
        'pvm_sys_dump_active',
        'pvm_linux_kvm_memory',
    ];

    // Fetch last power operation time and system settings
    const {
        data: systemData,
        isLoading: isSystemLoading,
        isFetching: isSystemFetching,
        refetch: refetchSystem,
    } = useQuery({
        queryKey: ['redfish', 'systems', 'system'],
        queryFn: async (): Promise<SystemData> => {
            const response = await api.get<SystemData>('/redfish/v1/Systems/system');
            return response.data;
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount: number, err: any) => {
            const status = err?.response?.status;
            if (status && status >= 400 && status < 500) return false;
            return failureCount < 2;
        },
        retryDelay: (attemptIndex: number) =>
            Math.min(1000 * 2 ** attemptIndex, 10000),
    });

    // Fetch BIOS attributes
    const {
        data: biosData,
        isLoading: isBiosLoading,
        isFetching: isBiosFetching,
        refetch: refetchBios,
    } = useQuery({
        queryKey: ['redfish', 'systems', 'system', 'bios'],
        queryFn: async (): Promise<BiosData> => {
            const response = await api.get<BiosData>('/redfish/v1/Systems/system/Bios');
            return response.data;
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

    // Fetch BIOS attribute registry
    const {
        data: biosRegistryData,
        isLoading: isBiosRegistryLoading,
        refetch: refetchBiosRegistry,
    } = useQuery({
        queryKey: ['redfish', 'registries', 'biosAttributeRegistry'],
        queryFn: async (): Promise<BiosAttributeRegistry> => {
            const response = await api.get<BiosAttributeRegistry>(
                '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
            );
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount: number, err: any) => {
            const status = err?.response?.status;
            if (status && status >= 400 && status < 500) return false;
            return failureCount < 2;
        },
    });

    // Fetch location codes
    const {
        data: locationCodesData,
        isLoading: isLocationCodesLoading,
        refetch: refetchLocationCodes,
    } = useQuery({
        queryKey: ['redfish', 'chassis', 'locationCodes'],
        queryFn: async (): Promise<string[]> => {
            const response = await api.get<ChassisData>(
                '/redfish/v1/Chassis?$expand=.($levels=2)',
            );
            const locationCodes: string[] = [];
            response.data.Members.forEach((chassis) => {
                chassis.PCIeSlots?.Slots?.forEach((pcieSlot) => {
                    if (
                        pcieSlot?.Links?.PCIeDevice &&
                        pcieSlot.Links.PCIeDevice.length > 0 &&
                        pcieSlot?.Location?.PartLocation?.ServiceLabel
                    ) {
                        locationCodes.push(pcieSlot.Location.PartLocation.ServiceLabel);
                    }
                });
            });
            return locationCodes;
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // Computed values
    const lastPowerOperationTime = computed<Date | null>(() => {
        const lastReset = systemData.value?.LastResetTime;
        if (!lastReset) return null;
        return new Date(lastReset);
    });

    const powerRestorePolicyValue = computed<string | undefined>(
        () => systemData.value?.PowerRestorePolicy,
    );

    const automaticRetryConfigValue = computed<string | undefined>(
        () => systemData.value?.Boot?.AutomaticRetryConfig,
    );

    const bootFault = computed<string | undefined>(
        () => systemData.value?.Boot?.StopBootOnFault,
    );

    const biosAttributes = computed<Record<string, any> | null>(() => {
        if (!biosData.value?.Attributes) return null;
        const filteredAttributes = attributeKeys
            .filter((key) => Object.keys(biosData.value.Attributes).includes(key))
            .reduce((obj, key) => {
                return {
                    ...obj,
                    [key]: biosData.value.Attributes[key],
                };
            }, {} as Record<string, any>);
        return filteredAttributes;
    });

    const systemDumpActive = computed<boolean>(
        () => (biosAttributes.value as any)?.pvm_sys_dump_active === 'Enabled',
    );

    const attributeValues = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return null;

        const attributes = biosRegistryData.value.RegistryEntries.Attributes;
        const filteredAttributeValues = attributeKeys
            .reduce((arr: any[], attriValue) => {
                return [
                    ...arr,
                    ...attributes.filter((value) => {
                        return (
                            attriValue !== 'pvm_sys_dump_active' &&
                            attriValue === value.AttributeName
                        );
                    }),
                ];
            }, [])
            .reduce((obj: any, attributeObj: any) => {
                return {
                    ...obj,
                    [attributeObj?.AttributeName]: attributeObj.Value.map(
                        (item: any) => {
                            return {
                                value: item.ValueName,
                                text:
                                    [
                                        'pvm_default_os_type',
                                        'pvm_os_boot_type',
                                        'pvm_rpa_boot_mode',
                                        'pvm_stop_at_standby',
                                        'pvm_system_operating_mode',
                                        'pvm_linux_kvm_memory',
                                    ].indexOf(attributeObj.AttributeName) >= 0
                                        ? i18n.global.t(
                                              `pageServerPowerOperations.biosSettings.attributeValues.${attributeObj.AttributeName}.${item.ValueName}`,
                                          )
                                        : item.ValueName,
                            };
                        },
                    ),
                };
            }, {});
        return filteredAttributeValues;
    });

    const linuxKvmPercentageValue = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return null;
        const linuxPercentObj = biosRegistryData.value.RegistryEntries.Attributes.find(
            (itm) => itm.AttributeName === 'pvm_linux_kvm_percentage',
        );
        return linuxPercentObj?.CurrentValue ? linuxPercentObj.CurrentValue / 10 : null;
    });

    const linuxKvmPercentageCurrentValue = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return null;
        const linuxPercentCurrentObj = biosRegistryData.value.RegistryEntries.Attributes.find(
            (itm) => itm.AttributeName === 'pvm_linux_kvm_percentage_current',
        );
        return linuxPercentCurrentObj?.CurrentValue
            ? linuxPercentCurrentObj.CurrentValue / 10
            : null;
    });

    const ibmiLoadSource = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return 'Current configuration';
        const ibmi_load_source = biosRegistryData.value.RegistryEntries.Attributes.find(
            (itm) => itm.AttributeName === 'pvm_ibmi_load_source',
        );
        return ibmi_load_source?.CurrentValue || 'Current configuration';
    });

    const ibmiAltLoadSource = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return 'Current configuration';
        const ibmi_alt_load_source = biosRegistryData.value.RegistryEntries.Attributes.find(
            (itm) => itm.AttributeName === 'pvm_ibmi_alt_load_source',
        );
        return ibmi_alt_load_source?.CurrentValue || 'Current configuration';
    });

    const ibmiConsole = computed(() => {
        if (!biosRegistryData.value?.RegistryEntries?.Attributes) return 'Current configuration';
        const ibmi_console = biosRegistryData.value.RegistryEntries.Attributes.find(
            (itm) => itm.AttributeName === 'pvm_ibmi_console',
        );
        return ibmi_console?.CurrentValue || 'Current configuration';
    });

    const locationCodes = computed<string[]>(() => locationCodesData.value || []);

    // Power operation mutation
    const powerOperationMutation = useMutation({
        mutationFn: async (data: PowerOperationData): Promise<boolean> => {
            isOperationInProgress.value = true;
            await api.post('/redfish/v1/Systems/system/Actions/ComputerSystem.Reset', data);
            return true;
        },
        onSuccess: () => {
            // Invalidate system data to refresh last power operation time
            queryClient.invalidateQueries({
                queryKey: ['redfish', 'systems', 'system'],
            });
        },
        onError: (error: Error) => {
            console.error('Power operation error:', error);
            isOperationInProgress.value = false;
            throw new Error(
                i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
            );
        },
    });

    // Save BIOS settings mutation
    const saveBiosSettingsMutation = useMutation({
        mutationFn: async (biosSettings: BiosSettings): Promise<void> => {
            await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
                Attributes: biosSettings,
            });
        },
        onError: (error: Error) => {
            console.error('Save BIOS settings error:', error);
            throw new Error(
                i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
            );
        },
    });

    // Save operating mode settings mutation
    const saveOperatingModeSettingsMutation = useMutation({
        mutationFn: async (params: {
            powerRestorePolicy?: string;
            automaticRetryConfig?: string;
            stopBootOnFault?: string;
        }): Promise<void> => {
            await api.patch('/redfish/v1/Systems/system', {
                PowerRestorePolicy: params.powerRestorePolicy,
                Boot: {
                    AutomaticRetryConfig: params.automaticRetryConfig,
                    StopBootOnFault: params.stopBootOnFault,
                },
            });
        },
        onError: (error: Error) => {
            console.error('Save operating mode settings error:', error);
            throw new Error(
                i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
            );
        },
    });

    // Standby to runtime mutation
    const standbyToRuntimeMutation = useMutation({
        mutationFn: async (): Promise<string> => {
            await api.post('/redfish/v1/Systems/hypervisor/Actions/ComputerSystem.Reset', {
                ResetType: 'On',
            });
            return i18n.global.t('pageServerPowerOperations.toast.successSaveSettings');
        },
        onError: (error: Error) => {
            console.error('Standby to runtime error:', error);
            throw new Error(
                i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
            );
        },
    });

    // Power operation functions
    async function serverPowerOn(): Promise<boolean> {
        return await powerOperationMutation.mutateAsync({ ResetType: 'On' });
    }

    async function serverSoftReboot(): Promise<boolean> {
        return await powerOperationMutation.mutateAsync({ ResetType: 'GracefulRestart' });
    }

    async function serverHardReboot(): Promise<boolean> {
        return await powerOperationMutation.mutateAsync({ ResetType: 'ForceRestart' });
    }

    async function serverSoftPowerOff(): Promise<boolean> {
        return await powerOperationMutation.mutateAsync({ ResetType: 'GracefulShutdown' });
    }

    async function serverHardPowerOff(): Promise<boolean> {
        return await powerOperationMutation.mutateAsync({ ResetType: 'ForceOff' });
    }

    async function saveBiosSettings(biosSettings: BiosSettings): Promise<void> {
        await saveBiosSettingsMutation.mutateAsync(biosSettings);
    }

    async function saveOperatingModeSettings(params: {
        powerRestorePolicy?: string;
        automaticRetryConfig?: string;
        stopBootOnFault?: string;
    }): Promise<void> {
        await saveOperatingModeSettingsMutation.mutateAsync(params);
    }

    async function saveSettings(params: SaveSettingsParams): Promise<string> {
        if (params.biosSettings) {
            await saveBiosSettings(params.biosSettings);
            // Also save operating mode settings if needed
            if (powerRestorePolicyValue.value || automaticRetryConfigValue.value || bootFault.value) {
                await saveOperatingModeSettings({
                    powerRestorePolicy: powerRestorePolicyValue.value,
                    automaticRetryConfig: automaticRetryConfigValue.value,
                    stopBootOnFault: bootFault.value,
                });
            }
        }
        return i18n.global.t('pageServerPowerOperations.toast.successSaveSettings');
    }

    async function standbyToRuntime(): Promise<string> {
        return await standbyToRuntimeMutation.mutateAsync();
    }

    return {
        // Data
        lastPowerOperationTime,
        powerRestorePolicyValue,
        automaticRetryConfigValue,
        bootFault,
        biosAttributes,
        systemDumpActive,
        attributeValues,
        linuxKvmPercentageValue,
        linuxKvmPercentageCurrentValue,
        ibmiLoadSource,
        ibmiAltLoadSource,
        ibmiConsole,
        locationCodes,
        isOperationInProgress,
        // Loading states
        isLoading: computed(
            () =>
                isSystemLoading.value ||
                isBiosLoading.value ||
                isBiosRegistryLoading.value ||
                isLocationCodesLoading.value,
        ),
        isFetching: computed(() => isSystemFetching.value || isBiosFetching.value),
        // Actions
        serverPowerOn,
        serverSoftReboot,
        serverHardReboot,
        serverSoftPowerOff,
        serverHardPowerOff,
        saveBiosSettings,
        saveOperatingModeSettings,
        saveSettings,
        standbyToRuntime,
        refetchSystem,
        refetchBios,
        refetchBiosRegistry,
        refetchLocationCodes,
        // Mutation states
        isPowerOperating: powerOperationMutation.isPending,
        isSavingBios: saveBiosSettingsMutation.isPending,
        isSavingOperatingMode: saveOperatingModeSettingsMutation.isPending,
        isStandbyToRuntime: standbyToRuntimeMutation.isPending,
    };
}