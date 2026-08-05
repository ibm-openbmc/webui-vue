import { computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';
import { serverStateMapper } from './useSystemInfo';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BiosAttributes {
  pvm_system_operating_mode?: string;
  pvm_system_power_off_policy?: string;
  pvm_stop_at_standby?: string;
  pvm_default_os_type?: string;
  pvm_rpa_boot_mode?: string;
  pvm_os_boot_type?: string;
  pvm_sys_dump_active?: string;
  pvm_linux_kvm_memory?: string;
  pvm_linux_kvm_percentage?: number;
  pvm_ibmi_load_source?: string;
  pvm_ibmi_alt_load_source?: string;
  pvm_ibmi_console?: string;
  [key: string]: any;
}

export interface BiosResponse extends Resource {
  Attributes?: BiosAttributes;
}

export interface RegistryAttribute {
  AttributeName: string;
  CurrentValue?: any;
  UpperBound?: number;
  LowerBound?: number;
  MaxLength?: number;
  Value?: Array<{ ValueName: string }>;
}

export interface RegistryResponse extends Resource {
  RegistryEntries?: {
    Attributes: RegistryAttribute[];
  };
}

export interface SystemResponse extends Resource {
  PowerState?: string;
  Status?: { State?: string };
  LastResetTime?: string;
  BootProgress?: { LastState?: string };
  Boot?: {
    AutomaticRetryConfig?: string;
    StopBootOnFault?: string;
  };
  PowerRestorePolicy?: string;
  PCIeSlots?: {
    Slots: Array<{
      Links?: { PCIeDevice?: Array<{ '@odata.id': string }> };
      Location?: { PartLocation?: { ServiceLabel?: string } };
    }>;
  };
}

export interface ChassisCollection {
  Members: Array<{ '@odata.id': string }>;
}

export interface ChassisResponse extends Resource {
  PCIeSlots?: {
    Slots: Array<{
      Links?: { PCIeDevice?: Array<{ '@odata.id': string }> };
      Location?: { PartLocation?: { ServiceLabel?: string } };
    }>;
  };
}

export interface BmcResponse extends Resource {
  DateTime?: string;
  PowerState?: string;
  Status?: { Health?: string; State?: string };
  Location?: { PartLocation?: { ServiceLabel?: string } };
  Model?: string;
  PartNumber?: string;
  SerialNumber?: string;
  SparePartNumber?: string;
  Description?: string;
  LocationIndicatorActive?: boolean;
}

// ─── BIOS Attributes Keys ────────────────────────────────────────────────────

const BOOT_ATTRIBUTE_KEYS = [
  'pvm_system_operating_mode',
  'pvm_system_power_off_policy',
  'pvm_stop_at_standby',
  'pvm_default_os_type',
  'pvm_rpa_boot_mode',
  'pvm_os_boot_type',
  'pvm_sys_dump_active',
  'pvm_linux_kvm_memory',
] as const;

// ─── Composable: BIOS Attributes ─────────────────────────────────────────────

/**
 * Fetch and cache filtered BIOS attributes for the boot settings page.
 */
export function useBootBiosAttributes() {
  const queryClient = useQueryClient();

  const {
    data: rawBios,
    isFetching: isBiosFetching,
    isLoading: isBiosLoading,
    isError: isBiosError,
    refetch: refetchBios,
  } = useQuery({
    queryKey: ['spo', 'bios', 'attributes'],
    queryFn: async (): Promise<BiosAttributes> => {
      const response = await api.get<BiosResponse>(
        '/redfish/v1/Systems/system/Bios',
      );
      const attrs = response.data?.Attributes ?? {};
      return BOOT_ATTRIBUTE_KEYS.reduce<BiosAttributes>((obj, key) => {
        if (key in attrs) obj[key] = attrs[key];
        return obj;
      }, {});
    },
    ...(RedfishQueryPresets.metadata as Partial<UseQueryOptions<BiosAttributes>>),
  });

  // ─── Registry data (attribute values / dropdown options) ─────────────────

  const {
    data: rawRegistry,
    isFetching: isRegistryFetching,
    isLoading: isRegistryLoading,
    isError: isRegistryError,
    refetch: refetchRegistry,
  } = useQuery({
    queryKey: ['spo', 'bios', 'registry'],
    queryFn: async (): Promise<RegistryAttribute[]> => {
      const response = await api.get<RegistryResponse>(
        '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
      );
      return response.data?.RegistryEntries?.Attributes ?? [];
    },
    ...(RedfishQueryPresets.metadata as Partial<UseQueryOptions<RegistryAttribute[]>>),
  });

  // ─── Derived: attributeValues (maps attribute name → dropdown options) ────

  const attributeValues = computed(() => {
    if (!rawRegistry.value) return null;
    const attrs = rawRegistry.value;

    return BOOT_ATTRIBUTE_KEYS.filter(
      (k) => k !== 'pvm_sys_dump_active',
    ).reduce<Record<string, Array<{ value: string; text: string }>>>(
      (obj, attrName) => {
        const found = attrs.filter((a) => a.AttributeName === attrName);
        if (!found.length) return obj;
        const attrObj = found[0];
        if (!attrObj.Value?.length) return obj;
        const localizedKeys = [
          'pvm_default_os_type',
          'pvm_os_boot_type',
          'pvm_rpa_boot_mode',
          'pvm_stop_at_standby',
          'pvm_system_operating_mode',
          'pvm_linux_kvm_memory',
        ];
        obj[attrName] = attrObj.Value.map((item) => ({
          value: item.ValueName,
          text: localizedKeys.includes(attrName)
            ? i18n.global.t(
                `pageServerPowerOperations.biosSettings.attributeValues.${attrName}.${item.ValueName}`,
              )
            : item.ValueName,
        }));
        return obj;
      },
      {},
    );
  });

  // ─── Derived: linux KVM percentage values ────────────────────────────────

  const linuxKvmPercentageValue = computed(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_linux_kvm_percentage',
    );
    return found ? (found.CurrentValue ?? 0) / 10 : null;
  });

  const linuxKvmPercentageInitialValue = computed(
    () => linuxKvmPercentageValue.value,
  );

  const linuxKvmPercentageCurrentValue = computed(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_linux_kvm_percentage_current',
    );
    return found ? (found.CurrentValue ?? 0) / 10 : null;
  });

  // ─── Derived: IBM i tagged settings ──────────────────────────────────────

  const ibmiLoadSourceValue = computed(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_ibmi_load_source',
    );
    return found?.CurrentValue ?? 'Current configuration';
  });

  const ibmiAltLoadSourceValue = computed(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_ibmi_alt_load_source',
    );
    return found?.CurrentValue ?? 'Current configuration';
  });

  const ibmiConsoleValue = computed(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_ibmi_console',
    );
    return found?.CurrentValue ?? 'Current configuration';
  });

  // ─── Derived: hmcManaged ─────────────────────────────────────────────────

  const hmcManaged = computed<string | null>(() => {
    const found = rawRegistry.value?.find(
      (a) => a.AttributeName === 'pvm_hmc_managed',
    );
    return found?.CurrentValue ?? null;
  });

  // ─── Save BIOS settings mutation ─────────────────────────────────────────

  const saveBiosSettingsMutation = useMutation({
    mutationFn: async (biosSettings: BiosAttributes): Promise<string> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: biosSettings,
      });
      return i18n.global.t(
        'pageServerPowerOperations.toast.successSaveSettings',
      );
    },
    onSuccess: (_result, biosSettings) => {
      // Optimistically update the cache with the saved values so the UI
      // reflects what was saved without a re-fetch. The PATCH goes to
      // /Bios/Settings (pending buffer) while GET /Bios returns committed
      // values — they won't match until after a reboot, so a re-fetch
      // would just overwrite the UI with stale old data.
      queryClient.setQueryData(
        ['spo', 'bios', 'attributes'],
        (old: BiosAttributes | undefined) => ({ ...old, ...biosSettings }),
      );
    },
  });

  // ─── Save operating mode settings mutation ───────────────────────────────

  const saveOperatingModeSettingsMutation = useMutation({
    mutationFn: async (payload: {
      powerRestorePolicy: string;
      automaticRetryConfig: string;
      bootFault: string;
    }): Promise<void> => {
      await api.patch('/redfish/v1/Systems/system', {
        PowerRestorePolicy: payload.powerRestorePolicy,
        Boot: {
          AutomaticRetryConfig: payload.automaticRetryConfig,
          StopBootOnFault: payload.bootFault,
        },
      });
    },
  });

  // ─── Standby to runtime mutation ─────────────────────────────────────────

  const standbyToRuntimeMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      await api.post(
        '/redfish/v1/Systems/hypervisor/Actions/ComputerSystem.Reset',
        { ResetType: 'On' },
      );
      return i18n.global.t(
        'pageServerPowerOperations.toast.successSaveSettings',
      );
    },
  });

  return {
    // Raw data
    biosAttributes: rawBios,
    registryAttributes: rawRegistry,

    // Derived data
    attributeValues,
    linuxKvmPercentageValue,
    linuxKvmPercentageInitialValue,
    linuxKvmPercentageCurrentValue,
    ibmiLoadSourceValue,
    ibmiAltLoadSourceValue,
    ibmiConsoleValue,
    hmcManaged,

    // Loading states
    isBiosFetching,
    isRegistryFetching,
    isFetching: computed(
      () => isBiosFetching.value || isRegistryFetching.value,
    ),
    isLoading: computed(() => isBiosLoading.value || isRegistryLoading.value),
    isError: computed(() => isBiosError.value || isRegistryError.value),

    // Actions
    refetchBios,
    refetchRegistry,
    refetch: () => {
      refetchBios();
      refetchRegistry();
    },
    saveBiosSettings: saveBiosSettingsMutation.mutateAsync,
    isSavingBios: saveBiosSettingsMutation.isPending,
    saveOperatingModeSettings: saveOperatingModeSettingsMutation.mutateAsync,
    standbyToRuntime: standbyToRuntimeMutation.mutateAsync,
    isStandbyToRuntimePending: standbyToRuntimeMutation.isPending,
  };
}

