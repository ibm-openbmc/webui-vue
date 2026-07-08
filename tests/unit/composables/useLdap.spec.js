import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

// Mock dependencies
vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishResource: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    patch: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    successToast: vi.fn(),
    errorToast: vi.fn(),
  })),
}));

vi.mock('@tanstack/vue-query', async () => {
  const actual = await vi.importActual('@tanstack/vue-query');
  return {
    ...actual,
    useMutation: vi.fn(),
    useQueryClient: vi.fn(),
  };
});

import { useRedfishResource } from '@/api/composables/useAllSubResources';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useLdap } from '@/api/composables/useLdap';
import api from '@/store/api';

const makeMockRedfishResource = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: ref(false),
  ...overrides,
});

describe('useLdap', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock query client
    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    useQueryClient.mockReturnValue(mockQueryClient);

    // Setup default mock mutations
    useMutation.mockReturnValue(makeMockMutation());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Loading', () => {
    it('returns empty ldap settings when data is null', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(null) }),
      );

      const { ldapSettings } = useLdap();

      expect(ldapSettings.value).toEqual({
        serviceEnabled: false,
        serviceAddress: '',
        bindDn: '',
        baseDn: '',
        userAttribute: undefined,
        groupsAttribute: undefined,
        roleGroups: [],
      });
    });

    it('maps LDAP data correctly', () => {
      const mockData = {
        LDAP: {
          ServiceEnabled: true,
          ServiceAddresses: ['ldap://example.com'],
          Authentication: {
            Username: 'cn=admin,dc=example,dc=com',
          },
          LDAPService: {
            SearchSettings: {
              BaseDistinguishedNames: ['dc=example,dc=com'],
              UsernameAttribute: 'uid',
              GroupsAttribute: 'memberOf',
            },
          },
          RemoteRoleMapping: [
            { LocalRole: 'Administrator', RemoteGroup: 'admins' },
          ],
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { ldapSettings } = useLdap();

      expect(ldapSettings.value).toEqual({
        serviceEnabled: true,
        serviceAddress: 'ldap://example.com',
        bindDn: 'cn=admin,dc=example,dc=com',
        baseDn: 'dc=example,dc=com',
        userAttribute: 'uid',
        groupsAttribute: 'memberOf',
        roleGroups: [{ LocalRole: 'Administrator', RemoteGroup: 'admins' }],
      });
    });

    it('maps Active Directory data correctly', () => {
      const mockData = {
        ActiveDirectory: {
          ServiceEnabled: true,
          ServiceAddresses: ['ldaps://ad.example.com'],
          Authentication: {
            Username: 'CN=Service Account,OU=Users,DC=example,DC=com',
          },
          LDAPService: {
            SearchSettings: {
              BaseDistinguishedNames: ['DC=example,DC=com'],
              UsernameAttribute: 'sAMAccountName',
              GroupsAttribute: 'memberOf',
            },
          },
          RemoteRoleMapping: [
            { LocalRole: 'Operator', RemoteGroup: 'operators' },
          ],
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { activeDirectorySettings } = useLdap();

      expect(activeDirectorySettings.value).toEqual({
        serviceEnabled: true,
        serviceAddress: 'ldaps://ad.example.com',
        bindDn: 'CN=Service Account,OU=Users,DC=example,DC=com',
        baseDn: 'DC=example,DC=com',
        userAttribute: 'sAMAccountName',
        groupsAttribute: 'memberOf',
        roleGroups: [{ LocalRole: 'Operator', RemoteGroup: 'operators' }],
      });
    });

    it('returns correct service enabled state when LDAP is enabled', () => {
      const mockData = {
        LDAP: { ServiceEnabled: true },
        ActiveDirectory: { ServiceEnabled: false },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { isServiceEnabled } = useLdap();

      expect(isServiceEnabled.value).toBe(true);
    });

    it('returns correct service enabled state when Active Directory is enabled', () => {
      const mockData = {
        LDAP: { ServiceEnabled: false },
        ActiveDirectory: { ServiceEnabled: true },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { isServiceEnabled, isActiveDirectoryEnabled } = useLdap();

      expect(isServiceEnabled.value).toBe(true);
      expect(isActiveDirectoryEnabled.value).toBe(true);
    });

    it('returns enabled role groups from LDAP when LDAP is active', () => {
      const mockData = {
        LDAP: {
          ServiceEnabled: true,
          RemoteRoleMapping: [
            { LocalRole: 'Administrator', RemoteGroup: 'ldap-admins' },
          ],
        },
        ActiveDirectory: {
          ServiceEnabled: false,
          RemoteRoleMapping: [
            { LocalRole: 'Operator', RemoteGroup: 'ad-operators' },
          ],
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { enabledRoleGroups } = useLdap();

      expect(enabledRoleGroups.value).toEqual([
        { LocalRole: 'Administrator', RemoteGroup: 'ldap-admins' },
      ]);
    });

    it('returns enabled role groups from Active Directory when AD is active', () => {
      const mockData = {
        LDAP: {
          ServiceEnabled: false,
          RemoteRoleMapping: [
            { LocalRole: 'Administrator', RemoteGroup: 'ldap-admins' },
          ],
        },
        ActiveDirectory: {
          ServiceEnabled: true,
          RemoteRoleMapping: [
            { LocalRole: 'Operator', RemoteGroup: 'ad-operators' },
          ],
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const { enabledRoleGroups } = useLdap();

      expect(enabledRoleGroups.value).toEqual([
        { LocalRole: 'Operator', RemoteGroup: 'ad-operators' },
      ]);
    });

    it('exposes isLoading and isFetching from useRedfishResource', () => {
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({
          isLoading: ref(true),
          isFetching: ref(true),
        }),
      );

      const { isLoading, isFetching } = useLdap();

      expect(isLoading.value).toBe(true);
      expect(isFetching.value).toBe(true);
    });
  });

  describe('Save Account Settings', () => {
    it('saves LDAP settings when activeDirectoryEnabled is false', async () => {
      const mockData = {
        LDAP: { ServiceEnabled: false },
        ActiveDirectory: { ServiceEnabled: false },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { saveAccountSettings } = useLdap();

      await saveAccountSettings({
        serviceEnabled: true,
        serviceAddress: 'ldap://test.com',
        activeDirectoryEnabled: false,
        bindDn: 'cn=admin',
        bindPassword: 'password',
        baseDn: 'dc=test',
        userIdAttribute: 'uid',
        groupIdAttribute: 'memberOf',
      });

      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it('saves Active Directory settings when activeDirectoryEnabled is true', async () => {
      const mockData = {
        LDAP: { ServiceEnabled: false },
        ActiveDirectory: { ServiceEnabled: false },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );

      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { saveAccountSettings } = useLdap();

      await saveAccountSettings({
        serviceEnabled: true,
        serviceAddress: 'ldaps://ad.test.com',
        activeDirectoryEnabled: true,
        bindDn: 'CN=Service',
        bindPassword: 'password',
        baseDn: 'DC=test',
        userIdAttribute: 'sAMAccountName',
        groupIdAttribute: 'memberOf',
      });

      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  describe('Role Group Management', () => {
    beforeEach(() => {
      const mockData = {
        LDAP: {
          ServiceEnabled: true,
          RemoteRoleMapping: [
            { LocalRole: 'Administrator', RemoteGroup: 'admins' },
          ],
        },
        ActiveDirectory: { ServiceEnabled: false },
      };

      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ data: ref(mockData) }),
      );
    });

    it('adds a new role group', async () => {
      const mockMutateAsync = vi
        .fn()
        .mockResolvedValue({ groupName: 'operators' });
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { addNewRoleGroup } = useLdap();

      await addNewRoleGroup({
        groupName: 'operators',
        groupPrivilege: 'Operator',
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        groupName: 'operators',
        groupPrivilege: 'Operator',
      });
    });

    it('saves an existing role group', async () => {
      const mockMutateAsync = vi
        .fn()
        .mockResolvedValue({ groupName: 'new-admins' });
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { saveRoleGroup } = useLdap();

      await saveRoleGroup({
        groupNamePreviously: 'admins',
        groupName: 'new-admins',
        groupPrivilege: 'Administrator',
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        groupNamePreviously: 'admins',
        groupName: 'new-admins',
        groupPrivilege: 'Administrator',
      });
    });

    it('deletes role groups', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(1);
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { deleteRoleGroup } = useLdap();

      await deleteRoleGroup({
        roleGroups: [{ groupName: 'admins' }],
      });

      expect(mockMutateAsync).toHaveBeenCalledWith({
        roleGroups: [{ groupName: 'admins' }],
      });
    });
  });

  describe('Load Account Settings', () => {
    it('calls refetch when loadAccountSettings is invoked', async () => {
      const mockRefetch = vi.fn().mockResolvedValue(undefined);
      useRedfishResource.mockReturnValue(
        makeMockRedfishResource({ refetch: mockRefetch }),
      );

      const { loadAccountSettings } = useLdap();

      await loadAccountSettings();

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Mutation States', () => {
    it('returns isSaving as true when any mutation is pending', () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());

      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isSaving } = useLdap();

      expect(isSaving.value).toBe(true);
    });

    it('returns isSaving as false when no mutations are pending', () => {
      useRedfishResource.mockReturnValue(makeMockRedfishResource());

      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(false) }));

      const { isSaving } = useLdap();

      expect(isSaving.value).toBe(false);
    });
  });
});

// Made with Bob
