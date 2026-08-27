import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import FactoryReset from '@/views/Operations/FactoryReset/FactoryReset.vue';
import stores from '@/store';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { onBeforeRouteLeaveMock } = vi.hoisted(() => ({
  onBeforeRouteLeaveMock: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
  };
});

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

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({
    successToast: mockSuccessToast,
    errorToast: mockErrorToast,
  }),
}));

const mockResetBios = vi.fn();
const mockResetToDefaults = vi.fn();

vi.mock('@/api/composables/useFactoryReset', () => ({
  useFactoryReset: () => ({
    resetBios: mockResetBios,
    resetToDefaults: mockResetToDefaults,
    isResetting: false,
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountFactoryReset(serverStatus = 'off') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const pinia = createPinia();
  setActivePinia(pinia);

  const globalStore = stores.GlobalStore();
  globalStore.serverStatus = serverStatus;

  return mount(FactoryReset, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        ModalReset: {
          template: '<div />',
          props: ['resetType'],
          emits: ['okConfirm'],
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FactoryReset.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountFactoryReset();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the PageTitle component', () => {
    const wrapper = mountFactoryReset();
    const pageTitle = wrapper.findComponent({ name: 'PageTitle' });
    expect(pageTitle.exists()).toBe(true);
    expect(pageTitle.props('title')).toBe('appPageTitle.factoryReset');
  });

  it('renders the info alert', () => {
    const wrapper = mountFactoryReset();
    const alert = wrapper.findComponent({ name: 'Alert' });
    expect(alert.exists()).toBe(true);
    expect(alert.props('variant')).toBe('info');
  });

  it('renders the reset form', () => {
    const wrapper = mountFactoryReset();
    expect(wrapper.find('#factory-reset').exists()).toBe(true);
  });

  it('renders resetBios and resetToDefaults radio options', () => {
    const wrapper = mountFactoryReset();
    expect(wrapper.find('input[value="resetBios"]').exists()).toBe(true);
    expect(wrapper.find('input[value="resetToDefaults"]').exists()).toBe(true);
  });

  it('renders the submit button', () => {
    const wrapper = mountFactoryReset();
    expect(
      wrapper.find('[data-test-id="factoryReset-button-submit"]').exists(),
    ).toBe(true);
  });

  // ── Default state ──────────────────────────────────────────────────────

  it('defaults resetOption to resetBios', () => {
    const wrapper = mountFactoryReset();
    expect(wrapper.vm.resetOption).toBe('resetBios');
  });

  // ── Button disabled state ─────────────────────────────────────────────

  it('submit button is enabled when server is off', () => {
    const wrapper = mountFactoryReset('off');
    const btn = wrapper.find('[data-test-id="factoryReset-button-submit"]');
    expect(btn.attributes('disabled')).toBeUndefined();
  });

  it('submit button is disabled when server is on', () => {
    const wrapper = mountFactoryReset('on');
    const btn = wrapper.find('[data-test-id="factoryReset-button-submit"]');
    expect(btn.attributes('disabled')).toBeDefined();
  });

  // ── serverStatus computed ─────────────────────────────────────────────

  it('serverStatus computed reads from GlobalStore', () => {
    const wrapper = mountFactoryReset('on');
    expect(wrapper.vm.serverStatus).toBe('on');
  });

  // ── onOkConfirm routing ────────────────────────────────────────────────

  it('calls onResetBiosConfirm when resetOption is resetBios', async () => {
    mockResetBios.mockResolvedValue('bios success');
    const wrapper = mountFactoryReset();
    await wrapper.vm.$nextTick();

    wrapper.vm.resetOption = 'resetBios';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockResetBios).toHaveBeenCalled();
    expect(mockResetToDefaults).not.toHaveBeenCalled();
  });

  it('calls onResetToDefaultsConfirm when resetOption is resetToDefaults', async () => {
    mockResetBios.mockResolvedValue('bios success');
    mockResetToDefaults.mockResolvedValue('defaults success');
    const wrapper = mountFactoryReset();
    await wrapper.vm.$nextTick();

    wrapper.vm.resetOption = 'resetToDefaults';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockResetBios).toHaveBeenCalled();
    expect(mockResetToDefaults).toHaveBeenCalled();
  });

  // ── resetBios flow ────────────────────────────────────────────────────

  it('shows success toast after resetBios succeeds', async () => {
    mockResetBios.mockResolvedValue('BIOS reset successfully');
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetBios';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockSuccessToast).toHaveBeenCalledWith('BIOS reset successfully');
  });

  it('shows error toast when resetBios fails', async () => {
    mockResetBios.mockRejectedValue({ message: 'BIOS reset failed' });
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetBios';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockErrorToast).toHaveBeenCalledWith('BIOS reset failed');
  });

  // ── resetToDefaults flow ──────────────────────────────────────────────

  it('starts and ends loader during resetToDefaults', async () => {
    mockResetBios.mockResolvedValue('');
    mockResetToDefaults.mockResolvedValue('Factory reset successfully');
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetToDefaults';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(startLoaderMock).toHaveBeenCalled();
    expect(endLoaderMock).toHaveBeenCalled();
  });

  it('shows success toast after resetToDefaults succeeds', async () => {
    mockResetBios.mockResolvedValue('');
    mockResetToDefaults.mockResolvedValue('Factory reset successfully');
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetToDefaults';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockSuccessToast).toHaveBeenCalledWith('Factory reset successfully');
  });

  it('shows error toast when resetToDefaults fails', async () => {
    mockResetBios.mockResolvedValue('');
    mockResetToDefaults.mockRejectedValue({ message: 'Reset failed' });
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetToDefaults';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(mockErrorToast).toHaveBeenCalledWith('Reset failed');
    expect(endLoaderMock).toHaveBeenCalled();
  });

  it('ends loader even when resetBios fails in resetToDefaults flow', async () => {
    mockResetBios.mockRejectedValue({ message: 'BIOS error' });
    const wrapper = mountFactoryReset();

    wrapper.vm.resetOption = 'resetToDefaults';
    wrapper.vm.onOkConfirm();
    await flushPromises();

    expect(endLoaderMock).toHaveBeenCalled();
  });

  // ── onBeforeRouteLeave ────────────────────────────────────────────────

  it('registers an onBeforeRouteLeave hook', () => {
    mountFactoryReset();
    expect(onBeforeRouteLeaveMock).toHaveBeenCalled();
  });
});