// ─── Composable: System Info ─────────────────────────────────────────────────

/**
 * Fetch system status, last power operation time, and boot progress.
 */
export function useServerSystemInfo() {
  const {
    data: systemData,
    isFetching: isSystemFetching,
    isLoading: isSystemLoading,
    isError: isSystemError,
    refetch: refetchSystem,
  } = useQuery({
    queryKey: ['spo', 'system'],
    queryFn: async (): Promise<SystemResponse> => {
      const response = await api.get<SystemResponse>(
        '/redfish/v1/Systems/system',
      );
      return response.data;
    },
    ...(RedfishQueryPresets.metadata as Partial<UseQueryOptions<SystemResponse>>),
  });

  const serverStatus = computed(() => {
    if (!systemData.value) return 'unreachable';
    const { PowerState, Status } = systemData.value;
    if (Status?.State === 'Quiesced' || Status?.State === 'InTest') {
      return serverStateMapper(Status.State);
    }
    return serverStateMapper(PowerState ?? '');
  });

  const powerRestorePolicy = computed(
    () => systemData.value?.PowerRestorePolicy ?? '',
  );
  const automaticRetryConfig = computed(
    () => systemData.value?.Boot?.AutomaticRetryConfig ?? '',
  );
  const bootFault = computed(
    () => systemData.value?.Boot?.StopBootOnFault ?? '',
  );

  // Derive lastPowerOperationTime from the same system query — no extra request.
  const lastPowerOperationTime = computed(() => {
    const raw = systemData.value?.LastResetTime;
    return raw ? new Date(raw) : null;
  });

  return {
    serverStatus,
    powerRestorePolicy,
    automaticRetryConfig,
    bootFault,
    lastPowerOperationTime,
    isSystemFetching,
    isSystemLoading,
    isSystemError,
    refetchSystem,
  };
}

