import { computed, ref } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';
import { serverStateMapper } from './useSystemInfo';
import { useRedfishResource, useRedfishCollection } from './useAllSubResources';
import { usePatchResource } from './usePatchResource';

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
  const { patchResource, isPending: isSavingBiosPatch } = usePatchResource();

  const {
    data: rawBiosResource,
    isFetching: isBiosFetching,
    isLoading: isBiosLoading,
    isError: isBiosError,
    refetch: refetchBios,
  } = useRedfishResource<BiosResponse>('/redfish/v1/Systems/system/Bios', {
    queryConfig: RedfishQueryPresets.metadata as Partial<UseQueryOptions<BiosResponse>>,
  });

  const rawBios = computed<BiosAttributes>(() => {
    const attrs = rawBiosResource.value?.Attributes ?? {};
    return BOOT_ATTRIBUTE_KEYS.reduce<BiosAttributes>((obj, key) => {
      if (key in attrs) obj[key] = attrs[key];
      return obj;
    }, {});
  });

  // ─── Registry data (attribute values / dropdown options) ─────────────────

  const {
    data: rawRegistryResource,
    isFetching: isRegistryFetching,
    isLoading: isRegistryLoading,
    isError: isRegistryError,
    refetch: refetchRegistry,
  } = useRedfishResource<RegistryResponse>(
    '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
    {
      queryConfig: RedfishQueryPresets.metadata as Partial<UseQueryOptions<RegistryResponse>>,
    },
  );

  const rawRegistry = computed<RegistryAttribute[]>(
    () => rawRegistryResource.value?.RegistryEntries?.Attributes ?? [],
  );

  // ─── Derived: attributeValues (maps attribute name → dropdown options) ────

  const attributeValues = computed(() => {
    if (!rawRegistry.value?.length) return null;
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

  const saveBiosSettings = async (biosSettings: BiosAttributes): Promise<string> => {
    // Optimistically update the cache with the saved values so the UI
    // reflects what was saved without a re-fetch. The PATCH goes to
    // /Bios/Settings (pending buffer) while GET /Bios returns committed
    // values — they won't match until after a reboot, so a re-fetch
    // would just overwrite the UI with stale old data.
    await patchResource({
      endpoint: '/redfish/v1/Systems/system/Bios/Settings',
      field: 'Attributes',
      value: biosSettings,
      onSuccess: () => {
        queryClient.setQueryData(
          ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'],
          (old: BiosResponse | undefined) => ({
            ...old,
            Attributes: { ...(old?.Attributes ?? {}), ...biosSettings },
          }),
        );
      },
    });
    return i18n.global.t('pageServerPowerOperations.toast.successSaveSettings');
  };

  // ─── Save operating mode settings mutation ───────────────────────────────

  const saveOperatingModeSettings = async (payload: {
    powerRestorePolicy: string;
    automaticRetryConfig: string;
    bootFault: string;
  }): Promise<void> => {
    await patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'PowerRestorePolicy',
      value: payload.powerRestorePolicy,
      additionalFields: {
        Boot: {
          AutomaticRetryConfig: payload.automaticRetryConfig,
          StopBootOnFault: payload.bootFault,
        },
      },
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system'],
      ],
    });
  };

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
    saveBiosSettings,
    isSavingBios: isSavingBiosPatch,
    saveOperatingModeSettings,
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
  } = useRedfishResource<SystemResponse>('/redfish/v1/Systems/system', {
    queryConfig: RedfishQueryPresets.metadata as Partial<UseQueryOptions<SystemResponse>>,
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
    data: rawBmc,
    isFetching,
    isLoading,
    isError,
    refetch,
  } = useRedfishResource<BmcResponse>('/redfish/v1/Managers/bmc', {
    queryConfig: RedfishQueryPresets.metadata as Partial<UseQueryOptions<BmcResponse>>,
  });

  const bmc = computed<BmcInfo | null>(() => {
    const d = rawBmc.value;
    if (!d) return null;
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
  });

  return { bmc, isFetching, isLoading, isError, refetch };
}

// ─── Composable: Location Codes ──────────────────────────────────────────────

interface ChassisWithPcieSlots extends Resource {
  PCIeSlots?: {
    Slots: Array<{
      Links?: { PCIeDevice?: any[] };
      Location?: { PartLocation?: { ServiceLabel?: string } };
    }>;
  };
}

export function useLocationCodes() {
  const {
    data: chassisMembers,
    isFetching,
    isError,
    refetch,
  } = useRedfishCollection<ChassisWithPcieSlots>('/redfish/v1/Chassis', {
    expand: true,
    expandLevels: 2,
    queryConfig: RedfishQueryPresets.metadata as Partial<UseQueryOptions<ChassisWithPcieSlots[]>>,
  });

  type PcieSlot = NonNullable<ChassisWithPcieSlots['PCIeSlots']>['Slots'][number];

  const locationCodes = computed<string[]>(() => {
    const codes: string[] = [];
    (chassisMembers.value ?? []).forEach((chassis: ChassisWithPcieSlots) => {
      chassis.PCIeSlots?.Slots.forEach((slot: PcieSlot) => {
        if (
          slot.Links?.PCIeDevice?.length &&
          slot.Location?.PartLocation?.ServiceLabel
        ) {
          codes.push(slot.Location.PartLocation.ServiceLabel);
        }
      });
    });
    return codes;
  });

  return { locationCodes, isFetching, isError, refetch };
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
