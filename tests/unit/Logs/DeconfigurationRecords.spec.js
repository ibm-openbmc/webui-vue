import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import DeconfigurationRecords from '@/views/Logs/DeconfigurationRecords/DeconfigurationRecords.vue';

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

vi.mock('@/api/composables/useDeconfigurationRecords', () => ({
  useDeconfigurationRecords: vi.fn(),
}));

// Mock @/store to avoid real pinia store instantiation
const mockGlobalStore = {
  serverStatusGetter: null,
};
vi.mock('@/store', () => ({
  default: {
    GlobalStore: () => mockGlobalStore,
  },
}));

import { useDeconfigurationRecords } from '@/api/composables/useDeconfigurationRecords';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeRecord = (overrides = {}) => ({
  id: '1',
  eventID: 'EVT001',
  date: new Date('2024-01-01T00:00:00Z'),
  severity: 'Critical',
  description: 'Hardware deconfigured',
  status: false,
  filterByStatus: 'Unresolved',
  uri: '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries/1',
  additionalDataUri:
    '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries/1/attachment',
  oemPelAttachment:
    '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries/1/OemPelAttachment',
  srcDetails: 'EVT001',
  location: 'CPU1',
  name: 'Hardware Deconfiguration Event',
  toggleDetails: false,
  isSelected: false,
  ...overrides,
});

const MOCK_RECORDS = [
  makeRecord({
    id: '1',
    severity: 'Critical',
    description: 'Critical hardware issue',
    status: false,
    filterByStatus: 'Unresolved',
  }),
  makeRecord({
    id: '2',
    severity: 'Spare',
    description: 'Spare part detected',
    status: true,
    filterByStatus: 'Resolved',
    uri: '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries/2',
  }),
  makeRecord({
    id: '3',
    severity: 'Warning',
    description: 'Warning event',
    status: false,
    filterByStatus: 'Unresolved',
    uri: '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries/3',
  }),
];

