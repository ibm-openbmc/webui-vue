import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishResource } from './useAllSubResources';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import type { Resource } from '@/types/redfish';

// Type definitions for LDAP resources
interface LdapService {
  ServiceEnabled: boolean;
  ServiceAddresses: string[];
  Authentication: {
    Username: string;
    Password?: string;
  };
  LDAPService: {
    SearchSettings: {
      BaseDistinguishedNames: string[];
      UsernameAttribute?: string;
      GroupsAttribute?: string;
    };
  };
  RemoteRoleMapping: RoleGroup[];
}

interface AccountService extends Resource {
  LDAP?: LdapService;
  ActiveDirectory?: LdapService;
}

export interface RoleGroup {
  LocalRole: string;
  RemoteGroup: string;
  isSelected?: boolean;
}

export interface LdapSettings {
  serviceEnabled: boolean;
  serviceAddress: string;
  bindDn: string;
  baseDn: string;
  userAttribute?: string;
  groupsAttribute?: string;
  roleGroups: RoleGroup[];
}

export interface SaveAccountSettingsParams {
  serviceEnabled: boolean;
  serviceAddress: string;
  activeDirectoryEnabled: boolean;
  bindDn: string;
  bindPassword: string;
  baseDn: string;
  userIdAttribute?: string;
  groupIdAttribute?: string;
}

/**
 * Composable for LDAP page operations
 * Replaces LdapStore with TanStack Query
 */
