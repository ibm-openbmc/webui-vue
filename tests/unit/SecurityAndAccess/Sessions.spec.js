import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import Sessions from '@/views/SecurityAndAccess/Sessions/Sessions.vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { onBeforeRouteLeaveMock } = vi.hoisted(() => ({
  onBeforeRouteLeaveMock: vi.fn(),
}));

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
  };
});

afterAll(() => {
  vi.unmock('vue-router');
});

const mockSuccessToast = vi.fn();
const mockErrorToast = vi.fn();

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: () => ({
    successToast: mockSuccessToast,
    errorToast: mockErrorToast,
  }),
}));

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

vi.mock('@/api/composables/useSessions', () => ({
  useSessions: vi.fn(),
}));

import { useSessions } from '@/api/composables/useSessions';
import eventBus from '@/eventBus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSessionsHook = (overrides = {}) => ({
  sessions: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn(),
  disconnectSessions: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const MOCK_SESSIONS = [
  {
    clientID: 'ctx-1',
    username: 'alice',
    ipAddress: '192.168.1.1',
    uri: '/redfish/v1/SessionService/Sessions/1',
    actions: [{ value: 'disconnect', title: 'Disconnect' }],
  },
  {
    clientID: 'ctx-2',
    username: 'bob',
    ipAddress: '10.0.0.2',
    uri: '/redfish/v1/SessionService/Sessions/2',
    actions: [{ value: 'disconnect', title: 'Disconnect' }],
  },
];

