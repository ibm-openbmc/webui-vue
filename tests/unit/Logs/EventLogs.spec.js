import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import EventLogs from '@/views/Logs/EventLogs/EventLogs.vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

// EventLogs uses beforeRouteLeave as a component option (Options API), so no
// vue-router composable mock is needed — only stub the loading bar.

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

vi.mock('@/api/composables/useEventLogs', () => ({
  useEventLogs: vi.fn(),
}));

import { useEventLogs } from '@/api/composables/useEventLogs';
import stores from '@/store';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLog = (overrides = {}) => ({
  id: '1',
  eventId: 'EVT001',
  severity: 'OK',
  date: new Date('2024-01-01T00:00:00Z'),
  type: 'Event',
  description: 'Test event log',
  name: 'System Event Log Entry',
  modifiedDate: new Date('2024-01-01T01:00:00Z'),
  resolution: 'No action required.\n',
  uri: '/redfish/v1/Systems/system/LogServices/EventLog/Entries/1',
  filterByStatus: 'Unresolved',
  status: false,
  actions: [{ value: 'download' }, { value: 'delete' }],
  toggleDetails: false,
  rowSelected: false,
  ...overrides,
});

const MOCK_LOGS = [
  makeLog({
    id: '1',
    severity: 'OK',
    description: 'All good',
    status: false,
    filterByStatus: 'Unresolved',
  }),
  makeLog({
    id: '2',
    severity: 'Warning',
    description: 'Watch out',
    status: true,
    filterByStatus: 'Resolved',
    uri: '/redfish/v1/Systems/system/LogServices/EventLog/Entries/2',
  }),
  makeLog({
    id: '3',
    severity: 'Critical',
    description: 'Bad event',
    status: false,
    filterByStatus: 'Unresolved',
    uri: '/redfish/v1/Systems/system/LogServices/EventLog/Entries/3',
  }),
];

