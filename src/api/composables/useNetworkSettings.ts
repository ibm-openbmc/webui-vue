import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { createRedfishQueryConfig } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

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
  const queryClient = useQueryClient();

  // ─── BIOS attributes ─────────────────────────────────────────────────────

  const {
    data: rawBiosAttributes,
    isFetching: isBiosFetching,
    isError: isBiosError,
    refetch: refetchBios,
  } = useQuery({
    queryKey: ['network-settings', 'bios'],
    queryFn: async (): Promise<NetworkBiosAttributes | null> => {
      const response = await api.get<BiosResponse>(
        '/redfish/v1/Systems/system/Bios',
      );
      const allAttrs = response.data?.Attributes ?? {};
      const filtered = REQUIRED_ATTRIBUTES.filter(
        (key) => key in allAttrs,
      ).reduce<NetworkBiosAttributes>((obj, key) => {
        obj[key] = allAttrs[key];
        return obj;
      }, {});
      return Object.keys(filtered).length ? filtered : null;
    },
    ...createRedfishQueryConfig({ staleTime: 30 * 1000 }),
  });

  // ─── Property limits from registry ───────────────────────────────────────

  const {
    data: propertyLimits,
    isFetching: isLimitsFetching,
    isError: isLimitsError,
    refetch: refetchLimits,
  } = useQuery({
    queryKey: ['network-settings', 'limits'],
    queryFn: async (): Promise<NetworkPropertyLimits> => {
      const response = await api.get<RegistryResponse>(
        '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
      );
      const attrs = response.data?.RegistryEntries?.Attributes ?? [];
      const find = (name: string) =>
        attrs.find((a) => a.AttributeName === name);
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
    },
    ...createRedfishQueryConfig({ staleTime: 5 * 60 * 1000 }),
  });

  // ─── Set D-Mode mutation ──────────────────────────────────────────────────

  const setDModeMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: { pvm_os_boot_type: 'D_Mode' },
      });
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.toast.successUpdateDMode',
      );
    },
  });

  // ─── Save BIOS settings mutation ─────────────────────────────────────────

  const saveBiosSettingsMutation = useMutation({
    mutationFn: async (form: NetworkBiosAttributes): Promise<string> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: form,
      });
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-settings', 'bios'] });
    },
  });

  // ─── Update CHAP data mutation ────────────────────────────────────────────

  const updateChapDataMutation = useMutation({
    mutationFn: async (chapData: {
      chapName: string;
      chapSecret: string;
    }): Promise<string> => {
      await api.patch('/redfish/v1/Systems/system', {
        Oem: {
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
    },
  });

  // ─── Restore default mutation ─────────────────────────────────────────────

  const restoreDefaultMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      await api.patch('/redfish/v1/Systems/system/Bios/Settings', {
        Attributes: { pvm_ibmi_iscsi_initiator_name: '' },
      });
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.toast.successRestoreDefault',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-settings', 'bios'] });
    },
  });

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
    setDMode: setDModeMutation.mutateAsync,
    saveBiosSettings: saveBiosSettingsMutation.mutateAsync,
    updateChapData: updateChapDataMutation.mutateAsync,
    restoreDefault: restoreDefaultMutation.mutateAsync,

    // Mutation states
    isSettingDMode: setDModeMutation.isPending,
    isSavingBios: saveBiosSettingsMutation.isPending,
    isUpdatingChap: updateChapDataMutation.isPending,
    isRestoringDefault: restoreDefaultMutation.isPending,
  };
}
