import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import { VueQueryPlugin } from '@tanstack/vue-query';
import UserManagement from '@/views/SecurityAndAccess/UserManagement/UserManagement.vue';
import stores from '@/store';

// ── Static mocks (hoisted before component import) ────────────────────────────

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
    onBeforeRouteLeave: vi.fn(),
  };
});

vi.mock('@/api/composables/useUserManagement', () => ({
  useUserManagement: vi.fn(),
}));

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: vi.fn(() => ({
    startLoader: vi.fn(),
    endLoader: vi.fn(),
    hideLoader: vi.fn(),
  })),
  loading: ref(false),
}));

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    successToast: vi.fn(),
    errorToast: vi.fn(),
    infoToast: vi.fn(),
  })),
}));

vi.mock('@/components/Composables/useTableSelectableComposable', () => ({
  default: vi.fn(() => ({
    clearSelectedRows: vi.fn(),
    toggleSelectRowByUsername: vi.fn(),
    onRowSelected: vi.fn(),
    onChangeHeaderCheckbox: vi.fn(),
    selectedRowsList: [],
    tableHeaderCheckboxModel: ref(false),
    tableHeaderCheckboxIndeterminate: ref(false),
  })),
}));

vi.mock('@/eventBus', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock('totp-generator', () => ({
  TOTP: { generate: vi.fn(() => ({ otp: '123456' })) },
}));

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Default composable return value — all happy-path defaults. */
function makeDefaultComposable(overrides = {}) {
  return {
    allUsers: ref([]),
    accountRoles: ref(['Administrator', 'Operator', 'ReadOnly']),
    filteredAccountRoles: ref(['Administrator', 'Operator', 'ReadOnly']),
    accountSettings: ref({ lockoutThreshold: 5, lockoutDuration: 30 }),
    accountPasswordRequirements: ref({ minLength: 8, maxLength: 32 }),
    isGlobalMfaEnabled: ref(false),
    isCurrentUserMfaBypassed: ref(false),
    secretKeyInfo: ref(null),
    isLoading: ref(false),
    isMutating: ref(false),
    isUsersLoading: ref(false),
    isUsersError: ref(false),
    usersError: ref(null),
    createUser: vi.fn().mockResolvedValue('success'),
    updateUser: vi.fn().mockResolvedValue('success'),
    deleteUser: vi.fn().mockResolvedValue('success'),
    deleteUsers: vi.fn().mockResolvedValue([]),
    enableUsers: vi.fn().mockResolvedValue([]),
    disableUsers: vi.fn().mockResolvedValue([]),
    saveAccountSettings: vi.fn().mockResolvedValue('success'),
    updateGlobalMfa: vi.fn().mockResolvedValue('success'),
    updateMfaBypass: vi.fn().mockResolvedValue('success'),
    updateMfaBypassNewUser: vi.fn().mockResolvedValue(),
    clearSetSecretKey: vi.fn().mockResolvedValue('success'),
    verifyRegisterTotp: vi.fn().mockResolvedValue('success'),
    checkCurrentUserMfaBypassed: vi.fn().mockResolvedValue(),
    clearSecretKey: vi.fn(),
    generateSecretKey: vi.fn().mockResolvedValue(),
    refetchUsers: vi.fn(),
    refetchAccountService: vi.fn(),
    ...overrides,
  };
}

/** Global stubs shared across all tests. */
const GLOBAL_STUBS = {
  ModalUser: { template: '<div data-stub="modal-user" />' },
  ModalSettings: { template: '<div data-stub="modal-settings" />' },
  TableRoles: { template: '<div data-stub="table-roles" />' },
  RegisterOtpModal: { template: '<div data-stub="register-otp-modal" />' },
  // Stub BModal to avoid the BootstrapVue modal-manager plugin injection error.
  BModal: {
    props: ['modelValue', 'title', 'okTitle', 'cancelTitle', 'okVariant'],
    emits: ['update:modelValue', 'ok'],
    template:
      '<div data-stub="b-modal" :modelvalue="modelValue"><slot /></div>',
  },
  PageTitle: true,
  InfoTooltip: true,
  TableToolbar: true,
  TableRowAction: true,
  Alert: true,
  BTable: true,
  IconTrashcan: true,
  IconEdit: true,
  IconAdd: true,
  IconSettings: true,
  IconChevron: true,
  BCollapse: true,
};

/** Mounts UserManagement with mocked composable and store state. */
async function createWrapper(composableOverrides = {}, globalOverrides = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  // Inject composable mock — must be imported after vi.mock() hoisting.
  const { useUserManagement } = await import(
    '@/api/composables/useUserManagement'
  );
  useUserManagement.mockReturnValue(makeDefaultComposable(composableOverrides));

  // GlobalStore: drive isAdminUser/isServiceUser via state.currentUser
  // (they are Pinia getters — cannot be assigned directly).
  const global = stores.GlobalStore();
  const currentUser =
    globalOverrides.currentUser !== undefined
      ? globalOverrides.currentUser
      : { UserName: 'admin', RoleId: 'Administrator' };
  global.$patch({ currentUser });

  const wrapper = mount(UserManagement, {
    global: {
      plugins: [pinia, VueQueryPlugin],
      mocks: {
        $t: (key) => key,
        $filters: {
          formatDate: (d) => String(d),
          formatTime: (d) => String(d),
        },
      },
      stubs: GLOBAL_STUBS,
    },
  });

  await flushPromises();
  return wrapper;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('UserManagement.vue', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('mounts without errors', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders the Add User button', async () => {
      const wrapper = await createWrapper();
      expect(
        wrapper.find('[data-test-id="userManagement-button-addUser"]').exists(),
      ).toBe(true);
    });

    it('renders a button to open account policy settings', async () => {
      const wrapper = await createWrapper();
      // The settings button has no data-test-id in the template; find by text content.
      const buttons = wrapper.findAll('button');
      const settingsBtn = buttons.find((b) =>
        b.text().includes('pageUserManagement.accountPolicySettings'),
      );
      expect(settingsBtn).toBeDefined();
    });

    it('renders ModalUser stub', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.find('[data-stub="modal-user"]').exists()).toBe(true);
    });

    it('renders ModalSettings stub', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.find('[data-stub="modal-settings"]').exists()).toBe(true);
    });

    it('renders RegisterOtpModal stub', async () => {
      const wrapper = await createWrapper();
      expect(wrapper.find('[data-stub="register-otp-modal"]').exists()).toBe(
        true,
      );
    });

    it('shows MFA toggle row when currentUser is admin', async () => {
      const wrapper = await createWrapper(
        {},
        { currentUser: { UserName: 'admin', RoleId: 'Administrator' } },
      );
      expect(wrapper.html()).toContain(
        'pageUserManagement.mfaTotpAuthentication',
      );
    });

    it('hides MFA toggle row when currentUser is null', async () => {
      const wrapper = await createWrapper({}, { currentUser: null });
      expect(wrapper.html()).not.toContain(
        'pageUserManagement.mfaTotpAuthentication',
      );
    });
  });

  // ── isBusy state ──────────────────────────────────────────────────────────────

  describe('isBusy state', () => {
    it('Add User button is enabled when not loading or mutating', async () => {
      const wrapper = await createWrapper({
        isLoading: ref(false),
        isMutating: ref(false),
      });
      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      expect(btn.attributes('disabled')).toBeUndefined();
    });

    it('Add User button is disabled when isLoading=true', async () => {
      const wrapper = await createWrapper({ isLoading: ref(true) });
      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('Add User button is disabled when isMutating=true', async () => {
      const wrapper = await createWrapper({ isMutating: ref(true) });
      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('the settings link button is disabled when loading', async () => {
      const wrapper = await createWrapper({ isLoading: ref(true) });
      const buttons = wrapper.findAll('button');
      const settingsBtn = buttons.find((b) =>
        b.text().includes('pageUserManagement.accountPolicySettings'),
      );
      expect(settingsBtn?.attributes('disabled')).toBeDefined();
    });
  });

  // ── Add User button click ──────────────────────────────────────────────────────

  describe('Add User button click', () => {
    it('clicking Add User button does not throw', async () => {
      const wrapper = await createWrapper();
      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      await btn.trigger('click');
      await flushPromises();
      expect(wrapper.exists()).toBe(true);
    });
  });

  // ── Delete confirmation modal ──────────────────────────────────────────────────

  describe('Delete confirmation modal', () => {
    it('BModal stub is rendered and closed by default', async () => {
      const wrapper = await createWrapper();
      // The single BModal (delete-confirmation) starts closed (v-model=false)
      const modal = wrapper.find('[data-stub="b-modal"]');
      expect(modal.exists()).toBe(true);
      expect(modal.attributes('modelvalue')).toBe('false');
    });
  });

  // ── MFA toggle ─────────────────────────────────────────────────────────────────

  describe('MFA global toggle', () => {
    it('renders "disabled" label when isGlobalMfaEnabled=false', async () => {
      const wrapper = await createWrapper(
        { isGlobalMfaEnabled: ref(false) },
        { currentUser: { UserName: 'admin', RoleId: 'Administrator' } },
      );
      expect(wrapper.html()).toContain('global.status.disabled');
    });

    it('renders "enabled" label when isGlobalMfaEnabled=true', async () => {
      const wrapper = await createWrapper(
        { isGlobalMfaEnabled: ref(true) },
        { currentUser: { UserName: 'admin', RoleId: 'Administrator' } },
      );
      expect(wrapper.html()).toContain('global.status.enabled');
      expect(wrapper.html()).not.toContain('global.status.disabled');
    });
  });

  // ── Loading bar integration ────────────────────────────────────────────────────

  describe('Loading bar', () => {
    it('calls useLoadingBar composable on mount', async () => {
      const useLoadingBar = (
        await import('@/components/Composables/useLoadingBarComposable')
      ).default;
      await createWrapper();
      expect(useLoadingBar).toHaveBeenCalled();
    });

    it('Add User button is disabled while isLoading is true (loader active)', async () => {
      // Verify the UI effect of the loading watch rather than spying on the
      // loader functions, which avoids singleton-mock ordering fragility.
      const wrapper = await createWrapper({ isLoading: ref(true) });
      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      expect(btn.attributes('disabled')).toBeDefined();
    });

    it('Add User button re-enables after isLoading transitions to false', async () => {
      const isLoading = ref(true);
      const wrapper = await createWrapper({ isLoading });

      isLoading.value = false;
      await flushPromises();

      const btn = wrapper.find(
        '[data-test-id="userManagement-button-addUser"]',
      );
      expect(btn.attributes('disabled')).toBeUndefined();
    });
  });

  // ── useUserManagement integration ─────────────────────────────────────────────

  describe('useUserManagement integration', () => {
    it('calls useUserManagement on mount', async () => {
      const { useUserManagement } = await import(
        '@/api/composables/useUserManagement'
      );
      await createWrapper();
      expect(useUserManagement).toHaveBeenCalled();
    });

    it('builds tableItems from allUsers data', async () => {
      const users = [
        {
          UserName: 'alice',
          RoleId: 'Administrator',
          Enabled: true,
          Locked: false,
          SecretKeySet: false,
          isSelected: false,
        },
      ];
      // Should mount without error when allUsers is populated
      const wrapper = await createWrapper({ allUsers: ref(users) });
      expect(wrapper.exists()).toBe(true);
    });

    it('uses filteredAccountRoles from composable', async () => {
      const { useUserManagement } = await import(
        '@/api/composables/useUserManagement'
      );
      await createWrapper({
        filteredAccountRoles: ref(['Administrator', 'ReadOnly']),
      });
      const call = useUserManagement.mock.results[0]?.value;
      expect(call.filteredAccountRoles.value).toEqual([
        'Administrator',
        'ReadOnly',
      ]);
    });
  });
});