// ─── BMC info return type ─────────────────────────────────────────────────────

export interface BmcInfo {
  dateTime: Date | null;
  description: string | null;
  health: string | null;
  id: string;
  identifyLed: boolean;
  locationNumber: string | null;
  model: string | null;
  name: string;
  partNumber: string | null;
  powerState: string | null;
  serialNumber: string | null;
  sparePartNumber: string | null;
  statusState: string | null;
  uri: string;
}

// ─── Composable: BMC Info ─────────────────────────────────────────────────────

export function useServerBmcInfo() {
  const {
    data: bmcData,
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['spo', 'bmc'],
    queryFn: async (): Promise<BmcInfo> => {
      const response = await api.get<BmcResponse>('/redfish/v1/Managers/bmc');
      const d = response.data;
      return {
        dateTime: d.DateTime ? new Date(d.DateTime) : null,
        description: d.Description ?? null,
        health: d.Status?.Health ?? null,
        id: d.Id,
        identifyLed: d.LocationIndicatorActive ?? false,
        locationNumber: d.Location?.PartLocation?.ServiceLabel ?? null,
        model: d.Model ?? null,
        name: d.Name,
        partNumber: d.PartNumber ?? null,
        powerState: d.PowerState ?? null,
        serialNumber: d.SerialNumber ?? null,
        sparePartNumber: d.SparePartNumber ?? null,
        statusState: d.Status?.State ?? null,
        uri: d['@odata.id'],
      };
    },
    ...(RedfishQueryPresets.metadata as Partial<UseQueryOptions<BmcInfo>>),
  });

  return { bmc: bmcData, isFetching, isLoading, isError, refetch };
}

