import { computed } from 'vue';
import type { UseQueryOptions } from '@tanstack/vue-query';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';
import { useRedfishResource } from './useAllSubResources';
import { usePatchResource } from './usePatchResource';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NetworkBiosAttributes {
  pvm_ibmi_network_install_type?: string;
  pvm_ibmi_ipaddress_protocol?: string;
  pvm_ibmi_server_ipaddress?: string;
  pvm_ibmi_nfs_image_directory?: string;
  pvm_ibmi_local_ipaddress?: string;
  pvm_ibmi_subnet_mask?: string;
  pvm_ibmi_gateway_ipaddress?: string;
  pvm_ibmi_vlan_tag_id?: string | number;
  pvm_ibmi_iscsi_target_name?: string;
  pvm_ibmi_iscsi_initiator_name?: string;
  pvm_ibmi_iscsi_target_port?: string | number;
  pvm_ibmi_max_frame_size?: string;
  [key: string]: any;
}

export interface NetworkPropertyLimits {
  nfsImageDirMaxLength: number | null;
  initiatorNameMaxLength: number | null;
  targetNameMaxLength: number | null;
  targetPortUpperBound: number | null;
  vlanTagIdUpperBound: number | null;
}

interface BiosResponse extends Resource {
  Attributes?: Record<string, any>;
}

interface RegistryResponse extends Resource {
  RegistryEntries?: {
    Attributes: Array<{
      AttributeName: string;
      MaxLength?: number;
      UpperBound?: number;
    }>;
  };
}

const REQUIRED_ATTRIBUTES = [
  'pvm_ibmi_network_install_type',
  'pvm_ibmi_ipaddress_protocol',
  'pvm_ibmi_server_ipaddress',
  'pvm_ibmi_nfs_image_directory',
  'pvm_ibmi_local_ipaddress',
  'pvm_ibmi_subnet_mask',
  'pvm_ibmi_gateway_ipaddress',
  'pvm_ibmi_vlan_tag_id',
  'pvm_ibmi_iscsi_target_name',
  'pvm_ibmi_iscsi_initiator_name',
  'pvm_ibmi_iscsi_target_port',
  'pvm_ibmi_max_frame_size',
] as const;

// ─── Composable ──────────────────────────────────────────────────────────────

/**
 * Composable for Network Settings Modal data and actions.
 * Replaces NetworkSettingsStore with TanStack Query.
 */
export function useNetworkSettings() {
  const { patchResource, isPending: isPatchPending } = usePatchResource();

  // ─── BIOS attributes ─────────────────────────────────────────────────────

  const {
    data: rawBiosResource,
    isFetching: isBiosFetching,
    isError: isBiosError,
    refetch: refetchBios,
  } = useRedfishResource<BiosResponse>('/redfish/v1/Systems/system/Bios', {
    queryConfig: RedfishQueryPresets.serverPowerOperations as Partial<UseQueryOptions<BiosResponse>>,
  });

  const rawBiosAttributes = computed<NetworkBiosAttributes | null>(() => {
    const allAttrs = rawBiosResource.value?.Attributes ?? {};
    const filtered = REQUIRED_ATTRIBUTES.filter(
      (key) => key in allAttrs,
    ).reduce<NetworkBiosAttributes>((obj, key) => {
      obj[key] = allAttrs[key];
      return obj;
    }, {});
    return Object.keys(filtered).length ? filtered : null;
  });

  // ─── Property limits from registry ───────────────────────────────────────

  const {
    data: rawRegistryResource,
    isFetching: isLimitsFetching,
    isError: isLimitsError,
    refetch: refetchLimits,
  } = useRedfishResource<RegistryResponse>(
    '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
    {
      queryConfig: RedfishQueryPresets.serverPowerOperations as Partial<UseQueryOptions<RegistryResponse>>,
    },
  );

  const propertyLimits = computed<NetworkPropertyLimits>(() => {
    const attrs = rawRegistryResource.value?.RegistryEntries?.Attributes ?? [];
    const find = (name: string) => attrs.find((a) => a.AttributeName === name);
    return {
      nfsImageDirMaxLength:
        find('pvm_ibmi_nfs_image_directory')?.MaxLength ?? null,
      initiatorNameMaxLength:
        find('pvm_ibmi_iscsi_initiator_name')?.MaxLength ?? null,
      targetNameMaxLength:
        find('pvm_ibmi_iscsi_target_name')?.MaxLength ?? null,
      targetPortUpperBound:
        find('pvm_ibmi_iscsi_target_port')?.UpperBound ?? null,
      vlanTagIdUpperBound: find('pvm_ibmi_vlan_tag_id')?.UpperBound ?? null,
    };
  });

  // ─── Set D-Mode mutation ──────────────────────────────────────────────────

  const setDMode = async (): Promise<string> => {
    await patchResource({
      endpoint: '/redfish/v1/Systems/system/Bios/Settings',
      field: 'Attributes',
      value: { pvm_os_boot_type: 'D_Mode' },
    });
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.toast.successUpdateDMode',
    );
  };

  // ─── Save BIOS settings mutation ─────────────────────────────────────────

  const saveBiosSettings = async (form: NetworkBiosAttributes): Promise<string> => {
    await patchResource({
      endpoint: '/redfish/v1/Systems/system/Bios/Settings',
      field: 'Attributes',
      value: form,
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'],
      ],
    });
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
    );
  };

  // ─── Update CHAP data mutation ────────────────────────────────────────────

  const updateChapData = async (chapData: {
    chapName: string;
    chapSecret: string;
  }): Promise<string> => {
    await patchResource({
      endpoint: '/redfish/v1/Systems/system',
      field: 'Oem',
      value: {
        IBM: {
          ChapData: {
            ChapName: chapData.chapName,
            ChapSecret: chapData.chapSecret,
          },
        },
      },
    });
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
    );
  };

  // ─── Restore default mutation ─────────────────────────────────────────────

  const restoreDefault = async (): Promise<string> => {
    await patchResource({
      endpoint: '/redfish/v1/Systems/system/Bios/Settings',
      field: 'Attributes',
      value: { pvm_ibmi_iscsi_initiator_name: '' },
      invalidateQueries: [
        ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'],
      ],
    });
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.toast.successRestoreDefault',
    );
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const isFetching = computed(
    () => isBiosFetching.value || isLimitsFetching.value,
  );
  const isError = computed(() => isBiosError.value || isLimitsError.value);

  const refetchAll = () => {
    refetchBios();
    refetchLimits();
  };

  return {
    // Data
    biosAttributes: rawBiosAttributes,
    nfsImageDirMaxLength: computed(
      () => propertyLimits.value?.nfsImageDirMaxLength ?? null,
    ),
    initiatorNameMaxLength: computed(
      () => propertyLimits.value?.initiatorNameMaxLength ?? null,
    ),
    targetNameMaxLength: computed(
      () => propertyLimits.value?.targetNameMaxLength ?? null,
    ),
    targetPortUpperBound: computed(
      () => propertyLimits.value?.targetPortUpperBound ?? null,
    ),
    vlanTagIdUpperBound: computed(
      () => propertyLimits.value?.vlanTagIdUpperBound ?? null,
    ),

    // Loading & error
    isFetching,
    isError,
    isBiosFetching,
    isLimitsFetching,

    // Actions
    refetchAll,
    setDMode,
    saveBiosSettings,
    updateChapData,
    restoreDefault,

    // Mutation states (all share the single usePatchResource instance)
    isSettingDMode: isPatchPending,
    isSavingBios: isPatchPending,
    isUpdatingChap: isPatchPending,
    isRestoringDefault: isPatchPending,
  };
}
