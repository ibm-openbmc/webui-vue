import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { RedfishQueryPresets } from './shared/queryConfig';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BiosAttributes {
  pvm_system_operating_mode?: string;
  pvm_system_power_off_policy?: string;
  pvm_stop_at_standby?: string;
  pvm_default_os_type?: string;
  pvm_rpa_boot_mode?: string;
  pvm_os_boot_type?: string;
  pvm_sys_dump_active?: string;
  pvm_linux_kvm_memory?: string;
  [key: string]: any;
}

const BIOS_ATTRIBUTE_KEYS = [
  'pvm_system_operating_mode',
  'pvm_system_power_off_policy',
  'pvm_stop_at_standby',
  'pvm_default_os_type',
  'pvm_rpa_boot_mode',
  'pvm_os_boot_type',
  'pvm_sys_dump_active',
  'pvm_linux_kvm_memory',
] as const;

interface RegistryAttribute {
  AttributeName: string;
  CurrentValue?: any;
  UpperBound?: number;
  Value?: Array<{ ValueName: string }>;
}

interface OperatingModeSettings {
  powerRestorePolicyValue: string;
  automaticRetryConfigValue: string;
  bootFault: string;
}

// ── Query keys ───────────────────────────────────────────────────────────────

export const BIOS_QUERY_KEY = ['redfish', 'systems', 'system', 'bios'] as const;
export const BIOS_REGISTRY_QUERY_KEY = [
  'redfish',
  'registries',
  'bios',
] as const;
export const OPERATING_MODE_QUERY_KEY = [
  'redfish',
  'systems',
  'system',
  'operatingMode',
] as const;

// ── Composable ───────────────────────────────────────────────────────────────

/**
 * Composable for fetching and mutating boot/BIOS settings.
 * Replaces BootSettingsStore with TanStack Query.
 */
