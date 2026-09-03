import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import ConcurrentMaintenance from '@/views/HardwareStatus/ConcurrentMaintenance/ConcurrentMaintenance.vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const startLoaderMock = vi.fn();
const endLoaderMock = vi.fn();

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    startLoader: startLoaderMock,
    endLoader: endLoaderMock,
  }),
}));

vi.mock('@/api/composables/useConcurrentMaintenance', () => ({
  useConcurrentMaintenance: vi.fn(),
}));

import { useConcurrentMaintenance } from '@/api/composables/useConcurrentMaintenance';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeHook = (overrides = {}) => ({
  readyToRemove: ref(null),
  readyToRemoveControlPanel: ref(null),
  readyToRemoveControlPanelDisp: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  isUpdating: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn().mockResolvedValue(undefined),
  updateTodState: vi.fn().mockResolvedValue(undefined),
  updateControlPanelState: vi.fn().mockResolvedValue(undefined),
  updateControlPanelDispState: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountConcurrentMaintenance(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useConcurrentMaintenance.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(ConcurrentMaintenance, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: { $t: (key) => key },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConcurrentMaintenance.vue', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountConcurrentMaintenance();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the info alert', () => {
    const wrapper = mountConcurrentMaintenance();
    expect(wrapper.text()).toContain('pageConcurrentMaintenance.alert.title');
  });

  it('renders the TOD section label', () => {
    const wrapper = mountConcurrentMaintenance();
    expect(wrapper.text()).toContain('pageConcurrentMaintenance.tod');
  });

  it('renders the control panel section label', () => {
    const wrapper = mountConcurrentMaintenance();
    expect(wrapper.text()).toContain('pageConcurrentMaintenance.controlPanel');
  });

  it('renders the control panel display section label', () => {
    const wrapper = mountConcurrentMaintenance();
    expect(wrapper.text()).toContain(
      'pageConcurrentMaintenance.controlPanelDisp',
    );
  });

  it('shows "--" placeholder when readyToRemove is null', () => {
    const wrapper = mountConcurrentMaintenance({
      readyToRemove: ref(null),
    });
    expect(wrapper.text()).toContain('--');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('calls startLoader when isLoading is true on mount', async () => {
    mountConcurrentMaintenance({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
    expect(endLoaderMock).not.toHaveBeenCalled();
  });

  it('calls endLoader when isLoading is false on mount', async () => {
    mountConcurrentMaintenance({
      isLoading: ref(false),
      isFetching: ref(false),
    });
    await nextTick();
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
    expect(startLoaderMock).not.toHaveBeenCalled();
  });

  it('calls startLoader when isUpdating is true on mount', async () => {
    mountConcurrentMaintenance({
      isLoading: ref(false),
      isFetching: ref(false),
      isUpdating: ref(true),
    });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when isLoading transitions to false', async () => {
    const isFetching = ref(true);
    mountConcurrentMaintenance({ isFetching });
    await nextTick();
    startLoaderMock.mockClear();
    endLoaderMock.mockClear();

    isFetching.value = false;
    await nextTick();

    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when isError becomes true', async () => {
    const isError = ref(false);
    const isFetching = ref(true);
    mountConcurrentMaintenance({ isError, isFetching });
    await nextTick();
    endLoaderMock.mockClear();

    isError.value = true;
    await nextTick();

    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  // ── Toggle visibility ──────────────────────────────────────────────────────

  it('renders BFormCheckbox for TOD when readyToRemove has a boolean value', () => {
    const wrapper = mountConcurrentMaintenance({
      readyToRemove: ref(true),
    });
    // The switch toggle for #battery should be present
    expect(wrapper.find('#battery').exists()).toBe(true);
  });

  it('renders BFormCheckbox for control panel when readyToRemoveControlPanel has a value', () => {
    const wrapper = mountConcurrentMaintenance({
      readyToRemoveControlPanel: ref(false),
    });
    expect(wrapper.find('#base').exists()).toBe(true);
  });

  it('renders BFormCheckbox for control panel display when readyToRemoveControlPanelDisp has a value', () => {
    const wrapper = mountConcurrentMaintenance({
      readyToRemoveControlPanelDisp: ref(true),
    });
    expect(wrapper.find('#lcd').exists()).toBe(true);
  });

  // ── Toggle actions ────────────────────────────────────────────────────────

  it('calls updateTodState when TOD toggle changes', async () => {
    const updateTodState = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountConcurrentMaintenance({
      readyToRemove: ref(false),
      updateTodState,
    });
    await nextTick();

    const todCheckbox = wrapper.find('#battery');
    await todCheckbox.setValue(true);
    await nextTick();

    expect(updateTodState).toHaveBeenCalledTimes(1);
    expect(updateTodState.mock.calls[0][0]).toBe(true);
  });

  it('calls updateControlPanelState when control panel toggle changes', async () => {
    const updateControlPanelState = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountConcurrentMaintenance({
      readyToRemoveControlPanel: ref(false),
      updateControlPanelState,
    });
    await nextTick();

    const checkbox = wrapper.find('#base');
    await checkbox.setValue(true);
    await nextTick();

    expect(updateControlPanelState).toHaveBeenCalledTimes(1);
    expect(updateControlPanelState.mock.calls[0][0]).toBe(true);
  });

  it('calls updateControlPanelDispState when control panel display toggle changes', async () => {
    const updateControlPanelDispState = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountConcurrentMaintenance({
      readyToRemoveControlPanelDisp: ref(false),
      updateControlPanelDispState,
    });
    await nextTick();

    const checkbox = wrapper.find('#lcd');
    await checkbox.setValue(true);
    await nextTick();

    expect(updateControlPanelDispState).toHaveBeenCalledTimes(1);
    expect(updateControlPanelDispState.mock.calls[0][0]).toBe(true);
  });
});