const makeHook = (overrides = {}) => ({
  allLogs: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  deleteAllLogs: vi.fn().mockResolvedValue(undefined),
  deleteEventLogs: vi.fn().mockResolvedValue([]),
  resolveEventLogs: vi.fn().mockResolvedValue([]),
  unresolveEventLogs: vi.fn().mockResolvedValue([]),
  updateEventLogStatus: vi.fn().mockResolvedValue(undefined),
  downloadLogData: vi.fn().mockResolvedValue('peldata'),
  refetchAll: vi.fn(),
  refetchCELogs: vi.fn(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountEventLogs(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useEventLogs.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);
  const globalStore = stores.GlobalStore();
  globalStore.getCurrentUser = vi.fn();
  globalStore.currentUserGetter = {};
  globalStore.isServiceUser = false;

  return mount(EventLogs, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
        $filters: { formatDate: () => '', formatTime: () => '' },
      },
      // TableDateFilter uses v-calendar which requires ResizeObserver (not in jsdom)
      stubs: { TableDateFilter: true },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EventLogs.vue', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountEventLogs();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the event logs table', () => {
    const wrapper = mountEventLogs();
    expect(wrapper.find('#table-event-logs').exists()).toBe(true);
  });

  it('renders the search input', () => {
    const wrapper = mountEventLogs();
    expect(
      wrapper.find('[data-test-id="eventLogs-input-searchLogs"]').exists(),
    ).toBe(true);
  });

  it('renders pagination controls', () => {
    const wrapper = mountEventLogs();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  it('renders the delete-all button', () => {
    const wrapper = mountEventLogs();
    expect(wrapper.text()).toContain('global.action.deleteAll');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('isBusy is true while loading', () => {
    const wrapper = mountEventLogs({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when not loading', () => {
    const wrapper = mountEventLogs({ isLoading: ref(false) });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('calls startLoader when loading begins', async () => {
    mountEventLogs({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when data is already fresh (no fetch needed)', async () => {
    mountEventLogs({ isLoading: ref(false), isFetching: ref(false) });
    await nextTick();
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
    expect(startLoaderMock).not.toHaveBeenCalled();
  });

  // ── filteredLogs / paginatedLogs ───────────────────────────────────────────

  it('paginatedLogs shows all logs when no filters are active', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.paginatedLogs.length).toBe(MOCK_LOGS.length);
  });

  it('filteredLogs is empty when no logs are returned', async () => {
    const wrapper = mountEventLogs({ allLogs: ref([]) });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  it('filters by search term against description', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilter = 'Bad event';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
    expect(wrapper.vm.filteredLogs[0].id).toBe('3');
  });

  it('search is case-insensitive', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilter = 'bad event';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
  });

  it('returns no rows when search matches nothing', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilter = 'xyz_no_match';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  it('restores all rows after search is cleared', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilter = 'Critical';
    await nextTick();
    wrapper.vm.searchFilter = '';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(MOCK_LOGS.length);
  });

  // ── filteredRows / pagination ──────────────────────────────────────────────

  it('filteredRows equals total logs when no filter is active', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(MOCK_LOGS.length);
  });

  it('filteredRows updates after search', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilter = 'Watch out';
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(1);
  });

  it('currentPage resets to 1 when search changes', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.currentPage = 2;
    await nextTick();
    wrapper.vm.searchFilter = 'Critical';
    await nextTick();
    expect(wrapper.vm.currentPage).toBe(1);
  });

  // ── activeFilters ──────────────────────────────────────────────────────────

  it('onFilterChange applies active filters', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'severity', values: ['Critical'] }],
    });
    await nextTick();
    expect(
      wrapper.vm.filteredLogs.every((l) => l.severity === 'Critical'),
    ).toBe(true);
  });

  it('clearing activeFilters restores all rows', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'severity', values: ['OK'] }],
    });
    await nextTick();
    wrapper.vm.onFilterChange({ activeFilters: [] });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(MOCK_LOGS.length);
  });

  // ── deleteAllLogs / handleOk ───────────────────────────────────────────────

  it('deleteAllLogs opens the modal', async () => {
    const wrapper = mountEventLogs();
    wrapper.vm.deleteAllLogs();
    await nextTick();
    expect(wrapper.vm.openModal).toBe(true);
    expect(wrapper.vm.deleteType).toBe('all');
  });

  it('handleOk("all") calls deleteAllLogsApi', async () => {
    const deleteAllLogs = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountEventLogs({ deleteAllLogs, allLogs: ref(MOCK_LOGS) });
    await nextTick();
    await wrapper.vm.handleOk('all');
    expect(deleteAllLogs).toHaveBeenCalledTimes(1);
  });

  // ── resolveLogs / unresolveLogs ────────────────────────────────────────────

  it('resolveLogs calls resolveEventLogsApi with selected rows', async () => {
    const resolveEventLogs = vi.fn().mockResolvedValue([]);
    const wrapper = mountEventLogs({
      resolveEventLogs,
      allLogs: ref(MOCK_LOGS),
    });
    wrapper.vm.selectedRows = [MOCK_LOGS[0]];
    await nextTick();
    await wrapper.vm.resolveLogs();
    expect(resolveEventLogs).toHaveBeenCalledTimes(1);
    expect(resolveEventLogs.mock.calls[0][0].logs).toEqual([MOCK_LOGS[0]]);
  });

  it('unresolveLogs calls unresolveEventLogsApi with selected rows', async () => {
    const unresolveEventLogs = vi.fn().mockResolvedValue([]);
    const wrapper = mountEventLogs({
      unresolveEventLogs,
      allLogs: ref(MOCK_LOGS),
    });
    wrapper.vm.selectedRows = [MOCK_LOGS[1]];
    await nextTick();
    await wrapper.vm.unresolveLogs();
    expect(unresolveEventLogs).toHaveBeenCalledTimes(1);
  });

  // ── resolutionValue ────────────────────────────────────────────────────────

  it('resolutionValue splits resolution string by newline', () => {
    const wrapper = mountEventLogs();
    const result = wrapper.vm.resolutionValue({
      resolution: 'Step 1.\nStep 2.\n',
    });
    expect(result).toEqual(['Step 1.', 'Step 2.']);
  });

  it('resolutionValue returns [""] when resolution is absent', () => {
    const wrapper = mountEventLogs();
    expect(wrapper.vm.resolutionValue({})).toEqual(['']);
  });

  // ── onBatchAction ──────────────────────────────────────────────────────────

  it('onBatchAction("delete") sets uris and opens modal', async () => {
    const wrapper = mountEventLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.selectedRows = [MOCK_LOGS[0], MOCK_LOGS[1]];
    wrapper.vm.onBatchAction('delete');
    await nextTick();
    expect(wrapper.vm.openModal).toBe(true);
    expect(wrapper.vm.uris).toEqual([MOCK_LOGS[0].uri, MOCK_LOGS[1].uri]);
  });
});