export function useBootSettings() {
  const queryClient = useQueryClient();

  // ── BIOS Attributes ────────────────────────────────────────────────────────

  const {
    data: biosAttributesRaw,
    isLoading: isLoadingBios,
    isFetching: isFetchingBios,
    refetch: refetchBios,
  } = useQuery({
    queryKey: BIOS_QUERY_KEY,
    queryFn: async (): Promise<BiosAttributes> => {
      const response = await api.get('/redfish/v1/Systems/system/Bios');
      const attrs = response.data?.Attributes ?? {};
      // Filter to only the keys the app cares about
      return BIOS_ATTRIBUTE_KEYS.reduce<BiosAttributes>((obj, key) => {
        if (key in attrs) obj[key] = attrs[key];
        return obj;
      }, {});
    },
    ...RedfishQueryPresets.config,
  });

  const biosAttributes = computed<BiosAttributes>(
    () => biosAttributesRaw.value ?? {},
  );

  /** `true` when `pvm_sys_dump_active === 'Enabled'` */
  const systemDumpActive = computed(
    () => biosAttributes.value.pvm_sys_dump_active === 'Enabled',
  );

  // ── BIOS Registry ──────────────────────────────────────────────────────────

  const {
    data: registryDataRaw,
    isLoading: isLoadingRegistry,
    refetch: refetchRegistry,
  } = useQuery({
    queryKey: BIOS_REGISTRY_QUERY_KEY,
    queryFn: async (): Promise<RegistryAttribute[]> => {
      const response = await api.get(
        '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
      );
      return response.data?.RegistryEntries?.Attributes ?? [];
    },
    ...RedfishQueryPresets.static,
  });

  const registryData = computed<RegistryAttribute[]>(
    () => registryDataRaw.value ?? [],
  );

  // Derive attribute values for the settings dropdowns (same logic as store)
  const attributeValues = computed(() => {
    if (!registryData.value.length) return null;

    const TRANSLATED_KEYS = [
      'pvm_default_os_type',
      'pvm_os_boot_type',
      'pvm_rpa_boot_mode',
      'pvm_stop_at_standby',
      'pvm_system_operating_mode',
      'pvm_linux_kvm_memory',
    ];

    return BIOS_ATTRIBUTE_KEYS.reduce<
      Record<string, Array<{ value: string; text: string }>>
    >((obj, attrKey) => {
      if (attrKey === 'pvm_sys_dump_active') return obj;
      const attrDef = registryData.value.find(
        (a) => a.AttributeName === attrKey,
      );
      if (!attrDef?.Value) return obj;
      obj[attrKey] = attrDef.Value.map((item) => ({
        value: item.ValueName,
        text: TRANSLATED_KEYS.includes(attrKey)
          ? i18n.global.t(
              `pageServerPowerOperations.biosSettings.attributeValues.${attrKey}.${item.ValueName}`,
            )
          : item.ValueName,
      }));
      return obj;
    }, {});
  });

  // Linux KVM percentage values from registry
  const linuxKvmPercentageValue = computed(() => {
    const attr = registryData.value.find(
      (a) => a.AttributeName === 'pvm_linux_kvm_percentage',
    );
    return attr?.CurrentValue != null ? attr.CurrentValue / 10 : null;
  });

  const linuxKvmPercentageCurrentValue = computed(() => {
    const attr = registryData.value.find(
      (a) => a.AttributeName === 'pvm_linux_kvm_percentage_current',
    );
    return attr?.CurrentValue != null ? attr.CurrentValue / 10 : null;
  });

  // IBMi-specific current values from registry
  const ibmiLoadSourceValue = computed(() => {
    const attr = registryData.value.find(
      (a) => a.AttributeName === 'pvm_ibmi_load_source',
    );
    return attr?.CurrentValue ?? 'Current configuration';
  });

  const ibmiAltLoadSourceValue = computed(() => {
    const attr = registryData.value.find(
      (a) => a.AttributeName === 'pvm_ibmi_alt_load_source',
    );
    return attr?.CurrentValue ?? 'Current configuration';
  });

  const ibmiConsoleValue = computed(() => {
    const attr = registryData.value.find(
      (a) => a.AttributeName === 'pvm_ibmi_console',
    );
    return attr?.CurrentValue ?? 'Current configuration';
  });

  // ── Operating Mode Settings ────────────────────────────────────────────────

  const {
    data: operatingModeRaw,
    isLoading: isLoadingOperatingMode,
    refetch: refetchOperatingMode,
  } = useQuery({
    queryKey: OPERATING_MODE_QUERY_KEY,
    queryFn: async (): Promise<OperatingModeSettings> => {
      const response = await api.get('/redfish/v1/Systems/system');
      const { PowerRestorePolicy, Boot } = response.data;
      return {
        powerRestorePolicyValue: PowerRestorePolicy ?? '',
        automaticRetryConfigValue: Boot?.AutomaticRetryConfig ?? '',
        bootFault: Boot?.StopBootOnFault ?? '',
      };
    },
    ...RedfishQueryPresets.config,
  });

  const powerRestorePolicyValue = computed(
    () => operatingModeRaw.value?.powerRestorePolicyValue ?? '',
  );
  const automaticRetryConfigValue = computed(
    () => operatingModeRaw.value?.automaticRetryConfigValue ?? '',
  );
  const bootFault = computed(() => operatingModeRaw.value?.bootFault ?? '');

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Save BIOS settings to the Bios/Settings endpoint. */
  const saveBiosSettingsMutation = useMutation({
    mutationFn: async (biosSettings: Record<string, any>) => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: biosSettings,
      });
      // Also persist operating-mode settings alongside bios settings (mirrors store)
      await api
        .patch('/redfish/v1/Systems/system', {
          PowerRestorePolicy: powerRestorePolicyValue.value,
          Boot: {
            AutomaticRetryConfig: automaticRetryConfigValue.value,
            StopBootOnFault: bootFault.value,
          },
        })
        .catch((err: any) => console.error(err));
      return i18n.global.t(
        'pageServerPowerOperations.toast.successSaveSettings',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BIOS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OPERATING_MODE_QUERY_KEY });
    },
    onError: () => {
      throw new Error(
        i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
      );
    },
  });

  /** Transition hypervisor from standby → runtime. */
  const standbyToRuntimeMutation = useMutation({
    mutationFn: async () => {
      await api.post(
        '/redfish/v1/Systems/hypervisor/Actions/ComputerSystem.Reset',
        { ResetType: 'On' },
      );
      return i18n.global.t(
        'pageServerPowerOperations.toast.successSaveSettings',
      );
    },
    onError: () => {
      throw new Error(
        i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
      );
    },
  });

  // ── Combined loading state ─────────────────────────────────────────────────

  const isLoading = computed(
    () =>
      isLoadingBios.value ||
      isLoadingRegistry.value ||
      isLoadingOperatingMode.value,
  );

  const isSaving = saveBiosSettingsMutation.isPending;

  return {
    // BIOS attributes
    biosAttributes,
    systemDumpActive,

    // Registry-derived values
    attributeValues,
    linuxKvmPercentageValue,
    linuxKvmPercentageInitialValue: linuxKvmPercentageValue, // same on first load
    linuxKvmPercentageCurrentValue,
    ibmiLoadSourceValue,
    ibmiAltLoadSourceValue,
    ibmiConsoleValue,

    // Operating mode
    powerRestorePolicyValue,
    automaticRetryConfigValue,
    bootFault,

    // Loading states
    isLoading,
    isLoadingBios,
    isFetchingBios,
    isLoadingRegistry,
    isLoadingOperatingMode,
    isSaving,

    // Mutations
    saveBiosSettings: saveBiosSettingsMutation.mutateAsync,
    standbyToRuntime: standbyToRuntimeMutation.mutateAsync,

    // Refetch
    refetchBios,
    refetchRegistry,
    refetchOperatingMode,
  };
}