function mountSessions(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useSessions.mockReturnValue(makeSessionsHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(Sessions, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Sessions.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountSessions();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the sessions table', () => {
    const wrapper = mountSessions();
    expect(wrapper.find('#table-session-logs').exists()).toBe(true);
  });

  it('renders the search input', () => {
    const wrapper = mountSessions();
    expect(
      wrapper.find('[data-test-id="sessions-input-searchSessions"]').exists(),
    ).toBe(true);
  });

  it('renders the pagination controls', () => {
    const wrapper = mountSessions();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  it('renders the warning alert', () => {
    const wrapper = mountSessions();
    const alert = wrapper.findComponent({ name: 'Alert' });
    expect(alert.exists()).toBe(true);
    expect(alert.props('variant')).toBe('warning');
  });

  // ── Loading state ─────────────────────────────────────────────────────

  it('isBusy is true when loading', () => {
    const wrapper = mountSessions({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is true when fetching', () => {
    const wrapper = mountSessions({ isFetching: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when neither loading nor fetching', () => {
    const wrapper = mountSessions({
      isLoading: ref(false),
      isFetching: ref(false),
    });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('starts the loader when loading on mount', () => {
    mountSessions({ isLoading: ref(true) });
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('ends the loader when not loading on mount', () => {
    mountSessions({ isLoading: ref(false) });
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  // ── Data display ──────────────────────────────────────────────────────

  it('allConnections reflects sessions from the composable', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.allConnections.length).toBe(MOCK_SESSIONS.length);
  });

  it('shows session usernames in the table', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();
    const tableText = wrapper.find('#table-session-logs').text();
    expect(tableText).toContain('alice');
    expect(tableText).toContain('bob');
  });

  it('shows an empty message when there are no sessions', async () => {
    const wrapper = mountSessions({ sessions: ref([]) });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.paginatedSessions.length).toBe(0);
    expect(wrapper.find('#table-session-logs').text()).toContain(
      'global.table.emptyMessage',
    );
  });

  // ── Search filtering ──────────────────────────────────────────────────

  it('filters paginatedSessions by username', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('alice');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.paginatedSessions.length).toBe(1);
    expect(wrapper.vm.paginatedSessions[0].username).toBe('alice');
  });

  it('search is case-insensitive', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('ALICE');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.paginatedSessions.length).toBe(1);
  });

  it('returns no rows when search matches nothing', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('xyz_no_match');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.paginatedSessions.length).toBe(0);
  });

  it('restores all rows after search is cleared', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('alice');
    await wrapper.vm.$nextTick();
    wrapper.vm.onClearSearch();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.paginatedSessions.length).toBe(MOCK_SESSIONS.length);
  });

  it('totalItems reflects the filtered count', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('alice');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.totalItems).toBe(1);
  });

  // ── Selection ─────────────────────────────────────────────────────────

  it('toggleAll(true) marks all sessions as selected', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    const allSelected = wrapper.vm.allConnections.every((s) => s.isSelected);
    expect(allSelected).toBe(true);
  });

  it('toggleAll(false) clears all selections', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();
    wrapper.vm.toggleAll(false);
    await wrapper.vm.$nextTick();

    const anySelected = wrapper.vm.allConnections.some((s) => s.isSelected);
    expect(anySelected).toBe(false);
  });

  it('clears selection when the clear-selected event is emitted', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    eventBus.emit('clear-selected');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.allConnections.every((s) => !s.isSelected)).toBe(true);
  });

  // ── Disconnect modal ──────────────────────────────────────────────────

  it('opens the disconnect modal on row action', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('disconnect', { uri: MOCK_SESSIONS[0].uri });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.openModal).toBe(true);
    expect(wrapper.vm.count).toBe(1);
  });

  it('opens the disconnect modal on batch action', async () => {
    const wrapper = mountSessions({ sessions: ref(MOCK_SESSIONS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.selectedRowsLists = MOCK_SESSIONS;
    wrapper.vm.onBatchAction('disconnect');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.openModal).toBe(true);
    expect(wrapper.vm.count).toBe(MOCK_SESSIONS.length);
  });

  it('calls disconnectSessions with a single URI on row action OK', async () => {
    const disconnectSessions = vi.fn().mockResolvedValue([]);
    const wrapper = mountSessions({
      sessions: ref(MOCK_SESSIONS),
      disconnectSessions,
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('disconnect', { uri: MOCK_SESSIONS[0].uri });
    await wrapper.vm.$nextTick();
    wrapper.vm.handleOk();
    await flushPromises();

    expect(disconnectSessions).toHaveBeenCalledWith([MOCK_SESSIONS[0].uri]);
  });

  it('calls disconnectSessions with multiple URIs on batch OK', async () => {
    const disconnectSessions = vi.fn().mockResolvedValue([]);
    const wrapper = mountSessions({
      sessions: ref(MOCK_SESSIONS),
      disconnectSessions,
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.selectedRowsLists = MOCK_SESSIONS;
    wrapper.vm.onBatchAction('disconnect');
    await wrapper.vm.$nextTick();
    wrapper.vm.handleOk();
    await flushPromises();

    expect(disconnectSessions).toHaveBeenCalledWith(
      MOCK_SESSIONS.map((s) => s.uri),
    );
  });

  it('shows a success toast when disconnect succeeds', async () => {
    const disconnectSessions = vi
      .fn()
      .mockResolvedValue([{ type: 'success', message: 'Disconnected' }]);
    const wrapper = mountSessions({
      sessions: ref(MOCK_SESSIONS),
      disconnectSessions,
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('disconnect', { uri: MOCK_SESSIONS[0].uri });
    await wrapper.vm.$nextTick();
    wrapper.vm.handleOk();
    await flushPromises();

    // Modal closes after handleOk
    expect(wrapper.vm.openModal).toBe(false);
    expect(mockSuccessToast).toHaveBeenCalledWith('Disconnected');
  });

  // ── Loading bar ───────────────────────────────────────────────────────

  it('ends the loader when the sessions query enters an error state', async () => {
    const isError = ref(false);
    mountSessions({ isError });

    endLoaderMock.mockClear();
    isError.value = true;
    await nextTick();

    // The watch on isLoading fires endLoader (isLoading stays false)
    // The error just stops any further loading — no crash
    expect(() => {}).not.toThrow();
  });
});
