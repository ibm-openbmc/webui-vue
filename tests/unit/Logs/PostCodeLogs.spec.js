import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import PostCodeLogs from '@/views/Logs/PostCodeLogs/PostCodeLogs.vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return { ...actual, onBeforeRouteLeave: vi.fn() };
});

const startLoaderMock = vi.fn();
const endLoaderMock = vi.fn();
const hideLoaderMock = vi.fn();

vi.mock('@/components/Composables/useLoadingBarComposable', () => ({
  default: () => ({
    startLoader: startLoaderMock,
    endLoader: endLoaderMock,
    hideLoader: hideLoaderMock,
  }),
}));

vi.mock('@/api/composables/usePostCodeLogs', () => ({
  usePostCodeLogs: vi.fn(),
}));

// buildUrlNewTab is used only in openConsoleWindow; stub it out
vi.mock('@/utilities/url', () => ({
  buildUrlNewTab: vi.fn((path) => `http://localhost${path}`),
}));

import { usePostCodeLogs } from '@/api/composables/usePostCodeLogs';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeLog = (overrides = {}) => ({
  date: new Date('2024-01-01T00:00:00Z'),
  bootCount: '5',
  timeStampOffset: '0x0000000000000001',
  postCode: 'D1',
  uri: '/redfish/v1/Systems/system/LogServices/PostCodes/Entries/1',
  toggleDetails: false,
  rowSelected: false,
  ...overrides,
});

const MOCK_LOGS = [
  makeLog({
    bootCount: '5',
    postCode: 'D1',
    timeStampOffset: '0x01',
    uri: '/pc/1',
  }),
  makeLog({
    bootCount: '5',
    postCode: 'D2',
    timeStampOffset: '0x02',
    uri: '/pc/2',
    date: new Date('2024-06-15T00:00:00Z'),
  }),
  makeLog({
    bootCount: '4',
    postCode: 'E1',
    timeStampOffset: '0x03',
    uri: '/pc/3',
    date: new Date('2023-01-01T00:00:00Z'),
  }),
];

const makeHook = (overrides = {}) => ({
  allLogs: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  fetchSrcDetails: vi.fn().mockResolvedValue('D1 AABBCCDD EEFF0011'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountPostCodeLogs(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  usePostCodeLogs.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(PostCodeLogs, {
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

describe('PostCodeLogs.vue', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountPostCodeLogs();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the post-code logs table', () => {
    const wrapper = mountPostCodeLogs();
    expect(wrapper.find('#table-post-code-logs').exists()).toBe(true);
  });

  it('renders pagination controls', () => {
    const wrapper = mountPostCodeLogs();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  it('renders the "view codes in realtime" button', () => {
    const wrapper = mountPostCodeLogs();
    expect(wrapper.text()).toContain('pagePostCodeLogs.viewCodesInRealtime');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('isBusy is true while loading', () => {
    const wrapper = mountPostCodeLogs({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when loading is done', () => {
    const wrapper = mountPostCodeLogs({ isLoading: ref(false) });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('calls startLoader when loading begins', async () => {
    mountPostCodeLogs({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when loading finishes', async () => {
    mountPostCodeLogs({ isLoading: ref(false), isFetching: ref(false) });
    await nextTick();
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  // ── allLogs / paginatedLogs ────────────────────────────────────────────────

  it('allLogs reflects postCodeLogsData from the composable', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.allLogs.length).toBe(MOCK_LOGS.length);
  });

  it('paginatedLogs shows all logs when no filters are active', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.paginatedLogs.length).toBe(MOCK_LOGS.length);
  });

  it('filteredLogs is empty when composable returns no logs', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref([]) });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  // ── Search filtering ───────────────────────────────────────────────────────

  it('filters by search term against postCode', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInputVal = 'D2';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
    expect(wrapper.vm.filteredLogs[0].postCode).toBe('D2');
  });

  it('search is case-insensitive', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInputVal = 'd2';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(1);
  });

  it('returns no rows when search matches nothing', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInputVal = 'xyz_no_match';
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(0);
  });

  it('onChangeSearchInput updates searchFilterInputVal', async () => {
    const wrapper = mountPostCodeLogs();
    wrapper.vm.onChangeSearchInput('E1');
    await nextTick();
    expect(wrapper.vm.searchFilterInputVal).toBe('E1');
  });

  it('onClearSearchInput clears the search term and restores all rows', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.onChangeSearchInput('D1');
    await nextTick();
    wrapper.vm.onClearSearchInput();
    await nextTick();
    expect(wrapper.vm.searchFilterInputVal).toBe('');
    expect(wrapper.vm.filteredLogs.length).toBe(MOCK_LOGS.length);
  });

  // ── filteredRows / pagination ──────────────────────────────────────────────

  it('filteredRows equals total logs when no filter is active', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(MOCK_LOGS.length);
  });

  it('filteredRows updates after search', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.searchFilterInputVal = 'E1';
    await nextTick();
    expect(wrapper.vm.filteredRows).toBe(1);
  });

  it('currentPageNo resets to 1 when search changes', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.currentPageNo = 2;
    await nextTick();
    wrapper.vm.searchFilterInputVal = 'D1';
    await nextTick();
    expect(wrapper.vm.currentPageNo).toBe(1);
  });

  // ── Date filter ────────────────────────────────────────────────────────────

  it('onChangeDateTimeFilter sets filterStartDate and filterEndDate', async () => {
    const wrapper = mountPostCodeLogs();
    const from = new Date('2024-01-01');
    const to = new Date('2024-12-31');
    wrapper.vm.onChangeDateTimeFilter({ fromDate: from, toDate: to });
    await nextTick();
    expect(wrapper.vm.filterStartDate).toEqual(from);
    expect(wrapper.vm.filterEndDate).toEqual(to);
  });

  it('filters logs within a date range', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    // MOCK_LOGS[0] = 2024-01-01, MOCK_LOGS[1] = 2024-06-15, MOCK_LOGS[2] = 2023-01-01
    wrapper.vm.onChangeDateTimeFilter({
      fromDate: new Date('2024-01-01'),
      toDate: new Date('2024-12-31'),
    });
    await nextTick();
    expect(wrapper.vm.filteredLogs.length).toBe(2);
  });

  // ── perPageVal / pageSize sync ─────────────────────────────────────────────

  it('pageSize updates when perPageVal changes', async () => {
    const wrapper = mountPostCodeLogs({ allLogs: ref(MOCK_LOGS) });
    await nextTick();
    wrapper.vm.perPageVal = 5;
    await nextTick();
    expect(wrapper.vm.pagination.pageSize.value).toBe(5);
  });

  // ── exportFileNameByDate ───────────────────────────────────────────────────

  it('exportFileNameByDate returns a string with a date segment', () => {
    const wrapper = mountPostCodeLogs();
    const name = wrapper.vm.exportFileNameByDate('download');
    expect(typeof name).toBe('string');
    expect(name).toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});
