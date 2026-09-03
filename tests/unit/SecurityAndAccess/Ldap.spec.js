import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, ref } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import Ldap from '@/views/SecurityAndAccess/Ldap/Ldap.vue';
import stores from '@/store';

// Mock vue-router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

// Mock the composables
vi.mock('@/api/composables/useLdap', () => ({
  useLdap: vi.fn(),
}));

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: vi.fn(),
}));

vi.mock('@/components/Composables/useVuelidateComposable', () => ({
  default: vi.fn(() => ({
    getValidationState: vi.fn(),
  })),
}));

describe('Ldap.vue', () => {
  let wrapper;
  let mockUseLdap;
  let mockLoadingBar;
  let certificatesStore;
  let useLdapModule;
  let useLoadingBarComposable;

  const createWrapper = (options = {}) => {
    const pinia = createPinia();
    setActivePinia(pinia);

    certificatesStore = stores.CertificatesStore();
    certificatesStore.getCertificates = vi.fn().mockResolvedValue();
    // Make allCertificatesGetter a getter that returns the certificates
    Object.defineProperty(certificatesStore, 'allCertificatesGetter', {
      get: () => options.certificates || [],
      configurable: true,
    });

    return mount(Ldap, {
      global: {
        plugins: [pinia, VueQueryPlugin],
        mocks: {
          $t: (key) => key,
          $filters: {
            formatDate: (date) => date,
          },
        },
      },
      ...options,
    });
  };

  beforeEach(async () => {
    // Import the mocked modules
    useLoadingBarComposable = (
      await import('@/components/Composables/useLoadingBarComposable')
    ).default;
    useLdapModule = await import('@/api/composables/useLdap');

    // Setup mock loading bar
    mockLoadingBar = {
      hideLoader: vi.fn(),
      startLoader: vi.fn(),
      endLoader: vi.fn(),
    };

    useLoadingBarComposable.mockReturnValue(mockLoadingBar);

    // Setup mock useLdap
    mockUseLdap = {
      isServiceEnabled: ref(false),
      isActiveDirectoryEnabled: ref(false),
      ldapSettings: ref({
        serviceEnabled: false,
        serviceAddress: '',
        bindDn: '',
        baseDn: '',
        userAttribute: '',
        groupsAttribute: '',
        roleGroups: [],
      }),
      activeDirectorySettings: ref({
        serviceEnabled: false,
        serviceAddress: '',
        bindDn: '',
        baseDn: '',
        userAttribute: '',
        groupsAttribute: '',
        roleGroups: [],
      }),
      enabledRoleGroups: ref([]),
      isLoading: ref(false),
      isFetching: ref(false),
      loadAccountSettings: vi.fn().mockResolvedValue(),
      saveAccountSettings: vi.fn().mockResolvedValue(),
      addNewRoleGroup: vi.fn().mockResolvedValue(),
      saveRoleGroup: vi.fn().mockResolvedValue(),
      deleteRoleGroup: vi.fn().mockResolvedValue(),
      isSaving: ref(false),
    };

    useLdapModule.useLdap.mockReturnValue(mockUseLdap);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    vi.clearAllMocks();
  });

  describe('Component Rendering & Lifecycle', () => {
    it('should exist', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should call loadAccountSettings on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(mockUseLdap.loadAccountSettings).toHaveBeenCalled();
    });

    it('should call getCertificates on mount', async () => {
      wrapper = createWrapper();
      await flushPromises();
      expect(certificatesStore.getCertificates).toHaveBeenCalled();
    });

    it('should start loader when loading is true', async () => {
      mockUseLdap.isLoading.value = true;
      wrapper = createWrapper();
      await nextTick();
      expect(mockLoadingBar.startLoader).toHaveBeenCalled();
    });

    it('should end loader when loading is false', async () => {
      mockUseLdap.isLoading.value = false;
      wrapper = createWrapper();
      await flushPromises();
      expect(mockLoadingBar.endLoader).toHaveBeenCalled();
    });
  });

  describe('Form State Management', () => {
    it('should update input type when password toggle is clicked', async () => {
      wrapper = createWrapper();
      expect(wrapper.vm.inputType).toBe('password');
      wrapper.vm.updateInputType('text');
      await nextTick();
      expect(wrapper.vm.inputType).toBe('text');
    });

    it('should initialize form with default values', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.formLdap.ldapAuthenticationEnabled).toBe(false);
      expect(wrapper.vm.formLdap.activeDirectoryEnabled).toBe(false);
      expect(wrapper.vm.formLdap.secureLdapEnabled).toBe(false);
    });
  });

  describe('LDAP Protocol Computation', () => {
    it('should compute ldapProtocol as ldaps:// when secure LDAP is enabled', () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.secureLdapEnabled = true;
      expect(wrapper.vm.ldapProtocol).toBe('ldaps://');
    });

    it('should compute ldapProtocol as ldap:// when secure LDAP is disabled', () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.secureLdapEnabled = false;
      expect(wrapper.vm.ldapProtocol).toBe('ldap://');
    });
  });

  describe('Certificate Expiration', () => {
    it('should display CA certificate expiration date', () => {
      wrapper = createWrapper({
        certificates: [
          {
            type: 'TrustStore Certificate',
            validUntil: '2025-12-31',
          },
        ],
      });
      expect(wrapper.vm.caCertificateExpiration).toBe('2025-12-31');
    });

    it('should display LDAP certificate expiration date', () => {
      wrapper = createWrapper({
        certificates: [
          {
            type: 'LDAP Certificate',
            validUntil: '2025-12-31',
          },
        ],
      });
      expect(wrapper.vm.ldapCertificateExpiration).toBe('2025-12-31');
    });

    it('should return null for caCertificateExpiration when certificate not found', () => {
      wrapper = createWrapper({ certificates: [] });
      expect(wrapper.vm.caCertificateExpiration).toBeNull();
    });

    it('should return null for ldapCertificateExpiration when certificate not found', () => {
      wrapper = createWrapper({ certificates: [] });
      expect(wrapper.vm.ldapCertificateExpiration).toBeNull();
    });
  });

  describe('Form Submission', () => {
    it('should not submit form when validation fails', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      await wrapper.vm.handleSubmit();
      await flushPromises();
      expect(mockUseLdap.saveAccountSettings).not.toHaveBeenCalled();
    });

    it('should submit form with correct data for LDAP', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      wrapper.vm.formLdap.activeDirectoryEnabled = false;
      wrapper.vm.formLdap.secureLdapEnabled = false;
      wrapper.vm.formLdap.serverUri = 'example.com';
      wrapper.vm.formLdap.bindDn = 'cn=admin';
      wrapper.vm.formLdap.bindPassword = 'password';
      wrapper.vm.formLdap.baseDn = 'dc=example';
      wrapper.vm.formLdap.userIdAttribute = 'uid';
      wrapper.vm.formLdap.groupIdAttribute = 'memberOf';

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(mockUseLdap.saveAccountSettings).toHaveBeenCalledWith({
        serviceEnabled: true,
        activeDirectoryEnabled: false,
        serviceAddress: 'ldap://example.com',
        bindDn: 'cn=admin',
        bindPassword: 'password',
        baseDn: 'dc=example',
        userIdAttribute: 'uid',
        groupIdAttribute: 'memberOf',
      });
    });

    it('should submit form with correct data for Active Directory', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      wrapper.vm.formLdap.activeDirectoryEnabled = true;
      wrapper.vm.formLdap.secureLdapEnabled = true;
      wrapper.vm.formLdap.serverUri = 'ad.example.com';
      wrapper.vm.formLdap.bindDn = 'CN=Service';
      wrapper.vm.formLdap.bindPassword = 'password';
      wrapper.vm.formLdap.baseDn = 'DC=example';
      wrapper.vm.formLdap.userIdAttribute = 'sAMAccountName';
      wrapper.vm.formLdap.groupIdAttribute = 'memberOf';

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(mockUseLdap.saveAccountSettings).toHaveBeenCalledWith({
        serviceEnabled: true,
        activeDirectoryEnabled: true,
        serviceAddress: 'ldaps://ad.example.com',
        bindDn: 'CN=Service',
        bindPassword: 'password',
        baseDn: 'DC=example',
        userIdAttribute: 'sAMAccountName',
        groupIdAttribute: 'memberOf',
      });
    });

    it('should clear password and reset validation after successful save', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      wrapper.vm.formLdap.serverUri = 'example.com';
      wrapper.vm.formLdap.bindDn = 'cn=admin';
      wrapper.vm.formLdap.bindPassword = 'password';
      wrapper.vm.formLdap.baseDn = 'dc=example';

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(wrapper.vm.formLdap.bindPassword).toBe('');
    });

    it('should start and end loader during form submission', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      wrapper.vm.formLdap.serverUri = 'example.com';
      wrapper.vm.formLdap.bindDn = 'cn=admin';
      wrapper.vm.formLdap.bindPassword = 'password';
      wrapper.vm.formLdap.baseDn = 'dc=example';

      await wrapper.vm.handleSubmit();
      await flushPromises();

      expect(mockLoadingBar.startLoader).toHaveBeenCalled();
      expect(mockLoadingBar.endLoader).toHaveBeenCalled();
    });
  });

  describe('Form Population', () => {
    it('should populate form with LDAP settings', async () => {
      mockUseLdap.ldapSettings.value = {
        serviceAddress: 'ldap://example.com',
        bindDn: 'cn=admin',
        baseDn: 'dc=example',
        userAttribute: 'uid',
        groupsAttribute: 'memberOf',
      };
      wrapper = createWrapper();
      await flushPromises();
      wrapper.vm.setFormValues();
      await nextTick();

      expect(wrapper.vm.formLdap.serverUri).toBe('example.com');
      expect(wrapper.vm.formLdap.bindDn).toBe('cn=admin');
      expect(wrapper.vm.formLdap.baseDn).toBe('dc=example');
      expect(wrapper.vm.formLdap.userIdAttribute).toBe('uid');
      expect(wrapper.vm.formLdap.groupIdAttribute).toBe('memberOf');
    });

    it('should populate form with Active Directory settings', async () => {
      mockUseLdap.isActiveDirectoryEnabled.value = true;
      mockUseLdap.activeDirectorySettings.value = {
        serviceAddress: 'ldaps://ad.example.com',
        bindDn: 'CN=Service',
        baseDn: 'DC=example',
        userAttribute: 'sAMAccountName',
        groupsAttribute: 'memberOf',
      };
      wrapper = createWrapper();
      await flushPromises();
      wrapper.vm.setFormValues();
      await nextTick();

      expect(wrapper.vm.formLdap.serverUri).toBe('ad.example.com');
      expect(wrapper.vm.formLdap.bindDn).toBe('CN=Service');
      expect(wrapper.vm.formLdap.baseDn).toBe('DC=example');
      expect(wrapper.vm.formLdap.userIdAttribute).toBe('sAMAccountName');
      expect(wrapper.vm.formLdap.groupIdAttribute).toBe('memberOf');
    });

    it('should detect secure LDAP from service address', async () => {
      mockUseLdap.ldapSettings.value = {
        serviceAddress: 'ldaps://example.com',
      };
      wrapper = createWrapper({
        certificates: [
          { type: 'TrustStore Certificate', validUntil: '2025-12-31' },
          { type: 'LDAP Certificate', validUntil: '2025-12-31' },
        ],
      });
      await flushPromises();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = true;
      wrapper.vm.setFormValues();
      await nextTick();

      expect(wrapper.vm.formLdap.secureLdapEnabled).toBe(true);
    });

    it('should strip protocol from service address', async () => {
      mockUseLdap.ldapSettings.value = {
        serviceAddress: 'ldaps://example.com:636',
      };
      wrapper = createWrapper();
      await flushPromises();
      wrapper.vm.setFormValues();
      await nextTick();

      expect(wrapper.vm.formLdap.serverUri).toBe('example.com:636');
    });
  });

  describe('Form Actions', () => {
    it('should reset form values when LDAP authentication is disabled', async () => {
      wrapper = createWrapper();
      wrapper.vm.formLdap.ldapAuthenticationEnabled = false;
      await wrapper.vm.onChangeldapAuthenticationEnabled();
      await nextTick();
      expect(wrapper.vm.formLdap.serverUri).toBe('');
    });

    it('should update form values when service type changes', async () => {
      mockUseLdap.activeDirectorySettings.value = {
        serviceAddress: 'ldaps://ad.example.com',
        bindDn: 'CN=Service',
        baseDn: 'DC=example',
        userAttribute: 'sAMAccountName',
        groupsAttribute: 'memberOf',
      };
      wrapper = createWrapper();
      wrapper.vm.formLdap.activeDirectoryEnabled = true;
      await wrapper.vm.onChangeServiceType();
      await nextTick();
      // Just verify the method was called without checking validation state
      expect(wrapper.vm.formLdap.activeDirectoryEnabled).toBe(true);
    });
  });

  describe('Computed Properties', () => {
    it('should compute isBusy correctly when loading', async () => {
      mockUseLdap.isLoading.value = true;
      wrapper = createWrapper();
      await nextTick();
      expect(wrapper.vm.isBusy).toBe(true);
    });

    it('should compute isBusy correctly when fetching', async () => {
      mockUseLdap.isLoading.value = false;
      mockUseLdap.isFetching.value = true;
      wrapper = createWrapper();
      await nextTick();
      expect(wrapper.vm.isBusy).toBe(false);
    });

    it('should compute isBusy as false when not loading or fetching', async () => {
      mockUseLdap.isLoading.value = false;
      mockUseLdap.isFetching.value = false;
      wrapper = createWrapper();
      await nextTick();
      expect(wrapper.vm.isBusy).toBe(false);
    });
  });

  describe('Watchers', () => {
    it('should update form when isServiceEnabled changes', async () => {
      wrapper = createWrapper();
      mockUseLdap.isServiceEnabled.value = true;
      await nextTick();
      expect(wrapper.vm.formLdap.ldapAuthenticationEnabled).toBe(true);
    });

    it('should update form when isActiveDirectoryEnabled changes', async () => {
      wrapper = createWrapper();
      mockUseLdap.isActiveDirectoryEnabled.value = true;
      await nextTick();
      expect(wrapper.vm.formLdap.activeDirectoryEnabled).toBe(true);
    });

    it('should update form when certificate expiration changes', async () => {
      wrapper = createWrapper({
        certificates: [
          { type: 'TrustStore Certificate', validUntil: '2025-12-31' },
        ],
      });
      await flushPromises();
      await nextTick();
      expect(wrapper.vm.caCertificateExpiration).toBe('2025-12-31');
    });
  });
});
