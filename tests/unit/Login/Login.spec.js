import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { createI18n } from 'vue-i18n';

// ---------------------------------------------------------------------------
// Module mocks — declared before any component import
// ---------------------------------------------------------------------------

// Carbon icons are large — stub to avoid slow transforms
vi.mock('@carbon/icons-vue/es/upload/20', () => ({
  default: { template: '<svg />' },
}));

// Stub child modals — they pull in large dep trees
vi.mock('@/views/Login/ModalUploadCertificate.vue', () => ({
  default: { template: '<div />', emits: ['ok'] },
}));

vi.mock('@/views/Login/ModalOtpGenerate.vue', () => ({
  default: { template: '<div />' },
}));

const { onBeforeRouteLeaveMock } = vi.hoisted(() => ({
  onBeforeRouteLeaveMock: vi.fn(),
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
  };
});

vi.mock('@/components/Composables/useVuelidateComposable', () => ({
  default: () => ({
    getValidationState: vi.fn(() => null),
  }),
}));

vi.mock('../../components/Composables/useDataFormatterGlobal', () => ({
  default: () => ({
    dataFormatter: vi.fn((v) => v ?? '--'),
  }),
}));

// Loading bar
const hideLoaderMock = vi.fn();
const startLoaderMock = vi.fn();
const endLoaderMock = vi.fn();

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    hideLoader: hideLoaderMock,
    startLoader: startLoaderMock,
    endLoader: endLoaderMock,
  }),
}));

// Toast
const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({
    successToast: mockSuccessToast,
    errorToast: mockErrorToast,
  }),
}));

// useLogin composable
vi.mock('@/api/composables/useLogin', () => ({
  useLogin: vi.fn(),
}));

// Pinia stores
const mockAuthStore = {
  authError: false,
  unauthError: false,
  authErrorGetter: false,
  unauthErrorGetter: false,
  authSuccess: vi.fn(),
  unauthlogin: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  checkPasswordChangeRequired: vi.fn().mockResolvedValue(false),
  isGenerateOtpRequired: false,
};

const mockGlobalStore = {
  username: null,
  languagePreference: null,
  getCurrentUser: vi.fn().mockResolvedValue(undefined),
  getSystemInfo: vi.fn().mockResolvedValue(undefined),
};

const mockCertificatesStore = {
  addNewACFCertificateOnLoginPage: vi.fn().mockResolvedValue('success'),
};

const mockUserManagementStore = {
  clearSecretKey: vi.fn().mockResolvedValue(undefined),
  generateSecretKey: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store', () => ({
  default: {
    AuthenticationStore: () => mockAuthStore,
    GlobalStore: () => mockGlobalStore,
    CertificatesStore: () => mockCertificatesStore,
    UserManagementStore: () => mockUserManagementStore,
  },
}));

vi.mock('@/i18n', () => ({
  default: { global: { locale: { value: 'en-US' }, t: (key) => key } },
}));

vi.mock('@/eventBus', () => ({
  default: { emit: vi.fn() },
}));