export function useLdap() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  // Fetch Account Service
  const accountServiceQuery = useRedfishResource<AccountService>(
    '/redfish/v1/AccountService',
  );

  const isServiceEnabled = computed(() => {
    const ldapEnabled =
      accountServiceQuery.data.value?.LDAP?.ServiceEnabled ?? false;
    const adEnabled =
      accountServiceQuery.data.value?.ActiveDirectory?.ServiceEnabled ?? false;
    return ldapEnabled || adEnabled;
  });

  const isActiveDirectoryEnabled = computed(() => {
    return (
      accountServiceQuery.data.value?.ActiveDirectory?.ServiceEnabled ?? false
    );
  });

  const ldapSettings = computed<LdapSettings>(() => {
    const ldapData = accountServiceQuery.data.value?.LDAP;
    return {
      serviceEnabled: ldapData?.ServiceEnabled ?? false,
      serviceAddress: ldapData?.ServiceAddresses?.[0] ?? '',
      bindDn: ldapData?.Authentication?.Username ?? '',
      baseDn:
        ldapData?.LDAPService?.SearchSettings?.BaseDistinguishedNames?.[0] ??
        '',
      userAttribute: ldapData?.LDAPService?.SearchSettings?.UsernameAttribute,
      groupsAttribute: ldapData?.LDAPService?.SearchSettings?.GroupsAttribute,
      roleGroups: ldapData?.RemoteRoleMapping ?? [],
    };
  });

  const activeDirectorySettings = computed<LdapSettings>(() => {
    const adData = accountServiceQuery.data.value?.ActiveDirectory;
    return {
      serviceEnabled: adData?.ServiceEnabled ?? false,
      serviceAddress: adData?.ServiceAddresses?.[0] ?? '',
      bindDn: adData?.Authentication?.Username ?? '',
      baseDn:
        adData?.LDAPService?.SearchSettings?.BaseDistinguishedNames?.[0] ?? '',
      userAttribute: adData?.LDAPService?.SearchSettings?.UsernameAttribute,
      groupsAttribute: adData?.LDAPService?.SearchSettings?.GroupsAttribute,
      roleGroups: adData?.RemoteRoleMapping ?? [],
    };
  });

  const enabledRoleGroups = computed<RoleGroup[]>(() => {
    return isActiveDirectoryEnabled.value
      ? activeDirectorySettings.value.roleGroups
      : ldapSettings.value.roleGroups;
  });

  // Refetch account settings
  async function loadAccountSettings() {
    await accountServiceQuery.refetch();
  }

  // Save LDAP settings mutation
  const saveLdapMutation = useMutation({
    mutationFn: async (properties: Partial<LdapService>): Promise<void> => {
      const data = { LDAP: properties };

      // Disable Active Directory if enabled
      if (accountServiceQuery.data.value?.ActiveDirectory?.ServiceEnabled) {
        await api.patch('/redfish/v1/AccountService', {
          ActiveDirectory: { ServiceEnabled: false },
        });
      }

      await api.patch('/redfish/v1/AccountService', data);
    },
    onSuccess: () => {
      successToast(i18n.global.t('pageLdap.toast.successSaveLdapSettings'));
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    },
    onError: (error: Error) => {
      console.error('Save LDAP settings error:', error);
      errorToast(i18n.global.t('pageLdap.toast.errorSaveLdapSettings'));
    },
  });

  // Save Active Directory settings mutation
  const saveActiveDirectoryMutation = useMutation({
    mutationFn: async (properties: Partial<LdapService>): Promise<void> => {
      const data = { ActiveDirectory: properties };

      // Disable LDAP if enabled
      if (accountServiceQuery.data.value?.LDAP?.ServiceEnabled) {
        await api.patch('/redfish/v1/AccountService', {
          LDAP: { ServiceEnabled: false },
        });
      }

      await api.patch('/redfish/v1/AccountService', data);
    },
    onSuccess: () => {
      successToast(
        i18n.global.t('pageLdap.toast.successSaveActiveDirectorySettings'),
      );
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    },
    onError: (error: Error) => {
      console.error('Save Active Directory settings error:', error);
      errorToast(
        i18n.global.t('pageLdap.toast.errorSaveActiveDirectorySettings'),
      );
    },
  });

  // Save account settings (wrapper)
  async function saveAccountSettings(
    params: SaveAccountSettingsParams,
  ): Promise<void> {
    const data: Partial<LdapService> = {
      ServiceEnabled: params.serviceEnabled,
      ServiceAddresses: [params.serviceAddress],
      Authentication: {
        Username: params.bindDn,
        Password: params.bindPassword,
      },
      LDAPService: {
        SearchSettings: {
          BaseDistinguishedNames: [params.baseDn],
          GroupsAttribute: params.groupIdAttribute,
          UsernameAttribute: params.userIdAttribute,
        },
      },
    };

    if (params.activeDirectoryEnabled) {
      await saveActiveDirectoryMutation.mutateAsync(data);
    } else {
      await saveLdapMutation.mutateAsync(data);
    }
  }

  // Add new role group mutation
  const addRoleGroupMutation = useMutation({
    mutationFn: async ({
      groupName,
      groupPrivilege,
    }: {
      groupName: string;
      groupPrivilege: string;
    }): Promise<{ groupName: string }> => {
      const data: any = {};
      const currentRoleGroups = enabledRoleGroups.value;
      const RemoteRoleMapping = [
        ...currentRoleGroups,
        {
          LocalRole: groupPrivilege,
          RemoteGroup: groupName,
        },
      ];

      if (isActiveDirectoryEnabled.value) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }

      await api.patch('/redfish/v1/AccountService', data);
      return { groupName };
    },
    onSuccess: (data: { groupName: string }) => {
      successToast(i18n.global.t('pageLdap.toast.successAddRoleGroup', data));
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    },
    onError: (error: Error) => {
      console.error('Add role group error:', error);
      errorToast(i18n.global.t('pageLdap.toast.errorAddRoleGroup'));
    },
  });

  // Save role group mutation
  const saveRoleGroupMutation = useMutation({
    mutationFn: async ({
      groupNamePreviously,
      groupName,
      groupPrivilege,
    }: {
      groupNamePreviously: string;
      groupName: string;
      groupPrivilege: string;
    }): Promise<{ groupName: string }> => {
      const data: any = {};
      const currentRoleGroups = enabledRoleGroups.value;
      const RemoteRoleMapping = currentRoleGroups.map((group) => {
        if (group.RemoteGroup === groupNamePreviously) {
          return {
            RemoteGroup: groupName,
            LocalRole: groupPrivilege,
          };
        }
        return group;
      });

      if (isActiveDirectoryEnabled.value) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }

      await api.patch('/redfish/v1/AccountService', data);
      return { groupName };
    },
    onSuccess: (data: { groupName: string }) => {
      successToast(i18n.global.t('pageLdap.toast.successSaveRoleGroup', data));
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    },
    onError: (error: Error) => {
      console.error('Save role group error:', error);
      errorToast(i18n.global.t('pageLdap.toast.errorSaveRoleGroup'));
    },
  });

  // Delete role group mutation
  const deleteRoleGroupMutation = useMutation({
    mutationFn: async ({
      roleGroups,
    }: {
      roleGroups: Array<{ groupName: string }>;
    }): Promise<number> => {
      const data: any = {};
      const currentRoleGroups = enabledRoleGroups.value;
      const groupNamesToDelete = new Set(roleGroups.map((rg) => rg.groupName));

      // Create array where items to delete are null, items to keep are {}
      const RemoteRoleMapping = currentRoleGroups.map((group) =>
        groupNamesToDelete.has(group.RemoteGroup) ? null : {},
      );

      if (isActiveDirectoryEnabled.value) {
        data.ActiveDirectory = { RemoteRoleMapping };
      } else {
        data.LDAP = { RemoteRoleMapping };
      }

      await api.patch('/redfish/v1/AccountService', data);
      return roleGroups.length;
    },
    onSuccess: (count: number) => {
      successToast(
        i18n.global.t('pageLdap.toast.successDeleteRoleGroup', count),
      );
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    },
    onError: (error: Error) => {
      console.error('Delete role group error:', error);
      errorToast(i18n.global.t('pageLdap.toast.errorDeleteRoleGroup'));
    },
  });

  // Wrapper functions
  async function addNewRoleGroup(params: {
    groupName: string;
    groupPrivilege: string;
  }): Promise<void> {
    await addRoleGroupMutation.mutateAsync(params);
  }

  async function saveRoleGroup(params: {
    groupNamePreviously: string;
    groupName: string;
    groupPrivilege: string;
  }): Promise<void> {
    await saveRoleGroupMutation.mutateAsync(params);
  }

  async function deleteRoleGroup(params: {
    roleGroups: Array<{ groupName: string }>;
  }): Promise<void> {
    await deleteRoleGroupMutation.mutateAsync(params);
  }

  return {
    // State
    isServiceEnabled,
    isActiveDirectoryEnabled,
    ldapSettings,
    activeDirectorySettings,
    enabledRoleGroups,
    isLoading: accountServiceQuery.isLoading,
    isFetching: accountServiceQuery.isFetching,
    // Fetch
    loadAccountSettings,
    // Save
    saveAccountSettings,
    addNewRoleGroup,
    saveRoleGroup,
    deleteRoleGroup,
    // Mutation states
    isSaving:
      saveLdapMutation.isPending ||
      saveActiveDirectoryMutation.isPending ||
      addRoleGroupMutation.isPending ||
      saveRoleGroupMutation.isPending ||
      deleteRoleGroupMutation.isPending,
  };
}