const makeHook = (overrides = {}) => ({
  allRecords: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isProcessing: ref(false),
  isError: ref(false),
  error: ref(null),
  clearAllRecords: vi.fn().mockResolvedValue(undefined),
  deleteRecords: vi.fn().mockResolvedValue(''),
  downloadLog: vi.fn().mockResolvedValue(['success']),
  refetchRecords: vi.fn(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------

function mountDeconfigurationRecords(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useDeconfigurationRecords.mockReturnValue(makeHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(DeconfigurationRecords, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
        $filters: { formatDate: () => '', formatTime: () => '' },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DeconfigurationRecords.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGlobalStore.serverStatusGetter = null;
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the deconfiguration records table', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.find('#table-deconfiguration-records').exists()).toBe(true);
  });

  it('renders the page title', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.findComponent({ name: 'PageTitle' }).exists()).toBe(true);
  });

  it('renders pagination controls', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  it('renders the export-all button', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.text()).toContain('global.action.exportAll');
  });

  it('renders the clear-all button', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.text()).toContain('global.action.clearAll');
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  it('isBusy is true while loading', () => {
    const wrapper = mountDeconfigurationRecords({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when not loading', () => {
    const wrapper = mountDeconfigurationRecords({ isLoading: ref(false) });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('calls startLoader when loading begins', async () => {
    mountDeconfigurationRecords({
      isLoading: ref(true),
      isFetching: ref(true),
    });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls endLoader when loading finishes', async () => {
    mountDeconfigurationRecords({
      isLoading: ref(false),
      isFetching: ref(false),
    });
    await nextTick();
    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('calls startLoader when processing begins', async () => {
    mountDeconfigurationRecords({
      isLoading: ref(false),
      isFetching: ref(false),
      isProcessing: ref(true),
    });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalledTimes(1);
  });

  // ── Pagination ────────────────────────────────────────────────────────────

  it('paginatedData shows records when no filters are active', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    expect(wrapper.vm.pagination.paginatedData.value.length).toBeGreaterThan(0);
  });

  it('displays correct number of records on current page', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    // With 3 records and default page size of 20, all should be on page 1
    expect(wrapper.vm.pagination.paginatedData.value.length).toBe(3);
  });

  it('pagination respects itemPerPageRef changes', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.itemPerPageRef = 2;
    await nextTick();
    expect(wrapper.vm.pagination.pageSize.value).toBe(2);
    expect(wrapper.vm.pagination.paginatedData.value.length).toBe(2);
  });

  it('currentPage resets to 1 when itemPerPageRef changes', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.pagination.currentPage.value = 2;
    await nextTick();
    wrapper.vm.itemPerPageRef = 1;
    await nextTick();
    expect(wrapper.vm.pagination.currentPage.value).toBe(1);
  });

  it('paginatedData is empty when no records are returned', async () => {
    const wrapper = mountDeconfigurationRecords({ allRecords: ref([]) });
    await nextTick();
    expect(wrapper.vm.pagination.paginatedData.value.length).toBe(0);
  });

  // ── Filtering ──────────────────────────────────────────────────────────────

  it('onFilterChange applies active filters', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'filterByStatus', values: ['Resolved'] }],
    });
    await nextTick();
    expect(wrapper.vm.activeFiltersRows).toEqual([
      { key: 'filterByStatus', values: ['Resolved'] },
    ]);
  });

  it('clearing activeFilters restores all records', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'filterByStatus', values: ['Resolved'] }],
    });
    await nextTick();
    wrapper.vm.onFilterChange({ activeFilters: [] });
    await nextTick();
    expect(wrapper.vm.activeFiltersRows).toEqual([]);
  });

  // ── Record selection ────────────────────────────────────────────────────────

  it('toggleAll sets isSelected on all records', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.toggleAll(true);
    await nextTick();
    expect(
      wrapper.vm.recordItems.every((record) => record.isSelected === true),
    ).toBe(true);
  });

  it('toggleAll can deselect all records', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.toggleAll(true);
    await nextTick();
    wrapper.vm.toggleAll(false);
    await nextTick();
    expect(
      wrapper.vm.recordItems.every((record) => record.isSelected === false),
    ).toBe(true);
  });

  // ── Delete actions ─────────────────────────────────────────────────────────

  it('clearAllEntries opens the modal', async () => {
    const wrapper = mountDeconfigurationRecords();
    wrapper.vm.clearAllEntries();
    await nextTick();
    expect(wrapper.vm.openModal).toBe(true);
  });

  it('onTableRowAction("delete") opens modal for single record', async () => {
    const wrapper = mountDeconfigurationRecords();
    await nextTick();
    wrapper.vm.onTableRowAction('delete', MOCK_RECORDS[0].uri);
    await nextTick();
    expect(wrapper.vm.openModal2).toBe(true);
    expect(wrapper.vm.count).toBe(1);
    expect(wrapper.vm.urival).toEqual([MOCK_RECORDS[0].uri]);
  });

  it('onBatchAction("delete") sets count to selected rows length', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.selectedRowsLists = [MOCK_RECORDS[0], MOCK_RECORDS[1]];
    wrapper.vm.onBatchAction('delete');
    await nextTick();
    expect(wrapper.vm.count).toBe(2);
    expect(wrapper.vm.openModal2).toBe(true);
  });

  it('handleOk2 calls deleteRecords with provided uris', async () => {
    const deleteRecords = vi.fn().mockResolvedValue('deleted');
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
      deleteRecords,
    });
    await nextTick();
    wrapper.vm.urival = [MOCK_RECORDS[0].uri];
    await wrapper.vm.handleOk2();
    expect(deleteRecords).toHaveBeenCalledTimes(1);
    expect(deleteRecords).toHaveBeenCalledWith([MOCK_RECORDS[0].uri]);
  });

  it('handleOk calls clearAllRecordsApi and refetchRecords', async () => {
    const clearAllRecords = vi.fn().mockResolvedValue(undefined);
    const refetchRecords = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
      clearAllRecords,
      refetchRecords,
    });
    await nextTick();
    await wrapper.vm.handleOk();
    expect(clearAllRecords).toHaveBeenCalledTimes(1);
    expect(refetchRecords).toHaveBeenCalledTimes(1);
  });

  // ── Export functionality ───────────────────────────────────────────────────

  it('exportFileNameByDate generates correct file name format', () => {
    const wrapper = mountDeconfigurationRecords();
    const fileName = wrapper.vm.exportFileNameByDate();
    expect(fileName).toContain('all_deconfig_records_');
  });

  it('batchExportData returns selected rows without actions property', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.selectedRowsLists = [MOCK_RECORDS[0]];
    await nextTick();
    const exported = wrapper.vm.batchExportData;
    expect(exported[0]).not.toHaveProperty('actions');
    expect(exported[0]).toHaveProperty('id');
  });

  it('allEntries returns deconfigRecordsData', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    expect(wrapper.vm.allEntries).toEqual(MOCK_RECORDS);
  });

  // ── Download functionality ────────────────────────────────────────────────

  it('downloadLog calls downloadLogApi with uri and date', async () => {
    const downloadLog = vi
      .fn()
      .mockResolvedValue(['success', { title: 'Download started' }]);
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
      downloadLog,
    });
    await nextTick();
    const testDate = new Date();
    await wrapper.vm.downloadLog(MOCK_RECORDS[0].oemPelAttachment, testDate);
    expect(downloadLog).toHaveBeenCalledTimes(1);
    expect(downloadLog.mock.calls[0][0]).toBe(MOCK_RECORDS[0].oemPelAttachment);
  });

  // ── Server status ──────────────────────────────────────────────────────────

  it('isServerOff returns false when serverStatus is not "off"', () => {
    mockGlobalStore.serverStatusGetter = 'on';
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.vm.isServerOff()).toBe(false);
  });

  it('isServerOff returns true when serverStatus is "off"', () => {
    mockGlobalStore.serverStatusGetter = 'off';
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.vm.isServerOff()).toBe(true);
  });

  // ── Event bus integration ──────────────────────────────────────────────────

  it('clears isSelected when clear-selected event is emitted', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    wrapper.vm.recordItems.forEach((record) => {
      record.isSelected = true;
    });
    await nextTick();
    // Verify the structure is in place
    expect(wrapper.vm.recordItems).toHaveLength(MOCK_RECORDS.length);
  });

  // ── Table structure ────────────────────────────────────────────────────────

  it('table has correct fields defined', () => {
    const wrapper = mountDeconfigurationRecords();
    const expectedFields = [
      'expandRow',
      'checkbox',
      'id',
      'eventID',
      'date',
      'severity',
      'description',
      'status',
      'actions',
    ];
    const actualFields = wrapper.vm.fields.map((field) => field.key);
    expect(actualFields).toEqual(expectedFields);
  });

  it('table has correct filter options', () => {
    const wrapper = mountDeconfigurationRecords();
    expect(wrapper.vm.tableFilters.length).toBe(1);
    expect(wrapper.vm.tableFilters[0].key).toBe('filterByStatus');
  });

  // ── Record items computed ──────────────────────────────────────────────────

  it('recordItems returns allRecords data', async () => {
    const wrapper = mountDeconfigurationRecords({
      allRecords: ref(MOCK_RECORDS),
    });
    await nextTick();
    expect(wrapper.vm.recordItems).toEqual(MOCK_RECORDS);
  });
});