// Import AFTER all mocks
import Login from '@/views/Login/Login.vue';
import { useLogin } from '@/api/composables/useLogin';
import eventBus from '@/eventBus';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLoginHook = (overrides = {}) => ({
  loginPageDetails: ref({
    dateTime: null,
    model: null,
    serial: null,
    acfWindowActive: false,
  }),
  isGlobalMfaEnabled: ref(false),
  isLoading: ref(false),
  login: vi.fn().mockResolvedValue({ isGenerateOtpRequired: false }),
  refetch: vi.fn(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountLogin(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useLogin.mockReturnValue(makeLoginHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  const i18n = createI18n({ legacy: false, locale: 'en-US', messages: {} });

  return mount(Login, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }], i18n],
      mocks: {
        $t: (key) => key,
        $i18n: { locale: 'en-US' },
        $filters: {
          formatDate: (d) => (d ? d.toISOString() : ''),
          formatTime: (d) => (d ? d.toISOString() : ''),
        },
      },
      stubs: {
        Alert: {
          template: '<div class="alert" :data-show="show"><slot /></div>',
          props: ['show', 'variant'],
        },
        InputPasswordToggle: { template: '<div><slot /></div>' },
        InfoTooltip: { template: '<span />' },
        IconUpload: { template: '<svg />' },
        ModalUploadCertificate: { template: '<div />', emits: ['ok'] },
        ModalOtpGenerate: { template: '<div />' },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Login.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthStore.authError = false;
    mockAuthStore.unauthError = false;
    mockAuthStore.authErrorGetter = false;
    mockAuthStore.unauthErrorGetter = false;
    mockAuthStore.checkPasswordChangeRequired.mockResolvedValue(false);
    mockGlobalStore.getSystemInfo.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders without errors', () => {
      const wrapper = mountLogin();
      expect(wrapper.exists()).toBe(true);
    });

    it('renders username input', () => {
      const wrapper = mountLogin();
      expect(
        wrapper.find('[data-test-id="login-input-username"]').exists(),
      ).toBe(true);
    });

    it('renders password input', () => {
      const wrapper = mountLogin();
      expect(
        wrapper.find('[data-test-id="login-input-password"]').exists(),
      ).toBe(true);
    });

    it('renders the submit button', () => {
      const wrapper = mountLogin();
      expect(
        wrapper.find('[data-test-id="login-button-submit"]').exists(),
      ).toBe(true);
    });

    it('renders the language selector', () => {
      const wrapper = mountLogin();
      expect(
        wrapper.find('[data-test-id="login-select-language"]').exists(),
      ).toBe(true);
    });

    it('does not render TOTP section when MFA is disabled', () => {
      const wrapper = mountLogin({ isGlobalMfaEnabled: ref(false) });
      expect(wrapper.find('[data-test-id="login-input-totp"]').exists()).toBe(
        false,
      );
    });

    it('renders TOTP section when MFA is enabled', async () => {
      const wrapper = mountLogin({ isGlobalMfaEnabled: ref(true) });
      await nextTick();
      expect(wrapper.find('[data-test-id="login-input-totp"]').exists()).toBe(
        true,
      );
    });
  });

  // ── Service info display ───────────────────────────────────────────────────

  describe('service info display', () => {
    it('shows -- for dateTime when null', async () => {
      const wrapper = mountLogin();
      await nextTick();
      expect(wrapper.text()).toContain('--');
    });

    it('shows model from loginPageDetails', async () => {
      const wrapper = mountLogin({
        loginPageDetails: ref({
          dateTime: null,
          model: 'IBM 9009-42A',
          serial: null,
          acfWindowActive: false,
        }),
      });
      await nextTick();
      expect(wrapper.text()).toContain('IBM 9009-42A');
    });

    it('shows serial from loginPageDetails', async () => {
      const wrapper = mountLogin({
        loginPageDetails: ref({
          dateTime: null,
          model: null,
          serial: 'SN999',
          acfWindowActive: false,
        }),
      });
      await nextTick();
      expect(wrapper.text()).toContain('SN999');
    });
  });

  // ── Loading bar ────────────────────────────────────────────────────────────

  describe('loading bar', () => {
    it('starts loader when isLoading becomes true', async () => {
      const isLoading = ref(false);
      mountLogin({ isLoading });
      isLoading.value = true;
      await nextTick();
      expect(startLoaderMock).toHaveBeenCalled();
    });

    it('ends loader when isLoading becomes false', async () => {
      const isLoading = ref(true);
      mountLogin({ isLoading });
      isLoading.value = false;
      await nextTick();
      expect(endLoaderMock).toHaveBeenCalled();
    });

    it('registers onBeforeRouteLeave to hide loader', () => {
      mountLogin();
      expect(onBeforeRouteLeaveMock).toHaveBeenCalled();
    });
  });

  // ── submitLogin — validation ───────────────────────────────────────────────

  describe('submitLogin — validation', () => {
    it('does not call login when form fields are empty', async () => {
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });
      await wrapper.vm.submitLogin();
      expect(login).not.toHaveBeenCalled();
    });

    it('disables submit button during login and re-enables after', async () => {
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      await nextTick();

      const submitPromise = wrapper.vm.submitLogin();
      expect(wrapper.vm.disableSubmitButton).toBe(true);

      await submitPromise;
      await flushPromises();

      expect(wrapper.vm.disableSubmitButton).toBe(false);
    });
  });

  // ── submitLogin — success paths ────────────────────────────────────────────

  describe('submitLogin — success', () => {
    it('calls authSuccess after a successful login', async () => {
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(mockAuthStore.authSuccess).toHaveBeenCalled();
    });

    it('stores username in localStorage after login', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(setItemSpy).toHaveBeenCalledWith('storedUsername', 'admin');
      setItemSpy.mockRestore();
    });

    it('calls getSystemInfo on successful login', async () => {
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(mockGlobalStore.getSystemInfo).toHaveBeenCalled();
    });

    it('skips getSystemInfo when password change is required', async () => {
      mockAuthStore.checkPasswordChangeRequired.mockResolvedValue(true);
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(mockGlobalStore.getSystemInfo).not.toHaveBeenCalled();
    });

    it('triggers OTP modal flow when isGenerateOtpRequired is true', async () => {
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: true });
      mockUserManagementStore.clearSecretKey.mockResolvedValue(undefined);
      mockUserManagementStore.generateSecretKey.mockResolvedValue(undefined);

      const wrapper = mountLogin({ login });
      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';

      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(mockUserManagementStore.clearSecretKey).toHaveBeenCalled();
      expect(mockUserManagementStore.generateSecretKey).toHaveBeenCalled();
      expect(eventBus.emit).toHaveBeenCalledWith('otp-generate-modal');
    });

    it('clears authError and unauthError before attempting login', async () => {
      mockAuthStore.authError = true;
      mockAuthStore.unauthError = true;
      const login = vi.fn().mockResolvedValue({ isGenerateOtpRequired: false });
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'password';
      wrapper.vm.submitLogin(); // no await — check synchronous side-effects
      expect(mockAuthStore.authError).toBe(false);
      expect(mockAuthStore.unauthError).toBe(false);
    });
  });

  // ── submitLogin — error path ───────────────────────────────────────────────

  describe('submitLogin — error', () => {
    it('sets authError when login throws', async () => {
      const login = vi.fn().mockRejectedValue(new Error('401 Unauthorized'));
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'wrong';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(mockAuthStore.authError).toBe(true);
    });

    it('re-enables submit button after login error', async () => {
      const login = vi.fn().mockRejectedValue(new Error('error'));
      const wrapper = mountLogin({ login });

      wrapper.vm.userInfo.username = 'admin';
      wrapper.vm.userInfo.password = 'wrong';
      await wrapper.vm.submitLogin();
      await flushPromises();

      expect(wrapper.vm.disableSubmitButton).toBe(false);
    });
  });

  // ── helpers ────────────────────────────────────────────────────────────────

  describe('helpers', () => {
    it('updatePasswordType updates passwordType ref', () => {
      const wrapper = mountLogin();
      wrapper.vm.updatePasswordType('text');
      expect(wrapper.vm.passwordType).toBe('text');
    });

    it('initModalUploadCertificate emits upload-login-certificate on eventBus', () => {
      const wrapper = mountLogin();
      wrapper.vm.initModalUploadCertificate();
      expect(eventBus.emit).toHaveBeenCalledWith('upload-login-certificate');
    });

    it('addNewCertificate calls store and shows success toast', async () => {
      mockCertificatesStore.addNewACFCertificateOnLoginPage.mockResolvedValue(
        'Certificate uploaded',
      );
      const wrapper = mountLogin();

      await wrapper.vm.addNewCertificate({ type: 'CA', file: new Blob() });
      await flushPromises();

      expect(mockSuccessToast).toHaveBeenCalledWith('Certificate uploaded');
    });

    it('addNewCertificate shows error toast on failure', async () => {
      mockCertificatesStore.addNewACFCertificateOnLoginPage.mockRejectedValue({
        message: 'Upload failed',
      });
      const wrapper = mountLogin();

      await wrapper.vm.addNewCertificate({ type: 'CA', file: new Blob() });
      await flushPromises();

      expect(mockErrorToast).toHaveBeenCalledWith('Upload failed');
    });
  });

  // ── composable integration ─────────────────────────────────────────────────

  describe('composable integration', () => {
    it('calls useLogin composable on mount', () => {
      mountLogin();
      expect(useLogin).toHaveBeenCalled();
    });
  });
});
