import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import AuditLogs from '@/views/Logs/AuditLogs/AuditLogs.vue';

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

vi.mock('@/api/composables/useAuditLogs', () => ({
  useAuditLogs: vi.fn(),
}));

import { useAuditLogs } from '@/api/composables/useAuditLogs';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLog = (overrides = {}) => ({
  auditId: 'AUDIT-001',
  operation: 'READ',
  message: 'ReadAllValues of resource /redfish/v1',
  account: 'admin',
  date: new Date('2024-01-01T00:00:00Z'),
  addr: '192.168.1.1',
  res: 'OK',
  uri: '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/1',
  additionalDataUri:
    '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/1/OemAdditionalData',
  toggleDetails: false,
  ...overrides,
});

const MOCK_LOGS = [
  makeLog({
    auditId: 'A1',
    operation: 'READ',
    account: 'admin',
    message: 'Read resource',
    addr: '10.0.0.1',
  }),
  makeLog({
    auditId: 'A2',
    operation: 'WRITE',
    account: 'user1',
    message: 'Write resource',
    addr: '10.0.0.2',
    uri: '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/2',
  }),
  makeLog({
    auditId: 'A3',
    operation: 'DELETE',
    account: 'admin',
    message: 'Delete resource',
    addr: '10.0.0.1',
    uri: '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/3',
  }),
];

const makeHook = (overrides = {}) => ({
  auditLogs: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  refetch: vi.fn().mockResolvedValue(undefined),
  downloadAuditLog: vi.fn().mockResolvedValue('base64data=='),
  isDownloading: ref(false),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountAuditLogs(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useAuditLogs.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(AuditLogs, {
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

describe('AuditLogs.vue', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountAuditLogs();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the audit logs table', () => {
    const wrapper = mountAuditLogs();
    expect(wrapper.find('#table-audit-logs').exists()).toBe(true);
  });

  it('renders the search input', () => {
    const wrapper = mountAuditLogs();
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('renders pagination controls', () => {
    const wrapper = mountAuditLogs();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  it('renders the download-all button', () => {
    const wrapper = mountAuditLogs();
    expect(wrapper.text()).toContain('global.action.downloadAll');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('isBusy is true while loading', () => {
    const wrapper = mountAuditLogs({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when not loading', () => {
    const wrapper = mountAuditLogs({ isLoading: ref(false) });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('calls startLoader when loading begins', async () => {
    mountAuditLogs({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when loading finishes', async () => {
    mountAuditLogs({ isLoading: ref(false), isFetching: ref(false) });
    await nextTick();
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  // ── allLogs / paginatedLogs ────────────────────────────────────────────────

  it('allLogs reflects auditLogs from the composable', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.allLogs.length).toBe(MOCK_LOGS.length);
  });

  it('paginatedLogs shows all logs when no filters are active', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.paginatedLogs.length).toBe(MOCK_LOGS.length);
  });

  it('filteredLogs is empty when no logs are returned', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref([]) });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  // ── Search filtering ───────────────────────────────────────────────────────

  it('filters logs by search term against the message field', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInput = 'Delete resource';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
    expect(wrapper.vm.filteredLogs[0].operation).toBe('DELETE');
  });

  it('search is case-insensitive', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInput = 'delete resource';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
  });

  it('returns no rows when search matches nothing', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInput = 'xyz_no_match';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  it('onChangeSearch updates searchFilterInput', async () => {
    const wrapper = mountAuditLogs();
    wrapper.vm.onChangeSearch('admin');
    await nextTick();
    expect(wrapper.vm.searchFilterInput).toBe('admin');
  });

  it('onClearSearch clears the search term', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.onChangeSearch('READ');
    await nextTick();
    wrapper.vm.onClearSearch();
    await nextTick();
    expect(wrapper.vm.searchFilterInput).toBe('');
    expect(wrapper.vm.filteredLogs.length).toBe(MOCK_LOGS.length);
  });

  // ── filteredRows / pagination ──────────────────────────────────────────────

  it('filteredRows equals total logs when no filter is active', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(MOCK_LOGS.length);
  });

  it('filteredRows updates after search', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInput = 'Write resource';
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(1);
  });

  it('currentPageNo resets to 1 when search changes', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.currentPageNo = 2;
    await nextTick();
    wrapper.vm.searchFilterInput = 'DELETE';
    await nextTick();
    expect(wrapper.vm.currentPageNo).toBe(1);
  });

  // ── Date filter ────────────────────────────────────────────────────────────

  it('onChangeDateTimeFilter sets filterStartDate and filterEndDate', async () => {
    const wrapper = mountAuditLogs();
    const from = new Date('2024-01-01');
    const to = new Date('2024-01-31');
    wrapper.vm.onChangeDateTimeFilter({ fromDate: from, toDate: to });
    await nextTick();
    expect(wrapper.vm.filterStartDate).toEqual(from);
    expect(wrapper.vm.filterEndDate).toEqual(to);
  });

  it('filters by date range', async () => {
    const inRange = makeLog({
      date: new Date('2024-06-15T12:00:00Z'),
      uri: '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/r1',
    });
    const outOfRange = makeLog({
      date: new Date('2023-01-01T12:00:00Z'),
      uri: '/redfish/v1/Systems/system/LogServices/AuditLog/Entries/r2',
    });
    const wrapper = mountAuditLogs({ auditLogs: ref([inRange, outOfRange]) });
    await nextTick();
    wrapper.vm.onChangeDateTimeFilter({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-12-31'),
    });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
  });

  // ── itemPerPage / pageSize sync ────────────────────────────────────────────

  it('pageSize updates when itemPerPage changes', async () => {
    const wrapper = mountAuditLogs({ auditLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.itemPerPage = 5;
    await nextTick();
    expect(wrapper.vm.pagination.pageSize.value).toBe(5);
  });
});