// ─── Composable: Location Codes ──────────────────────────────────────────────

export function useLocationCodes() {
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['spo', 'locationCodes'],
    queryFn: async (): Promise<string[]> => {
      const response = await api.get<{
        Members: Array<{
          PCIeSlots?: {
            Slots: Array<{
              Links?: { PCIeDevice?: any[] };
              Location?: { PartLocation?: { ServiceLabel?: string } };
            }>;
          };
        }>;
      }>('/redfish/v1/Chassis?$expand=.($levels=2)');
      const codes: string[] = [];
      response.data.Members.forEach((chassis) => {
        chassis.PCIeSlots?.Slots.forEach((slot) => {
          if (
            slot.Links?.PCIeDevice?.length &&
            slot.Location?.PartLocation?.ServiceLabel
          ) {
            codes.push(slot.Location.PartLocation.ServiceLabel);
          }
        });
      });
      return codes;
    },
    ...(RedfishQueryPresets.metadata as Partial<UseQueryOptions<string[]>>),
  });

  return { locationCodes: data, isFetching, isError, refetch };
}

// ─── Composable: Server Power Control ────────────────────────────────────────

/**
 * Provides power control operations with in-progress tracking
 */
export function useServerPowerControl() {
  const queryClient = useQueryClient();
  const isOperationInProgress = ref(false);

  const waitForStatus = (targetStatus: string): Promise<void> => {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve();
        cleanup();
      }, 300_000 /* 5 min */);

      let interval: ReturnType<typeof setInterval>;

      const checkStatus = async () => {
        try {
          const response = await api.get<{
            PowerState?: string;
            Status?: { State?: string };
          }>('/redfish/v1/Systems/system');
          const d = response.data;
          let status = 'unreachable';
          if (d.Status?.State === 'Quiesced' || d.Status?.State === 'InTest') {
            status = serverStateMapper(d.Status.State);
          } else {
            status = serverStateMapper(d.PowerState ?? '');
          }
          if (status === targetStatus) {
            resolve();
            cleanup();
          }
        } catch {
          // ignore polling errors
        }
      };

      interval = setInterval(checkStatus, 5000);

      const cleanup = () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    });
  };

  const powerChange = async (data: { ResetType: string }): Promise<boolean> => {
    isOperationInProgress.value = true;
    await api.post(
      '/redfish/v1/Systems/system/Actions/ComputerSystem.Reset',
      data,
    );
    return true;
  };

  const afterOps = async (targetStatus: string) => {
    await waitForStatus(targetStatus);
    isOperationInProgress.value = false;
    queryClient.invalidateQueries({ queryKey: ['spo', 'system'] });
  };

  const serverPowerOnMutation = useMutation({
    mutationFn: async () => {
      const result = await powerChange({ ResetType: 'On' });
      afterOps('on');
      return result;
    },
    onError: () => {
      isOperationInProgress.value = false;
    },
  });

  const serverSoftRebootMutation = useMutation({
    mutationFn: async () => {
      const result = await powerChange({ ResetType: 'GracefulRestart' });
      afterOps('on');
      return result;
    },
    onError: () => {
      isOperationInProgress.value = false;
    },
  });

  const serverHardRebootMutation = useMutation({
    mutationFn: async () => {
      const result = await powerChange({ ResetType: 'ForceRestart' });
      afterOps('on');
      return result;
    },
    onError: () => {
      isOperationInProgress.value = false;
    },
  });

  const serverSoftPowerOffMutation = useMutation({
    mutationFn: async () => {
      const result = await powerChange({ ResetType: 'GracefulShutdown' });
      afterOps('off');
      return result;
    },
    onError: () => {
      isOperationInProgress.value = false;
    },
  });

  const serverHardPowerOffMutation = useMutation({
    mutationFn: async () => {
      const result = await powerChange({ ResetType: 'ForceOff' });
      afterOps('off');
      return result;
    },
    onError: () => {
      isOperationInProgress.value = false;
    },
  });

  return {
    isOperationInProgress,
    serverPowerOn: serverPowerOnMutation.mutateAsync,
    serverSoftReboot: serverSoftRebootMutation.mutateAsync,
    serverHardReboot: serverHardRebootMutation.mutateAsync,
    serverSoftPowerOff: serverSoftPowerOffMutation.mutateAsync,
    serverHardPowerOff: serverHardPowerOffMutation.mutateAsync,
  };
}
