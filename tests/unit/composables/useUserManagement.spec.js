import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { useUserManagement } from '@/api/composables/useUserManagement';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    all: vi.fn(),
  },
  getResponseCount: vi.fn(),
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key, params) =>
        params ? `${key}:${JSON.stringify(params)}` : key,
      ),
    },
  },
}));

vi.mock('@/utilities/GlobalConstants', () => ({
  REGEX_MAPPINGS: {
    propertyValueFormatError: { test: vi.fn(() => false) },
    createLimitReachedForResource: { test: vi.fn(() => false) },
  },
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api, { getResponseCount } from '@/store/api';

// ── Shared helpers ─────────────────────────────────────────────────────────────

/** Returns stub values for a single useQuery call */
function stubQuery(overrides = {}) {
  return {
    data: ref(null),
    isLoading: ref(false),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    refetch: vi.fn(),
    ...overrides,
  };
}

/** Returns stub values for a single useMutation call */
function stubMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn(),
    isPending: ref(false),
    ...overrides,
  };
}

/**
 * Sets up the default mock return values so that useUserManagement() can be
 * called without errors. useQuery is called 3 times (users, accountService,
 * roles) and useMutation is called many times.
 */
function setupDefaultMocks(queryOverrides = []) {
  const queries = [
    stubQuery(queryOverrides[0] ?? {}), // usersQuery
    stubQuery(queryOverrides[1] ?? {}), // accountServiceQuery
    stubQuery(queryOverrides[2] ?? {}), // rolesQuery
  ];

  let queryCallIndex = 0;
  useQuery.mockImplementation(() => queries[queryCallIndex++] ?? stubQuery());
  useMutation.mockReturnValue(stubMutation());

  return queries;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useUserManagement', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Return shape ─────────────────────────────────────────────────────────────

  describe('Return shape', () => {
    it('returns all expected properties', () => {
      setupDefaultMocks();
      const result = useUserManagement();

      const expectedKeys = [
        'allUsers',
        'accountRoles',
        'filteredAccountRoles',
        'accountSettings',
        'accountPasswordRequirements',
        'isGlobalMfaEnabled',
        'isCurrentUserMfaBypassed',
        'secretKeyInfo',
        'isLoading',
        'isMutating',
        'isUsersLoading',
        'isUsersError',
        'usersError',
        'createUser',
        'updateUser',
        'deleteUser',
        'deleteUsers',
        'enableUsers',
        'disableUsers',
        'saveAccountSettings',
        'updateGlobalMfa',
        'updateMfaBypass',
        'updateMfaBypassNewUser',
        'clearSetSecretKey',
        'verifyRegisterTotp',
        'checkCurrentUserMfaBypassed',
        'clearSecretKey',
        'generateSecretKey',
        'refetchUsers',
        'refetchAccountService',
      ];

      for (const key of expectedKeys) {
        expect(result, `missing property: ${key}`).toHaveProperty(key);
      }
    });
  });

  // ── Users query ──────────────────────────────────────────────────────────────

  describe('usersQuery', () => {
    it('allUsers defaults to empty array when data is null', () => {
      setupDefaultMocks();
      const { allUsers } = useUserManagement();
      expect(allUsers.value).toEqual([]);
    });

    it('allUsers reflects query data', () => {
      const mockUsers = [
        { UserName: 'alice', RoleId: 'Administrator', Enabled: true },
        { UserName: 'bob', RoleId: 'ReadOnly', Enabled: false },
      ];
      setupDefaultMocks([{ data: ref(mockUsers) }]);
      const { allUsers } = useUserManagement();
      expect(allUsers.value).toEqual(mockUsers);
    });

    it('configures usersQuery with correct query key', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((options) => {
        capturedOptions.push(options);
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      useUserManagement();

      expect(capturedOptions[0].queryKey).toEqual([
        'redfish',
        'userManagement',
        'users',
      ]);
    });

    it('usersQuery queryFn fetches collection then each member', async () => {
      let usersQueryFn;
      useQuery.mockImplementation((options) => {
        if (
          options.queryKey[2] === 'users' &&
          options.queryKey[1] === 'userManagement'
        ) {
          usersQueryFn = options.queryFn;
        }
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      const memberIds = [
        '/redfish/v1/AccountService/Accounts/alice',
        '/redfish/v1/AccountService/Accounts/bob',
      ];
      api.get.mockResolvedValueOnce({
        data: { Members: memberIds.map((id) => ({ '@odata.id': id })) },
      });
      api.all.mockResolvedValueOnce([
        { data: { UserName: 'alice', RoleId: 'Administrator' } },
        { data: { UserName: 'bob', RoleId: 'ReadOnly' } },
      ]);

      useUserManagement();

      const result = await usersQueryFn();

      expect(api.get).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts',
      );
      expect(result).toEqual([
        { UserName: 'alice', RoleId: 'Administrator', isSelected: false },
        { UserName: 'bob', RoleId: 'ReadOnly', isSelected: false },
      ]);
    });

    it('usersQuery retry returns false for 4xx errors', () => {
      let retryFn;
      useQuery.mockImplementation((options) => {
        if (options.queryKey[2] === 'users') retryFn = options.retry;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      useUserManagement();

      expect(retryFn(0, { response: { status: 404 } })).toBe(false);
      expect(retryFn(0, { response: { status: 403 } })).toBe(false);
    });

    it('usersQuery retry returns false for otpRequired error', () => {
      let retryFn;
      useQuery.mockImplementation((options) => {
        if (options.queryKey[2] === 'users') retryFn = options.retry;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      useUserManagement();

      expect(retryFn(0, new Error('otpRequired'))).toBe(false);
    });

    it('usersQuery retry returns true for 5xx errors up to 2 times', () => {
      let retryFn;
      useQuery.mockImplementation((options) => {
        if (options.queryKey[2] === 'users') retryFn = options.retry;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      useUserManagement();

      const err = { response: { status: 503 } };
      expect(retryFn(0, err)).toBe(true);
      expect(retryFn(1, err)).toBe(true);
      expect(retryFn(2, err)).toBe(false);
    });

    it('exposes isUsersLoading and isUsersError', () => {
      setupDefaultMocks([
        {
          isLoading: ref(true),
          isError: ref(true),
          error: ref(new Error('fail')),
        },
      ]);
      const { isUsersLoading, isUsersError, usersError } = useUserManagement();
      expect(isUsersLoading.value).toBe(true);
      expect(isUsersError.value).toBe(true);
      expect(usersError.value.message).toBe('fail');
    });
  });

  // ── Account service query ─────────────────────────────────────────────────────

  describe('accountServiceQuery', () => {
    it('accountSettings defaults to null values when no data', () => {
      setupDefaultMocks();
      const { accountSettings } = useUserManagement();
      expect(accountSettings.value).toEqual({
        lockoutDuration: null,
        lockoutThreshold: null,
      });
    });

    it('accountSettings reflects query data', () => {
      setupDefaultMocks([
        {},
        {
          data: ref({
            AccountLockoutDuration: 30,
            AccountLockoutThreshold: 5,
          }),
        },
      ]);
      const { accountSettings } = useUserManagement();
      expect(accountSettings.value).toEqual({
        lockoutDuration: 30,
        lockoutThreshold: 5,
      });
    });

    it('accountPasswordRequirements reflects query data', () => {
      setupDefaultMocks([
        {},
        {
          data: ref({ MinPasswordLength: 8, MaxPasswordLength: 32 }),
        },
      ]);
      const { accountPasswordRequirements } = useUserManagement();
      expect(accountPasswordRequirements.value).toEqual({
        minLength: 8,
        maxLength: 32,
      });
    });

    it('accountPasswordRequirements returns null for absent password length properties', () => {
      setupDefaultMocks([{}, { data: ref({}) }]);
      const { accountPasswordRequirements } = useUserManagement();
      expect(accountPasswordRequirements.value).toEqual({
        minLength: null,
        maxLength: null,
      });
    });

    it('isGlobalMfaEnabled is false when not set', () => {
      setupDefaultMocks();
      const { isGlobalMfaEnabled } = useUserManagement();
      expect(isGlobalMfaEnabled.value).toBe(false);
    });

    it('isGlobalMfaEnabled is true when GoogleAuthenticator is enabled', () => {
      setupDefaultMocks([
        {},
        {
          data: ref({
            MultiFactorAuth: { GoogleAuthenticator: { Enabled: true } },
          }),
        },
      ]);
      const { isGlobalMfaEnabled } = useUserManagement();
      expect(isGlobalMfaEnabled.value).toBe(true);
    });

    it('configures accountServiceQuery with correct query key', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((options) => {
        capturedOptions.push(options);
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      useUserManagement();

      expect(capturedOptions[1].queryKey).toEqual([
        'redfish',
        'resource',
        '/redfish/v1/AccountService',
      ]);
    });
  });

  // ── Roles query ───────────────────────────────────────────────────────────────

  describe('rolesQuery', () => {
    it('accountRoles defaults to empty array', () => {
      setupDefaultMocks();
      const { accountRoles } = useUserManagement();
      expect(accountRoles.value).toEqual([]);
    });

    it('filteredAccountRoles excludes OemIBMServiceAgent', () => {
      setupDefaultMocks([
        {},
        {},
        {
          data: ref([
            'Administrator',
            'Operator',
            'ReadOnly',
            'OemIBMServiceAgent',
          ]),
        },
      ]);
      const { filteredAccountRoles } = useUserManagement();
      expect(filteredAccountRoles.value).toEqual([
        'Administrator',
        'Operator',
        'ReadOnly',
      ]);
      expect(filteredAccountRoles.value).not.toContain('OemIBMServiceAgent');
    });

    it('filteredAccountRoles is unchanged when OemIBMServiceAgent absent', () => {
      setupDefaultMocks([
        {},
        {},
        { data: ref(['Administrator', 'Operator', 'ReadOnly']) },
      ]);
      const { filteredAccountRoles } = useUserManagement();
      expect(filteredAccountRoles.value).toEqual([
        'Administrator',
        'Operator',
        'ReadOnly',
      ]);
    });
  });

  // ── isLoading / isMutating ────────────────────────────────────────────────────

  describe('isLoading and isMutating', () => {
    it('isLoading is true when any query is loading', () => {
      setupDefaultMocks([{ isLoading: ref(true) }]);
      const { isLoading } = useUserManagement();
      expect(isLoading.value).toBe(true);
    });

    it('isLoading is true when accountService is loading', () => {
      setupDefaultMocks([{}, { isLoading: ref(true) }]);
      const { isLoading } = useUserManagement();
      expect(isLoading.value).toBe(true);
    });

    it('isLoading is false when all queries done', () => {
      setupDefaultMocks();
      const { isLoading } = useUserManagement();
      expect(isLoading.value).toBe(false);
    });

    it('isMutating is true when a mutation is pending', () => {
      useQuery.mockReturnValue(stubQuery());
      let callIndex = 0;
      useMutation.mockImplementation(() => {
        // Make the first mutation (createUser) pending
        return stubMutation({ isPending: ref(callIndex++ === 0) });
      });
      const { isMutating } = useUserManagement();
      expect(isMutating.value).toBe(true);
    });

    it('isMutating is false when no mutations are pending', () => {
      setupDefaultMocks();
      const { isMutating } = useUserManagement();
      expect(isMutating.value).toBe(false);
    });
  });

  // ── createUser mutation ───────────────────────────────────────────────────────

  describe('createUser mutation', () => {
    it('mutationFn posts correct payload to API', async () => {
      let createMutationFn;
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        // First useMutation call is createUser
        if (!createMutationFn) createMutationFn = options.mutationFn;
        return stubMutation();
      });

      api.post.mockResolvedValue({ data: {} });

      useUserManagement();

      await createMutationFn({
        username: 'newuser',
        password: 'P@ssw0rd',
        privilege: 'Operator',
        status: true,
      });

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts',
        {
          UserName: 'newuser',
          Password: 'P@ssw0rd',
          RoleId: 'Operator',
          Enabled: true,
        },
      );
    });

    it('createUser onSuccess invalidates users query', () => {
      let onSuccess;
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        if (!onSuccess) onSuccess = options.onSuccess;
        return stubMutation();
      });

      useUserManagement();
      onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── updateUser mutation ───────────────────────────────────────────────────────

  describe('updateUser mutation', () => {
    it('mutationFn patches the correct user URL', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({ data: {} });

      useUserManagement();

      // updateUser is the second mutation
      const updateFn = mutationFns[1];
      await updateFn({
        originalUsername: 'alice',
        username: 'alice2',
        password: 'NewP@ss1',
        privilege: 'Operator',
        status: false,
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        expect.objectContaining({
          UserName: 'alice2',
          Password: 'NewP@ss1',
          RoleId: 'Operator',
          Enabled: false,
        }),
      );
    });

    it('mutationFn sets Locked field when provided', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({ data: {} });

      useUserManagement();

      const updateFn = mutationFns[1];
      await updateFn({ originalUsername: 'alice', locked: false });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        expect.objectContaining({ Locked: false }),
      );
    });
  });

  // ── deleteUser mutation ───────────────────────────────────────────────────────

  describe('deleteUser mutation', () => {
    it('mutationFn deletes the correct URL', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.delete.mockResolvedValue({});

      useUserManagement();

      const deleteFn = mutationFns[2]; // Third mutation: deleteUser
      await deleteFn('alice');

      expect(api.delete).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
      );
    });

    it('deleteUser wrapper calls mutateAsync with username', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('ok');
      useQuery.mockReturnValue(stubQuery());
      let callIdx = 0;
      useMutation.mockImplementation(() => {
        const isMine = callIdx++ === 2;
        return {
          mutateAsync: isMine ? mockMutateAsync : vi.fn(),
          isPending: ref(false),
        };
      });

      const { deleteUser } = useUserManagement();
      await deleteUser('alice');

      expect(mockMutateAsync).toHaveBeenCalledWith('alice');
    });
  });

  // ── deleteUsers mutation ──────────────────────────────────────────────────────

  describe('deleteUsers mutation', () => {
    it('mutationFn issues delete for every user and returns toast messages', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}, {}]);
      getResponseCount.mockReturnValue({ successCount: 2, errorCount: 0 });

      useUserManagement();

      const deletesFn = mutationFns[3]; // Fourth mutation: deleteUsers
      const messages = await deletesFn([
        { username: 'alice' },
        { username: 'bob' },
      ]);

      expect(api.all).toHaveBeenCalled();
      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('success');
    });

    it('returns error message when some deletes fail', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}, new Error('fail')]);
      getResponseCount.mockReturnValue({ successCount: 1, errorCount: 1 });

      useUserManagement();

      const deletesFn = mutationFns[3];
      const messages = await deletesFn([
        { username: 'alice' },
        { username: 'bob' },
      ]);

      expect(messages).toHaveLength(2);
      expect(messages.map((m) => m.type)).toContain('success');
      expect(messages.map((m) => m.type)).toContain('error');
    });
  });

  // ── enableUsers / disableUsers mutations ──────────────────────────────────────

  describe('enableUsers / disableUsers mutations', () => {
    it('enableUsers mutationFn patches Enabled: true for all users', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});
      api.all.mockResolvedValue([{}]);
      getResponseCount.mockReturnValue({ successCount: 1, errorCount: 0 });

      useUserManagement();

      const enableFn = mutationFns[4]; // enableUsers
      await enableFn([{ username: 'alice' }]);

      const patchCall = api.patch.mock.calls[0];
      expect(patchCall[1]).toEqual({ Enabled: true });
    });

    it('disableUsers mutationFn patches Enabled: false for all users', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});
      api.all.mockResolvedValue([{}]);
      getResponseCount.mockReturnValue({ successCount: 1, errorCount: 0 });

      useUserManagement();

      const disableFn = mutationFns[5]; // disableUsers
      await disableFn([{ username: 'alice' }]);

      const patchCall = api.patch.mock.calls[0];
      expect(patchCall[1]).toEqual({ Enabled: false });
    });
  });

  // ── saveAccountSettings mutation ───────────────────────────────────────────────

  describe('saveAccountSettings mutation', () => {
    it('mutationFn patches lockout settings', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});

      useUserManagement();

      const saveFn = mutationFns[6]; // saveAccountSettings
      await saveFn({ lockoutThreshold: 5, lockoutDuration: 30 });

      expect(api.patch).toHaveBeenCalledWith('/redfish/v1/AccountService', {
        AccountLockoutThreshold: 5,
        AccountLockoutDuration: 30,
      });
    });

    it('onSuccess invalidates account service cache', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();

      onSuccesses[6](); // saveAccountSettings onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
    });
  });

  // ── updateGlobalMfa mutation ──────────────────────────────────────────────────

  describe('updateGlobalMfa mutation', () => {
    it('mutationFn patches GlobalAuthenticator enabled', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});

      useUserManagement();

      const mfaFn = mutationFns[7]; // updateGlobalMfa
      await mfaFn(true);

      expect(api.patch).toHaveBeenCalledWith('/redfish/v1/AccountService', {
        MultiFactorAuth: { GoogleAuthenticator: { Enabled: true } },
      });
    });

    it('onSuccess invalidates both account service and users', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();

      onSuccesses[7](); // updateGlobalMfa onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'resource', '/redfish/v1/AccountService'],
      });
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── updateMfaBypass mutation ──────────────────────────────────────────────────

  describe('updateMfaBypass mutation', () => {
    it('mutationFn patches BypassTypes with GoogleAuthenticator when mfa=true', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});

      useUserManagement();

      const bypassFn = mutationFns[8]; // updateMfaBypass
      await bypassFn({
        '@odata.id': '/redfish/v1/AccountService/Accounts/alice',
        mfa: true,
        username: 'alice',
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        { MFABypass: { BypassTypes: ['GoogleAuthenticator'] } },
      );
    });

    it('mutationFn patches empty BypassTypes when mfa=false', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockResolvedValue({});

      useUserManagement();

      const bypassFn = mutationFns[8];
      await bypassFn({
        '@odata.id': '/redfish/v1/AccountService/Accounts/alice',
        mfa: false,
        username: 'alice',
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        { MFABypass: { BypassTypes: [] } },
      );
    });
  });

  // ── clearSetSecretKey mutation ────────────────────────────────────────────────

  describe('clearSetSecretKey mutation', () => {
    it('mutationFn posts to ClearSecretKey action endpoint', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.post.mockResolvedValue({});

      useUserManagement();

      const clearFn = mutationFns[10]; // clearSetSecretKey
      await clearFn({
        '@odata.id': '/redfish/v1/AccountService/Accounts/alice',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice/Actions/ManagerAccount.ClearSecretKey',
      );
    });
  });

  // ── verifyRegisterTotp mutation ───────────────────────────────────────────────

  describe('verifyRegisterTotp mutation', () => {
    it('mutationFn posts OTP to VerifyTimeBasedOneTimePassword action', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.post.mockResolvedValue({});

      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('alice');

      useUserManagement();

      const verifyFn = mutationFns[11]; // verifyRegisterTotp
      await verifyFn('123456');

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice/Actions/ManagerAccount.VerifyTimeBasedOneTimePassword',
        { TimeBasedOneTimePassword: '123456' },
      );
    });
  });

  // ── Non-mutation helpers ──────────────────────────────────────────────────────

  describe('checkCurrentUserMfaBypassed', () => {
    it('sets isCurrentUserMfaBypassed to true when bypass includes GoogleAuthenticator', async () => {
      setupDefaultMocks();
      api.get.mockResolvedValue({
        data: {
          MFABypass: { BypassTypes: ['GoogleAuthenticator'] },
        },
      });

      const { checkCurrentUserMfaBypassed, isCurrentUserMfaBypassed } =
        useUserManagement();

      await checkCurrentUserMfaBypassed(
        '/redfish/v1/AccountService/Accounts/alice',
      );

      expect(isCurrentUserMfaBypassed.value).toBe(true);
    });

    it('sets isCurrentUserMfaBypassed to false when BypassTypes is empty', async () => {
      setupDefaultMocks();
      api.get.mockResolvedValue({
        data: { MFABypass: { BypassTypes: [] } },
      });

      const { checkCurrentUserMfaBypassed, isCurrentUserMfaBypassed } =
        useUserManagement();

      await checkCurrentUserMfaBypassed(
        '/redfish/v1/AccountService/Accounts/alice',
      );

      expect(isCurrentUserMfaBypassed.value).toBe(false);
    });
  });

  describe('clearSecretKey', () => {
    it('resets secretKeyInfo to null', () => {
      setupDefaultMocks();
      const { clearSecretKey, secretKeyInfo } = useUserManagement();

      // Simulate a key being set
      secretKeyInfo.value = 'JBSWY3DPEHPK3PXP';
      clearSecretKey();

      expect(secretKeyInfo.value).toBeNull();
    });
  });

  describe('generateSecretKey', () => {
    it('posts to GenerateSecretKey and stores result in secretKeyInfo', async () => {
      setupDefaultMocks();
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('alice');
      api.post.mockResolvedValue({ data: { SecretKey: 'JBSWY3DPEHPK3PXP' } });

      const { generateSecretKey, secretKeyInfo } = useUserManagement();
      await generateSecretKey();

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice/Actions/ManagerAccount.GenerateSecretKey',
      );
      expect(secretKeyInfo.value).toBe('JBSWY3DPEHPK3PXP');
    });

    it('sets secretKeyInfo to null when response has no SecretKey', async () => {
      setupDefaultMocks();
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('alice');
      api.post.mockResolvedValue({ data: {} });

      const { generateSecretKey, secretKeyInfo } = useUserManagement();
      await generateSecretKey();

      expect(secretKeyInfo.value).toBeNull();
    });
  });

  // ── Invalidation helpers ──────────────────────────────────────────────────────

  describe('cache invalidation', () => {
    it('refetchUsers is the usersQuery refetch function', () => {
      const mockRefetch = vi.fn();
      let callIdx = 0;
      useQuery.mockImplementation(() => {
        const q = stubQuery();
        if (callIdx++ === 0) q.refetch = mockRefetch;
        return q;
      });
      useMutation.mockReturnValue(stubMutation());

      const { refetchUsers } = useUserManagement();
      expect(refetchUsers).toBe(mockRefetch);
    });

    it('refetchAccountService is the accountServiceQuery refetch function', () => {
      const mockRefetch = vi.fn();
      let callIdx = 0;
      useQuery.mockImplementation(() => {
        const q = stubQuery();
        if (callIdx++ === 1) q.refetch = mockRefetch;
        return q;
      });
      useMutation.mockReturnValue(stubMutation());

      const { refetchAccountService } = useUserManagement();
      expect(refetchAccountService).toBe(mockRefetch);
    });
  });

  // ── createUser error branches ─────────────────────────────────────────────────

  describe('createUser error branches', () => {
    it('throws password-format error when REGEX_MAPPINGS.propertyValueFormatError matches', async () => {
      const { REGEX_MAPPINGS } = await import('@/utilities/GlobalConstants');
      REGEX_MAPPINGS.propertyValueFormatError.test.mockReturnValueOnce(true);

      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      const err = {
        response: { data: { error: { code: 'PropertyValueFormatError' } } },
      };
      api.post.mockRejectedValue(err);

      useUserManagement();
      await expect(
        mutationFns[0]({
          username: 'alice',
          password: 'bad',
          privilege: 'Admin',
          status: true,
        }),
      ).rejects.toThrow(
        'pageUserManagement.toast.errorCreateUserPasswordNotAccepted',
      );
    });

    it('throws max-users error when REGEX_MAPPINGS.createLimitReachedForResource matches', async () => {
      const { REGEX_MAPPINGS } = await import('@/utilities/GlobalConstants');
      REGEX_MAPPINGS.propertyValueFormatError.test.mockReturnValueOnce(false);
      REGEX_MAPPINGS.createLimitReachedForResource.test.mockReturnValueOnce(
        true,
      );

      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      const err = {
        response: {
          data: { error: { code: 'CreateLimitReachedForResource' } },
        },
      };
      api.post.mockRejectedValue(err);

      useUserManagement();
      await expect(
        mutationFns[0]({
          username: 'alice',
          password: 'pw',
          privilege: 'Admin',
          status: true,
        }),
      ).rejects.toThrow('pageUserManagement.toast.errorCreateUserMaxUsers');
    });

    it('throws generic create error when no special code matches', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      const err = { response: { data: { error: { code: 'Unknown' } } } };
      api.post.mockRejectedValue(err);

      useUserManagement();
      await expect(
        mutationFns[0]({
          username: 'alice',
          password: 'pw',
          privilege: 'Admin',
          status: true,
        }),
      ).rejects.toThrow('pageUserManagement.toast.errorCreateUser');
    });
  });

  // ── updateUser privilege branches ─────────────────────────────────────────────

  describe('updateUser privilege branches', () => {
    it('sets RoleId to ReadOnly when privilege is ReadOnly and current role differs', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      // privilege=ReadOnly, currentUser.RoleId=Operator → should set RoleId
      await mutationFns[1]({
        originalUsername: 'alice',
        privilege: 'ReadOnly',
        currentUser: { RoleId: 'Operator' },
      });
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        expect.objectContaining({ RoleId: 'ReadOnly' }),
      );
    });

    it('skips RoleId when privilege is ReadOnly and currentUser is already ReadOnly', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      // privilege=ReadOnly, currentUser.RoleId=ReadOnly → should NOT set RoleId
      await mutationFns[1]({
        originalUsername: 'alice',
        privilege: 'ReadOnly',
        currentUser: { RoleId: 'ReadOnly' },
      });
      const patchPayload = api.patch.mock.calls[0][1];
      expect(patchPayload).not.toHaveProperty('RoleId');
    });

    it('throws password-format error on updateUser API failure', async () => {
      const { REGEX_MAPPINGS } = await import('@/utilities/GlobalConstants');
      REGEX_MAPPINGS.propertyValueFormatError.test.mockReturnValueOnce(true);

      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue({
        response: { data: { error: { code: 'PropertyValueFormatError' } } },
      });
      useUserManagement();

      await expect(
        mutationFns[1]({ originalUsername: 'alice' }),
      ).rejects.toThrow(
        'pageUserManagement.toast.errorUpdateUserPasswordNotAccepted',
      );
    });
  });

  // ── updateMfaBypassNewUser mutation ───────────────────────────────────────────

  describe('updateMfaBypassNewUser mutation', () => {
    it('patches Accounts/{username} with GoogleAuthenticator bypass when mfaByPass=true', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      // mutation index 9 = updateMfaBypassNewUser
      await mutationFns[9]({
        userData: { username: 'alice' },
        mfaByPass: true,
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        { MFABypass: { BypassTypes: ['GoogleAuthenticator'] } },
      );
    });

    it('patches empty BypassTypes when mfaByPass=false', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      await mutationFns[9]({
        userData: { username: 'alice' },
        mfaByPass: false,
      });

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        { MFABypass: { BypassTypes: [] } },
      );
    });

    it('throws errorEnableMfaBypass when mfaByPass=true and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(
        mutationFns[9]({ userData: { username: 'alice' }, mfaByPass: true }),
      ).rejects.toThrow('pageUserManagement.toast.errorEnableMfaBypass');
    });

    it('throws errorDisableMfaBypass when mfaByPass=false and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(
        mutationFns[9]({ userData: { username: 'alice' }, mfaByPass: false }),
      ).rejects.toThrow('pageUserManagement.toast.errorDisableMfaBypass');
    });

    it('onSuccess invalidates users cache', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });
      useUserManagement();
      onSuccesses[9]();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── generateSecretKey error path ──────────────────────────────────────────────

  describe('generateSecretKey error path', () => {
    it('throws when API call fails', async () => {
      setupDefaultMocks();
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('alice');
      const apiError = new Error('network failure');
      api.post.mockRejectedValue(apiError);

      const { generateSecretKey } = useUserManagement();
      await expect(generateSecretKey()).rejects.toThrow();
    });
  });

  // ── verifyRegisterTotp error path ─────────────────────────────────────────────

  describe('verifyRegisterTotp error path', () => {
    it('throws errorOtp when API call fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.post.mockRejectedValue(new Error('fail'));
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('alice');
      useUserManagement();

      await expect(mutationFns[11]('123456')).rejects.toThrow(
        'pageUserManagement.toast.errorOtp',
      );
    });
  });

  // ── disableUsers error toast path ─────────────────────────────────────────────

  describe('enableUsers error message path', () => {
    it('returns error toast message for enableUsers when some patches fail', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      api.all.mockResolvedValue([{}, new Error('fail')]);
      getResponseCount.mockReturnValue({ successCount: 0, errorCount: 1 });
      useUserManagement();

      const enableFn = mutationFns[4]; // enableUsers
      const messages = await enableFn([{ username: 'alice' }]);

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('error');
      expect(messages[0].message).toContain(
        'pageUserManagement.toast.errorBatchEnable',
      );
    });
  });

  describe('disableUsers error message path', () => {
    it('returns error toast message for disableUsers when some patches fail', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      api.all.mockResolvedValue([{}, new Error('fail')]);
      getResponseCount.mockReturnValue({ successCount: 0, errorCount: 1 });
      useUserManagement();

      const disableFn = mutationFns[5]; // disableUsers
      const messages = await disableFn([{ username: 'alice' }]);

      expect(messages).toHaveLength(1);
      expect(messages[0].type).toBe('error');
    });
  });

  // ── rolesQuery queryFn ────────────────────────────────────────────────────────

  describe('rolesQuery queryFn', () => {
    it('fetches roles collection and resolves each role id', async () => {
      let rolesQueryFn;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        const q = stubQuery();
        if (queryCallIndex++ === 2) rolesQueryFn = options.queryFn;
        return q;
      });
      useMutation.mockReturnValue(stubMutation());

      // First call: collection; subsequent calls: individual role member
      api.get
        .mockResolvedValueOnce({
          data: {
            Members: [
              { '@odata.id': '/redfish/v1/AccountService/Roles/Admin' },
            ],
          },
        })
        .mockResolvedValue({ data: { RoleId: 'Administrator' } });
      // api.all receives an array of promises — resolve them all
      api.all.mockImplementation((promises) => Promise.all(promises));

      useUserManagement();
      const result = await rolesQueryFn();
      expect(result).toEqual(['Administrator']);
    });
  });

  // ── usersQuery otpRequired error ──────────────────────────────────────────────

  describe('usersQuery otpRequired error', () => {
    it('throws otpRequired when GenerateSecretKeyRequired message is in response', async () => {
      let usersQueryFn;
      useQuery.mockImplementation((options) => {
        if (
          options.queryKey[1] === 'userManagement' &&
          options.queryKey[2] === 'users'
        ) {
          usersQueryFn = options.queryFn;
        }
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      const otpError = {
        response: {
          data: {
            '@Message.ExtendedInfo': [
              { MessageId: 'Base.1.0.GenerateSecretKeyRequired' },
            ],
          },
        },
      };
      api.get.mockRejectedValue(otpError);

      useUserManagement();
      await expect(usersQueryFn()).rejects.toThrow('otpRequired');
    });

    it('throws generic error when collection fetch fails without otp message', async () => {
      let usersQueryFn;
      useQuery.mockImplementation((options) => {
        if (
          options.queryKey[1] === 'userManagement' &&
          options.queryKey[2] === 'users'
        ) {
          usersQueryFn = options.queryFn;
        }
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      api.get.mockRejectedValue(new Error('network error'));

      useUserManagement();
      await expect(usersQueryFn()).rejects.toThrow(
        'pageUserManagement.toast.errorLoadUsers',
      );
    });

    it('throws generic error when member fetch fails', async () => {
      let usersQueryFn;
      useQuery.mockImplementation((options) => {
        if (
          options.queryKey[1] === 'userManagement' &&
          options.queryKey[2] === 'users'
        ) {
          usersQueryFn = options.queryFn;
        }
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());

      api.get.mockResolvedValueOnce({
        data: {
          Members: [
            { '@odata.id': '/redfish/v1/AccountService/Accounts/alice' },
          ],
        },
      });
      api.all.mockRejectedValue(new Error('member fetch fail'));

      useUserManagement();
      await expect(usersQueryFn()).rejects.toThrow(
        'pageUserManagement.toast.errorLoadUsers',
      );
    });
  });

  // ── updateGlobalMfa error branch ──────────────────────────────────────────────

  describe('updateGlobalMfa error branches', () => {
    it('throws errorDisableMfa when globalMfa=false and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(mutationFns[7](false)).rejects.toThrow(
        'pageUserManagement.toast.errorDisableMfa',
      );
    });

    it('returns successDisableMfa message when globalMfa=false succeeds', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      const result = await mutationFns[7](false);
      expect(result).toBe('pageUserManagement.toast.successDisableMfa');
    });

    it('throws errorEnableMfa when globalMfa=true and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(mutationFns[7](true)).rejects.toThrow(
        'pageUserManagement.toast.errorEnableMfa',
      );
    });
  });

  // ── updateMfaBypass error branch ──────────────────────────────────────────────

  describe('updateMfaBypass error branches', () => {
    it('throws errorDisableMfaBypass when mfa=false and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(
        mutationFns[8]({
          '@odata.id': '/redfish/v1/AccountService/Accounts/alice',
          mfa: false,
          username: 'alice',
        }),
      ).rejects.toThrow('pageUserManagement.toast.errorDisableMfaBypass');
    });

    it('throws errorEnableMfaBypass when mfa=true and patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      await expect(
        mutationFns[8]({
          '@odata.id': '/redfish/v1/AccountService/Accounts/alice',
          mfa: true,
          username: 'alice',
        }),
      ).rejects.toThrow('pageUserManagement.toast.errorEnableMfaBypass');
    });
  });

  // ── accountServiceQuery error path ────────────────────────────────────────────

  describe('accountServiceQuery error path', () => {
    it('throws errorLoadAccountSettings when account service fetch fails', async () => {
      let accountServiceQueryFn;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        if (queryCallIndex++ === 1) accountServiceQueryFn = options.queryFn;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());
      api.get.mockRejectedValue(new Error('network'));
      useUserManagement();

      await expect(accountServiceQueryFn()).rejects.toThrow(
        'pageUserManagement.toast.errorLoadAccountSettings',
      );
    });

    it('returns data on successful account service fetch', async () => {
      let accountServiceQueryFn;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        if (queryCallIndex++ === 1) accountServiceQueryFn = options.queryFn;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());
      const mockData = { MaxPasswordLength: 20 };
      api.get.mockResolvedValue({ data: mockData });
      useUserManagement();

      const result = await accountServiceQueryFn();
      expect(result).toEqual(mockData);
    });
  });

  // ── accountServiceQuery retry function ───────────────────────────────────────

  describe('accountServiceQuery retry function', () => {
    it('returns false for 4xx errors', () => {
      let accountServiceOptions;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        if (queryCallIndex++ === 1) accountServiceOptions = options;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());
      useUserManagement();

      const retry = accountServiceOptions.retry;
      expect(retry(0, { response: { status: 404 } })).toBe(false);
      expect(retry(0, { response: { status: 400 } })).toBe(false);
    });

    it('returns true for 5xx errors up to 2 times', () => {
      let accountServiceOptions;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        if (queryCallIndex++ === 1) accountServiceOptions = options;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());
      useUserManagement();

      const retry = accountServiceOptions.retry;
      expect(retry(0, { response: { status: 500 } })).toBe(true);
      expect(retry(1, { response: { status: 503 } })).toBe(true);
      expect(retry(2, { response: { status: 500 } })).toBe(false);
    });

    it('returns true when error has no status', () => {
      let accountServiceOptions;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        if (queryCallIndex++ === 1) accountServiceOptions = options;
        return stubQuery();
      });
      useMutation.mockReturnValue(stubMutation());
      useUserManagement();

      const retry = accountServiceOptions.retry;
      expect(retry(0, {})).toBe(true);
    });
  });

  // ── deleteUser onSuccess ──────────────────────────────────────────────────────

  describe('deleteUser onSuccess', () => {
    it('invalidates users query on successful delete', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[2](); // deleteUser onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── deleteUser error branch ───────────────────────────────────────────────────

  describe('deleteUser error branch', () => {
    it('throws errorDeleteUser when API delete fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.delete.mockRejectedValue(new Error('network error'));
      useUserManagement();

      const deleteFn = mutationFns[2];
      await expect(deleteFn('alice')).rejects.toThrow(
        'pageUserManagement.toast.errorDeleteUser',
      );
    });
  });

  // ── deleteUsers onSuccess ─────────────────────────────────────────────────────

  describe('deleteUsers onSuccess', () => {
    it('invalidates users query on successful batch delete', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[3](); // deleteUsers onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── enableUsers onSuccess ─────────────────────────────────────────────────────

  describe('enableUsers and disableUsers onSuccess', () => {
    it('enableUsers onSuccess invalidates users query', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[4](); // enableUsers onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });

    it('disableUsers onSuccess invalidates users query', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[5](); // disableUsers onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── saveAccountSettings error branch ──────────────────────────────────────────

  describe('saveAccountSettings error branch', () => {
    it('throws errorSaveSettings when patch fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockRejectedValue(new Error('fail'));
      useUserManagement();

      const saveFn = mutationFns[6];
      await expect(saveFn({ lockoutThreshold: 5 })).rejects.toThrow(
        'pageUserManagement.toast.errorSaveSettings',
      );
    });
  });

  // ── updateUser onSuccess ──────────────────────────────────────────────────────

  describe('updateUser onSuccess', () => {
    it('invalidates users query on successful update', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[1](); // updateUser onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── updateUser generic error branch ──────────────────────────────────────────

  describe('updateUser generic error branch', () => {
    it('throws generic errorUpdateUser when no format error matches', async () => {
      const { REGEX_MAPPINGS } = await import('@/utilities/GlobalConstants');
      REGEX_MAPPINGS.propertyValueFormatError.test.mockReturnValue(false);

      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.patch.mockRejectedValue({
        response: { data: { error: { code: 'Base.1.0.GeneralError' } } },
      });
      useUserManagement();

      const updateFn = mutationFns[1];
      await expect(
        updateFn({
          originalUsername: 'alice',
          username: 'alice',
          privilege: 'Operator',
        }),
      ).rejects.toThrow('pageUserManagement.toast.errorUpdateUser');
    });
  });

  // ── updateMfaBypass onSuccess ─────────────────────────────────────────────────

  describe('updateMfaBypass onSuccess', () => {
    it('invalidates users query on successful MFA bypass update', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[8](); // updateMfaBypass onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── clearSetSecretKey onSuccess and error ──────────────────────────────────────

  describe('clearSetSecretKey onSuccess and error', () => {
    it('invalidates users query on successful clear secret key', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[10](); // clearSetSecretKey onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });

    it('throws errorClearSecretKey when API call fails', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });

      api.post.mockRejectedValue(new Error('fail'));
      useUserManagement();

      const clearFn = mutationFns[10];
      await expect(
        clearFn({ '@odata.id': '/redfish/v1/AccountService/Accounts/alice' }),
      ).rejects.toThrow('pageUserManagement.toast.errorClearSecretKey');
    });
  });

  // ── verifyRegisterTotp onSuccess ──────────────────────────────────────────────

  describe('verifyRegisterTotp onSuccess', () => {
    it('invalidates users query on successful TOTP verification', () => {
      const onSuccesses = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        onSuccesses.push(options.onSuccess);
        return stubMutation();
      });

      useUserManagement();
      onSuccesses[11](); // verifyRegisterTotp onSuccess

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'userManagement', 'users'],
      });
    });
  });

  // ── Wrapper functions in returned object ─────────────────────────────────────

  describe('Wrapper functions call mutateAsync', () => {
    function makeMutateStubs() {
      // We need 12 individual stubs (one per useMutation call)
      const stubs = Array.from({ length: 12 }, () => ({
        mutateAsync: vi.fn().mockResolvedValue('ok'),
        isPending: ref(false),
      }));
      let callIdx = 0;
      useMutation.mockImplementation(() => stubs[callIdx++] ?? stubMutation());
      return stubs;
    }

    it('deleteUsers calls deleteUsersMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { deleteUsers } = useUserManagement();
      const users = [{ username: 'alice' }];
      await deleteUsers(users);
      expect(stubs[3].mutateAsync).toHaveBeenCalledWith(users);
    });

    it('enableUsers calls enableUsersMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { enableUsers } = useUserManagement();
      const users = [{ username: 'bob' }];
      await enableUsers(users);
      expect(stubs[4].mutateAsync).toHaveBeenCalledWith(users);
    });

    it('disableUsers calls disableUsersMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { disableUsers } = useUserManagement();
      const users = [{ username: 'carol' }];
      await disableUsers(users);
      expect(stubs[5].mutateAsync).toHaveBeenCalledWith(users);
    });

    it('saveAccountSettings calls saveAccountSettingsMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { saveAccountSettings } = useUserManagement();
      const settings = { lockoutThreshold: 3 };
      await saveAccountSettings(settings);
      expect(stubs[6].mutateAsync).toHaveBeenCalledWith(settings);
    });

    it('updateGlobalMfa calls updateGlobalMfaMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { updateGlobalMfa } = useUserManagement();
      await updateGlobalMfa(true);
      expect(stubs[7].mutateAsync).toHaveBeenCalledWith(true);
    });

    it('updateMfaBypass calls updateMfaBypassMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { updateMfaBypass } = useUserManagement();
      const obj = { '@odata.id': '/url', mfa: true, username: 'alice' };
      await updateMfaBypass(obj);
      expect(stubs[8].mutateAsync).toHaveBeenCalledWith(obj);
    });

    it('updateMfaBypassNewUser calls updateMfaBypassNewUserMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { updateMfaBypassNewUser } = useUserManagement();
      const params = { userData: { username: 'alice' }, mfaByPass: false };
      await updateMfaBypassNewUser(params);
      expect(stubs[9].mutateAsync).toHaveBeenCalledWith(params);
    });

    it('clearSetSecretKey calls clearSetSecretKeyMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { clearSetSecretKey } = useUserManagement();
      const obj = { '@odata.id': '/url' };
      await clearSetSecretKey(obj);
      expect(stubs[10].mutateAsync).toHaveBeenCalledWith(obj);
    });

    it('verifyRegisterTotp calls verifyRegisterTotpMutation.mutateAsync', async () => {
      useQuery.mockReturnValue(stubQuery());
      const stubs = makeMutateStubs();
      const { verifyRegisterTotp } = useUserManagement();
      await verifyRegisterTotp('123456');
      expect(stubs[11].mutateAsync).toHaveBeenCalledWith('123456');
    });
  });

  // ── rolesQuery Members ?? [] branch ──────────────────────────────────────────

  describe('rolesQuery Members absent branch', () => {
    it('returns empty array when Members is absent from roles collection', async () => {
      let rolesQueryFn;
      let queryCallIndex = 0;
      useQuery.mockImplementation((options) => {
        const q = stubQuery();
        if (queryCallIndex++ === 2) rolesQueryFn = options.queryFn;
        return q;
      });
      useMutation.mockReturnValue(stubMutation());

      // Return data with no Members property
      api.get.mockResolvedValueOnce({ data: {} });
      api.all.mockImplementation((promises) => Promise.all(promises));

      useUserManagement();
      const result = await rolesQueryFn();
      expect(result).toEqual([]);
    });
  });

  // ── updateUser currentUser absent branches ────────────────────────────────────

  describe('updateUser currentUser absent branches', () => {
    it('sets non-ReadOnly RoleId when currentUser is absent', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      await mutationFns[1]({
        originalUsername: 'alice',
        privilege: 'Administrator',
        currentUser: null,
      });
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        expect.objectContaining({ RoleId: 'Administrator' }),
      );
    });

    it('sets ReadOnly RoleId when currentUser is absent and privilege is ReadOnly', async () => {
      const mutationFns = [];
      useQuery.mockReturnValue(stubQuery());
      useMutation.mockImplementation((options) => {
        mutationFns.push(options.mutationFn);
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useUserManagement();

      await mutationFns[1]({
        originalUsername: 'alice',
        privilege: 'ReadOnly',
        currentUser: undefined,
      });
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/AccountService/Accounts/alice',
        expect.objectContaining({ RoleId: 'ReadOnly' }),
      );
    });
  });

  // ── checkCurrentUserMfaBypassed ?? false branch ───────────────────────────────

  describe('checkCurrentUserMfaBypassed ?? false branch', () => {
    it('sets isCurrentUserMfaBypassed to false when MFABypass is absent', async () => {
      setupDefaultMocks();
      api.get.mockResolvedValue({ data: {} });

      const { checkCurrentUserMfaBypassed, isCurrentUserMfaBypassed } =
        useUserManagement();

      await checkCurrentUserMfaBypassed(
        '/redfish/v1/AccountService/Accounts/alice',
      );
      expect(isCurrentUserMfaBypassed.value).toBe(false);
    });
  });
});
