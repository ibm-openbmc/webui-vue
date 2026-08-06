import { computed, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api, { getResponseCount } from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - GlobalConstants.js is a JavaScript module
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';
import type { Resource } from '@/types/redfish';

// ─── Type Definitions ────────────────────────────────────────────────────────

export interface ManagerAccount extends Resource {
  UserName?: string;
  RoleId?: string;
  Locked?: boolean;
  Enabled?: boolean;
  Password?: string;
  AccountTypes?: string[];
  SecretKeySet?: boolean;
  MFABypass?: {
    BypassTypes: string[];
  };
}

export interface AccountServiceData extends Resource {
  AccountLockoutDuration?: number;
  AccountLockoutThreshold?: number;
  MinPasswordLength?: number;
  MaxPasswordLength?: number;
  MultiFactorAuth?: {
    GoogleAuthenticator?: {
      Enabled: boolean;
    };
  };
  Roles?: { '@odata.id': string };
}

export interface CreateUserParams {
  username: string;
  password: string;
  privilege: string;
  status: boolean;
}

export interface UpdateUserParams {
  originalUsername: string;
  currentUser?: any;
  username?: string;
  password?: string;
  privilege?: string;
  status?: boolean;
  locked?: boolean;
}

export interface AccountSettings {
  lockoutThreshold?: number;
  lockoutDuration?: number;
}

export interface BatchToastMessage {
  type: 'success' | 'error';
  message: string;
}

// ─── Query Keys ──────────────────────────────────────────────────────────────

const ACCOUNTS_COLLECTION_KEY = '/redfish/v1/AccountService/Accounts';
const ACCOUNT_SERVICE_KEY = '/redfish/v1/AccountService';
const ROLES_COLLECTION_KEY = '/redfish/v1/AccountService/Roles';

// Singleton: shared across all useUserManagement() callers (e.g. parent page
// and RegisterOtpModal) so that generateSecretKey() in the parent is
// immediately visible in the modal's secretKeyInfo watcher.
const secretKeyInfo = ref<string | null>(null);

// ─── Composable ──────────────────────────────────────────────────────────────

/**
 * Composable for User Management page operations.
 * Replaces UserManagementStore with TanStack Query + Vue Composition API.
 */
export function useUserManagement() {
  const queryClient = useQueryClient();

  // ── Users query ────────────────────────────────────────────────────────────

  const usersQuery = useQuery({
    queryKey: ['redfish', 'userManagement', 'users'],
    queryFn: async (): Promise<ManagerAccount[]> => {
      const collectionRes = await api
        .get(ACCOUNTS_COLLECTION_KEY)
        .catch((error: any) => {
          if (
            error?.response?.data?.[
              '@Message.ExtendedInfo'
            ]?.[0]?.MessageId?.endsWith('GenerateSecretKeyRequired')
          ) {
            throw new Error('otpRequired');
          }
          throw new Error(
            i18n.global.t('pageUserManagement.toast.errorLoadUsers'),
          );
        });

      const userIds: string[] = collectionRes.data.Members.map(
        (u: any) => u['@odata.id'],
      );

      const responses = await api
        .all(userIds.map((id: string) => api.get(id)))
        .catch(() => {
          throw new Error(
            i18n.global.t('pageUserManagement.toast.errorLoadUsers'),
          );
        });

      return (responses as any[]).map((r: any) => ({
        ...r.data,
        isSelected: false,
      }));
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // always fetch fresh data when navigating to the page
    retry: (failureCount: number, error: any) => {
      if (error?.message === 'otpRequired') return false;
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });

  // ── Account Service query (settings + MFA) ─────────────────────────────────

  const accountServiceQuery = useQuery({
    queryKey: ['redfish', 'resource', ACCOUNT_SERVICE_KEY],
    queryFn: async (): Promise<AccountServiceData> => {
      const { data } = await api.get(ACCOUNT_SERVICE_KEY).catch(() => {
        throw new Error(
          i18n.global.t('pageUserManagement.toast.errorLoadAccountSettings'),
        );
      });
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true, // always fetch fresh data when navigating to the page
    retry: (failureCount: number, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });

  // ── Roles query ────────────────────────────────────────────────────────────

  const rolesQuery = useQuery({
    queryKey: ['redfish', 'userManagement', 'roles'],
    queryFn: async (): Promise<string[]> => {
      const { data } = await api.get(ROLES_COLLECTION_KEY);
      const roleIds: string[] = await api.all(
        (data.Members ?? []).map((m: any) =>
          api.get(m['@odata.id']).then((r: any) => r.data.RoleId),
        ),
      );
      return roleIds;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });

  // ── Derived state ──────────────────────────────────────────────────────────

  const allUsers = computed<ManagerAccount[]>(
    () => usersQuery.data.value ?? [],
  );

  const accountRoles = computed<string[]>(() => rolesQuery.data.value ?? []);

  const filteredAccountRoles = computed<string[]>(() =>
    accountRoles.value.filter((r) => r !== 'OemIBMServiceAgent'),
  );

  const accountSettings = computed(() => ({
    lockoutDuration:
      accountServiceQuery.data.value?.AccountLockoutDuration ?? null,
    lockoutThreshold:
      accountServiceQuery.data.value?.AccountLockoutThreshold ?? null,
  }));

  const accountPasswordRequirements = computed(() => ({
    minLength: accountServiceQuery.data.value?.MinPasswordLength ?? null,
    maxLength: accountServiceQuery.data.value?.MaxPasswordLength ?? null,
  }));

  const isGlobalMfaEnabled = computed<boolean>(
    () =>
      accountServiceQuery.data.value?.MultiFactorAuth?.GoogleAuthenticator
        ?.Enabled ?? false,
  );

  const isCurrentUserMfaBypassed = ref(false);

  // ── Invalidation helpers ───────────────────────────────────────────────────

  function invalidateUsers() {
    queryClient.invalidateQueries({
      queryKey: ['redfish', 'userManagement', 'users'],
    });
  }

  function invalidateAccountService() {
    queryClient.invalidateQueries({
      queryKey: ['redfish', 'resource', ACCOUNT_SERVICE_KEY],
    });
  }

  // ── Create user mutation ───────────────────────────────────────────────────

  const createUserMutation = useMutation({
    mutationFn: async (params: CreateUserParams): Promise<string> => {
      const data = {
        UserName: params.username,
        Password: params.password,
        RoleId: params.privilege,
        Enabled: params.status,
      };
      await api.post(ACCOUNTS_COLLECTION_KEY, data).catch((error: any) => {
        const errorMsg = error.response?.data?.error?.code;
        if (REGEX_MAPPINGS.propertyValueFormatError.test(errorMsg)) {
          throw new Error(
            i18n.global.t(
              'pageUserManagement.toast.errorCreateUserPasswordNotAccepted',
              { username: params.username },
            ),
          );
        }
        if (REGEX_MAPPINGS.createLimitReachedForResource.test(errorMsg)) {
          throw new Error(
            i18n.global.t('pageUserManagement.toast.errorCreateUserMaxUsers', {
              username: params.username,
            }),
          );
        }
        throw new Error(
          i18n.global.t('pageUserManagement.toast.errorCreateUser', {
            username: params.username,
          }),
        );
      });
      return i18n.global.t('pageUserManagement.toast.successCreateUser', {
        username: params.username,
      });
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Update user mutation ───────────────────────────────────────────────────

  const updateUserMutation = useMutation({
    mutationFn: async (params: UpdateUserParams): Promise<string> => {
      const data: Record<string, any> = {};
      const {
        originalUsername,
        currentUser,
        username,
        password,
        privilege,
        status,
        locked,
      } = params;

      const notReadOnly =
        privilege !== 'ReadOnly' &&
        (currentUser ? currentUser.RoleId !== 'ReadOnly' : true);

      if (username) data.UserName = username;
      if (password) data.Password = password;
      if (privilege && notReadOnly) {
        data.RoleId = privilege;
      } else if (
        privilege &&
        privilege === 'ReadOnly' &&
        (currentUser ? currentUser.RoleId !== 'ReadOnly' : true)
      ) {
        data.RoleId = privilege;
      }
      if (status !== undefined) data.Enabled = status;
      if (locked !== undefined) data.Locked = locked;

      await api
        .patch(`${ACCOUNTS_COLLECTION_KEY}/${originalUsername}`, data)
        .catch((error: any) => {
          const messageId = error?.response?.data?.error?.code;
          const message = REGEX_MAPPINGS.propertyValueFormatError.test(
            messageId,
          )
            ? i18n.global.t(
                'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
                { username: originalUsername },
              )
            : i18n.global.t('pageUserManagement.toast.errorUpdateUser', {
                username: originalUsername,
              });
          throw new Error(message);
        });

      return i18n.global.t('pageUserManagement.toast.successUpdateUser', {
        username: originalUsername,
      });
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Delete single user mutation ────────────────────────────────────────────

  const deleteUserMutation = useMutation({
    mutationFn: async (username: string): Promise<string> => {
      await api.delete(`${ACCOUNTS_COLLECTION_KEY}/${username}`).catch(() => {
        throw new Error(
          i18n.global.t('pageUserManagement.toast.errorDeleteUser', {
            username,
          }),
        );
      });
      return i18n.global.t('pageUserManagement.toast.successDeleteUser', {
        username,
      });
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Delete multiple users mutation ─────────────────────────────────────────

  const deleteUsersMutation = useMutation({
    mutationFn: async (
      users: { username: string }[],
    ): Promise<BatchToastMessage[]> => {
      const promises = users.map(({ username }) =>
        api
          .delete(`${ACCOUNTS_COLLECTION_KEY}/${username}`)
          .catch((e: any) => e),
      );
      const responses = await api.all(promises);
      const { successCount, errorCount } = getResponseCount(responses);
      const messages: BatchToastMessage[] = [];
      if (successCount)
        messages.push({
          type: 'success',
          message: i18n.global.t(
            'pageUserManagement.toast.successBatchDelete',
            successCount,
          ),
        });
      if (errorCount)
        messages.push({
          type: 'error',
          message: i18n.global.t(
            'pageUserManagement.toast.errorBatchDelete',
            errorCount,
          ),
        });
      return messages;
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Enable / Disable users mutations ──────────────────────────────────────

  function makeBatchEnableMutation(enabled: boolean) {
    return useMutation({
      mutationFn: async (
        users: { username: string }[],
      ): Promise<BatchToastMessage[]> => {
        const data = { Enabled: enabled };
        const promises = users.map(({ username }) =>
          api
            .patch(`${ACCOUNTS_COLLECTION_KEY}/${username}`, data)
            .catch((e: any) => e),
        );
        const responses = await api.all(promises);
        const { successCount, errorCount } = getResponseCount(responses);
        const messages: BatchToastMessage[] = [];
        if (successCount)
          messages.push({
            type: 'success',
            message: i18n.global.t(
              enabled
                ? 'pageUserManagement.toast.successBatchEnable'
                : 'pageUserManagement.toast.successBatchDisable',
              successCount,
            ),
          });
        if (errorCount)
          messages.push({
            type: 'error',
            message: i18n.global.t(
              enabled
                ? 'pageUserManagement.toast.errorBatchEnable'
                : 'pageUserManagement.toast.errorBatchDisable',
              errorCount,
            ),
          });
        return messages;
      },
      onSuccess: () => invalidateUsers(),
    });
  }

  const enableUsersMutation = makeBatchEnableMutation(true);
  const disableUsersMutation = makeBatchEnableMutation(false);

  // ── Save account settings mutation ────────────────────────────────────────

  const saveAccountSettingsMutation = useMutation({
    mutationFn: async (settings: AccountSettings): Promise<string> => {
      const data: Record<string, any> = {};
      if (settings.lockoutThreshold !== undefined)
        data.AccountLockoutThreshold = settings.lockoutThreshold;
      if (settings.lockoutDuration !== undefined)
        data.AccountLockoutDuration = settings.lockoutDuration;
      await api.patch(ACCOUNT_SERVICE_KEY, data).catch(() => {
        throw new Error(
          i18n.global.t('pageUserManagement.toast.errorSaveSettings'),
        );
      });
      return i18n.global.t('pageUserManagement.toast.successSaveSettings');
    },
    onSuccess: () => invalidateAccountService(),
  });

  // ── Update global MFA mutation ────────────────────────────────────────────

  const updateGlobalMfaMutation = useMutation({
    mutationFn: async (globalMfa: boolean): Promise<string> => {
      const requestBody = {
        MultiFactorAuth: {
          GoogleAuthenticator: { Enabled: globalMfa },
        },
      };
      await api.patch(ACCOUNT_SERVICE_KEY, requestBody).catch(() => {
        throw new Error(
          i18n.global.t(
            globalMfa
              ? 'pageUserManagement.toast.errorEnableMfa'
              : 'pageUserManagement.toast.errorDisableMfa',
          ),
        );
      });
      return i18n.global.t(
        globalMfa
          ? 'pageUserManagement.toast.successEnableMfa'
          : 'pageUserManagement.toast.successDisableMfa',
      );
    },
    onSuccess: () => {
      invalidateAccountService();
      invalidateUsers();
    },
  });

  // ── MFA bypass mutations ───────────────────────────────────────────────────

  const updateMfaBypassMutation = useMutation({
    mutationFn: async (mfaObject: {
      '@odata.id': string;
      mfa: boolean;
      username: string;
    }): Promise<string> => {
      const requestBody = {
        MFABypass: {
          BypassTypes: mfaObject.mfa ? ['GoogleAuthenticator'] : [],
        },
      };
      await api.patch(mfaObject['@odata.id'], requestBody).catch(() => {
        throw new Error(
          i18n.global.t(
            mfaObject.mfa
              ? 'pageUserManagement.toast.errorEnableMfaBypass'
              : 'pageUserManagement.toast.errorDisableMfaBypass',
          ),
        );
      });
      return i18n.global.t(
        mfaObject.mfa
          ? 'pageUserManagement.toast.successEnableMfaBypass'
          : 'pageUserManagement.toast.successDisableMfaBypass',
      );
    },
    onSuccess: () => invalidateUsers(),
  });

  const updateMfaBypassNewUserMutation = useMutation({
    mutationFn: async ({
      userData,
      mfaByPass,
    }: {
      userData: { username: string };
      mfaByPass: boolean;
    }): Promise<void> => {
      const requestBody = {
        MFABypass: {
          BypassTypes: mfaByPass ? ['GoogleAuthenticator'] : [],
        },
      };
      await api
        .patch(`${ACCOUNTS_COLLECTION_KEY}/${userData.username}`, requestBody)
        .catch(() => {
          throw new Error(
            i18n.global.t(
              mfaByPass
                ? 'pageUserManagement.toast.errorEnableMfaBypass'
                : 'pageUserManagement.toast.errorDisableMfaBypass',
            ),
          );
        });
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Secret key / TOTP mutations ────────────────────────────────────────────

  async function checkCurrentUserMfaBypassed(uri: string): Promise<void> {
    const { data } = await api.get(uri);
    isCurrentUserMfaBypassed.value =
      data?.MFABypass?.BypassTypes?.includes('GoogleAuthenticator') ?? false;
  }

  function clearSecretKey(): void {
    secretKeyInfo.value = null;
  }

  async function generateSecretKey(): Promise<void> {
    const currentUsername = localStorage.getItem('storedUsername');
    const { data } = await api
      .post(
        `${ACCOUNTS_COLLECTION_KEY}/${currentUsername}/Actions/ManagerAccount.GenerateSecretKey`,
      )
      .catch((error: any) => {
        throw new Error(error);
      });
    secretKeyInfo.value = data?.SecretKey ?? null;
  }

  const clearSetSecretKeyMutation = useMutation({
    mutationFn: async (mfaObject: { '@odata.id': string }): Promise<string> => {
      await api
        .post(`${mfaObject['@odata.id']}/Actions/ManagerAccount.ClearSecretKey`)
        .catch(() => {
          throw new Error(
            i18n.global.t('pageUserManagement.toast.errorClearSecretKey'),
          );
        });
      return i18n.global.t('pageUserManagement.toast.successClearSecretKey');
    },
    onSuccess: () => invalidateUsers(),
  });

  const verifyRegisterTotpMutation = useMutation({
    mutationFn: async (otpValue: string): Promise<string> => {
      const currentUsername = localStorage.getItem('storedUsername');
      const requestBody = { TimeBasedOneTimePassword: otpValue };
      await api
        .post(
          `${ACCOUNTS_COLLECTION_KEY}/${currentUsername}/Actions/ManagerAccount.VerifyTimeBasedOneTimePassword`,
          requestBody,
        )
        .catch(() => {
          throw new Error(i18n.global.t('pageUserManagement.toast.errorOtp'));
        });
      return i18n.global.t('pageUserManagement.toast.successEnableMfa');
    },
    onSuccess: () => invalidateUsers(),
  });

  // ── Loading states ─────────────────────────────────────────────────────────

  const isLoading = computed(
    () =>
      usersQuery.isLoading.value ||
      accountServiceQuery.isLoading.value ||
      rolesQuery.isLoading.value,
  );

  const isMutating = computed(
    () =>
      createUserMutation.isPending.value ||
      updateUserMutation.isPending.value ||
      deleteUserMutation.isPending.value ||
      deleteUsersMutation.isPending.value ||
      enableUsersMutation.isPending.value ||
      disableUsersMutation.isPending.value ||
      saveAccountSettingsMutation.isPending.value ||
      updateGlobalMfaMutation.isPending.value ||
      updateMfaBypassMutation.isPending.value ||
      clearSetSecretKeyMutation.isPending.value,
  );

  return {
    // ── Data ──────────────────────────────────────────────────────────────────
    allUsers,
    accountRoles,
    filteredAccountRoles,
    accountSettings,
    accountPasswordRequirements,
    isGlobalMfaEnabled,
    isCurrentUserMfaBypassed,
    secretKeyInfo,

    // ── Loading ───────────────────────────────────────────────────────────────
    isLoading,
    isMutating,
    isUsersLoading: usersQuery.isLoading,
    isUsersError: usersQuery.isError,
    usersError: usersQuery.error,

    // ── Mutations (async wrappers) ─────────────────────────────────────────────
    createUser: createUserMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: (username: string) => deleteUserMutation.mutateAsync(username),
    deleteUsers: (users: { username: string }[]) =>
      deleteUsersMutation.mutateAsync(users),
    enableUsers: (users: { username: string }[]) =>
      enableUsersMutation.mutateAsync(users),
    disableUsers: (users: { username: string }[]) =>
      disableUsersMutation.mutateAsync(users),
    saveAccountSettings: (settings: AccountSettings) =>
      saveAccountSettingsMutation.mutateAsync(settings),
    updateGlobalMfa: (globalMfa: boolean) =>
      updateGlobalMfaMutation.mutateAsync(globalMfa),
    updateMfaBypass: (mfaObject: {
      '@odata.id': string;
      mfa: boolean;
      username: string;
    }) => updateMfaBypassMutation.mutateAsync(mfaObject),
    updateMfaBypassNewUser: (params: {
      userData: { username: string };
      mfaByPass: boolean;
    }) => updateMfaBypassNewUserMutation.mutateAsync(params),
    clearSetSecretKey: (mfaObject: { '@odata.id': string }) =>
      clearSetSecretKeyMutation.mutateAsync(mfaObject),
    verifyRegisterTotp: (otpValue: string) =>
      verifyRegisterTotpMutation.mutateAsync(otpValue),

    // ── Non-mutation async helpers ──────────────────────────────────────────
    checkCurrentUserMfaBypassed,
    clearSecretKey,
    generateSecretKey,

    // ── Refetch ────────────────────────────────────────────────────────────
    refetchUsers: usersQuery.refetch,
    refetchAccountService: accountServiceQuery.refetch,
  };
}
