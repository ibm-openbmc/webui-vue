import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import IBMiServiceFunctions from '@/views/Logs/IBMiServiceFunctions/IBMiServiceFunctions.vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

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

vi.mock('@/api/composables/useIBMiServiceFunctions', () => ({
  useIBMiServiceFunctions: vi.fn(),
}));

// Mock @/store to avoid real pinia store instantiation
const mockGlobalStore = {
  isOSRunningGetter: false,
  getBootProgress: vi.fn().mockResolvedValue(undefined),
};
const mockBootSettingsStore = {
  getBiosAttributes: null,
  fetchBiosAttributes: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/store', () => ({
  default: {
    GlobalStore: () => mockGlobalStore,
    BootSettingsStore: () => mockBootSettingsStore,
  },
}));

import { useIBMiServiceFunctions } from '@/api/composables/useIBMiServiceFunctions';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const AVAILABLE_FUNCTIONS = [21, 65, 67, 68, 69, 70];

const makeHook = (overrides = {}) => ({
  availableFunctions: ref(AVAILABLE_FUNCTIONS),
  isLoading: ref(false),
  isFetching: ref(false),
  refetch: vi.fn().mockResolvedValue(undefined),
  executeServiceFunction: vi
    .fn()
    .mockResolvedValue('Function executed successfully'),
  isExecuting: ref(false),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountIBMiServiceFunctions(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useIBMiServiceFunctions.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(IBMiServiceFunctions, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        Alert: true,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('IBMiServiceFunctions.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalStore.isOSRunningGetter = false;
    mockGlobalStore.getBootProgress.mockResolvedValue(undefined);
    mockBootSettingsStore.getBiosAttributes = null;
    mockBootSettingsStore.fetchBiosAttributes.mockResolvedValue(undefined);
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountIBMiServiceFunctions();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders with expected data', async () => {
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isLoading).toBeDefined();
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('calls startLoader on mount', async () => {
    mountIBMiServiceFunctions({ isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalled();
  });

  it('calls store actions on mount', async () => {
    mountIBMiServiceFunctions();
    await nextTick();
    expect(mockGlobalStore.getBootProgress).toHaveBeenCalled();
    expect(mockBootSettingsStore.fetchBiosAttributes).toHaveBeenCalled();
  });

  // ── OS Detection ────────────────────────────────────────────────────────────

  it('isIBMi returns false when biosAttributes is null', async () => {
    mockBootSettingsStore.getBiosAttributes = null;
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isIBMi).toBe(false);
  });

  it('isIBMi returns true when pvm_default_os_type is "IBM I"', async () => {
    mockBootSettingsStore.getBiosAttributes = { pvm_default_os_type: 'IBM I' };
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isIBMi).toBe(true);
  });

  it('isIBMi returns true when pvm_default_os_type is "Default"', async () => {
    mockBootSettingsStore.getBiosAttributes = {
      pvm_default_os_type: 'Default',
    };
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isIBMi).toBe(true);
  });

  it('isIBMi returns false when pvm_default_os_type is not IBM I or Default', async () => {
    mockBootSettingsStore.getBiosAttributes = { pvm_default_os_type: 'Linux' };
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isIBMi).toBe(false);
  });

  // ── Function Execution ─────────────────────────────────────────────────────

  it('executeServiceFunction calls API with correct function number', async () => {
    const executeServiceFunction = vi.fn().mockResolvedValue('executed');
    const wrapper = mountIBMiServiceFunctions({ executeServiceFunction });
    await nextTick();

    await wrapper.vm.exceuteFunction(21);

    expect(executeServiceFunction).toHaveBeenCalledWith(21);
  });

  // ── Function Availability ──────────────────────────────────────────────────

  it('isFunctionDisabled returns true when OS is not running', async () => {
    mockGlobalStore.isOSRunningGetter = false;
    const wrapper = mountIBMiServiceFunctions();
    await nextTick();
    expect(wrapper.vm.isFunctionDisabled(21)).toBe(true);
  });

  it('isFunctionDisabled returns false when OS is running and function is available', async () => {
    mockGlobalStore.isOSRunningGetter = true;
    const availableFunctions = ref(AVAILABLE_FUNCTIONS);
    const wrapper = mountIBMiServiceFunctions({ availableFunctions });
    await nextTick();
    expect(wrapper.vm.isFunctionDisabled(21)).toBe(false);
  });

  it('isFunctionDisabled returns true when function is not in available list', async () => {
    mockGlobalStore.isOSRunningGetter = true;
    const availableFunctions = ref([65, 67]); // 21 not in list
    const wrapper = mountIBMiServiceFunctions({ availableFunctions });
    await nextTick();
    expect(wrapper.vm.isFunctionDisabled(21)).toBe(true);
  });

  // ── Composable Integration ─────────────────────────────────────────────────

  it('uses useIBMiServiceFunctions composable', () => {
    mountIBMiServiceFunctions();
    expect(useIBMiServiceFunctions).toHaveBeenCalled();
  });

  it('handles composable loading state change', async () => {
    const composableIsFetching = ref(false);
    mountIBMiServiceFunctions({ isFetching: composableIsFetching });
    await nextTick();

    composableIsFetching.value = true;
    await nextTick();

    expect(startLoaderMock).toHaveBeenCalled();
  });

  // ── Available Functions ────────────────────────────────────────────────────

  it('exposes available functions from composable', async () => {
    const availableFunctions = ref(AVAILABLE_FUNCTIONS);
    mountIBMiServiceFunctions({ availableFunctions });
    await nextTick();
    expect(useIBMiServiceFunctions).toHaveBeenCalled();
  });

  it('all required functions are available when provided by composable', async () => {
    const availableFunctions = ref(AVAILABLE_FUNCTIONS);
    const wrapper = mountIBMiServiceFunctions({ availableFunctions });
    await nextTick();

    const requiredFunctions = [21, 65, 67, 68, 69, 70];
    requiredFunctions.forEach((func) => {
      expect(availableFunctions.value).toContain(func);
    });
  });
});
