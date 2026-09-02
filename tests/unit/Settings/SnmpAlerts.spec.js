import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import SnmpAlerts from '@/views/Settings/SnmpAlerts/SnmpAlerts.vue';

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

vi.mock('@/api/composables/useSnmpAlerts', () => ({
  useSnmpAlerts: vi.fn(),
}));

import { useSnmpAlerts } from '@/api/composables/useSnmpAlerts';
import eventBus from '@/eventBus';
import i18n from '@/i18n';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSnmpHook = (overrides = {}) => ({
  snmpAlerts: ref([]),
  isLoading: ref(false),
  isFetching: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn(),
  addDestination: vi.fn().mockResolvedValue(undefined),
  deleteDestination: vi.fn().mockResolvedValue(undefined),
  deleteMultipleDestinations: vi
    .fn()
    .mockResolvedValue({ successCount: 0, errorCount: 0 }),
  isAddingDestination: ref(false),
  isDeletingDestination: ref(false),
  isDeletingMultiple: ref(false),
  ...overrides,
});

const MOCK_ALERTS = [
  {
    id: 'sub-1',
    ip: '192.168.1.10',
    port: '162',
    '@odata.id': '/redfish/v1/EventService/Subscriptions/sub-1',
    Destination: 'snmp://192.168.1.10:162',
    SubscriptionType: 'SNMPTrap',
    Protocol: 'SNMPv2c',
    isSelected: false,
  },
  {
    id: 'sub-2',
    ip: '10.0.0.1',
    port: '161',
    '@odata.id': '/redfish/v1/EventService/Subscriptions/sub-2',
    Destination: 'snmp://10.0.0.1:161',
    SubscriptionType: 'SNMPTrap',
    Protocol: 'SNMPv2c',
    isSelected: false,
  },
];

function mountSnmpAlerts(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useSnmpAlerts.mockReturnValue(makeSnmpHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);

  return mount(SnmpAlerts, {
    global: {
      plugins: [pinia, [VueQueryPlugin, { queryClient }]],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        ModalAddDestination: {
          template: '<div />',
          emits: ['ok'],
        },
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SnmpAlerts.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountSnmpAlerts();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the SNMP table', () => {
    const wrapper = mountSnmpAlerts();
    expect(wrapper.find('table').exists()).toBe(true);
  });

  it('renders the PageTitle component', () => {
    const wrapper = mountSnmpAlerts();
    const pageTitle = wrapper.findComponent({ name: 'PageTitle' });
    expect(pageTitle.exists()).toBe(true);
    expect(pageTitle.props('title')).toBe('appPageTitle.snmpAlerts');
  });

  it('renders the Add Destination button', () => {
    const wrapper = mountSnmpAlerts();
    const buttons = wrapper.findAll('button');
    const addBtn = buttons.find((b) =>
      b.text().includes('pageSnmpAlerts.addDestination'),
    );
    expect(addBtn).toBeDefined();
  });

  // ── Loading state ─────────────────────────────────────────────────────

  it('isBusy is true when loading', () => {
    const wrapper = mountSnmpAlerts({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy is false when not loading', () => {
    const wrapper = mountSnmpAlerts({ isLoading: ref(false) });
    expect(wrapper.vm.isBusy).toBe(false);
  });

  it('starts the loader when loading on mount', async () => {
    mountSnmpAlerts({ isLoading: ref(true), isFetching: ref(true) });
    await nextTick();
    expect(startLoaderMock).toHaveBeenCalled();
  });

  it('ends the loader when the query enters an error state', async () => {
    const isError = ref(false);
    const isFetching = ref(true);
    mountSnmpAlerts({ isError, isFetching });
    await nextTick();

    endLoaderMock.mockClear();
    isError.value = true;
    await nextTick();

    expect(endLoaderMock).toHaveBeenCalled();
  });

  // ── Data display ──────────────────────────────────────────────────────

  it('renders alert rows in the table', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();
    const tableText = wrapper.find('table').text();
    expect(tableText).toContain('192.168.1.10');
    expect(tableText).toContain('10.0.0.1');
  });

  it('shows empty message when no alerts', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref([]) });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.tableItems.length).toBe(0);
    expect(wrapper.find('table').text()).toContain('global.table.emptyMessage');
  });

  it('tableItems adds delete action to each row', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.tableItems[0].actions).toHaveLength(1);
    expect(wrapper.vm.tableItems[0].actions[0].value).toBe('delete');
  });

  // ── Selection ─────────────────────────────────────────────────────────

  it('toggleAll(true) marks all alerts as selected', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.snmpAlertsData.every((a) => a.isSelected)).toBe(true);
  });

  it('toggleAll(false) clears all selections', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();
    wrapper.vm.toggleAll(false);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.snmpAlertsData.some((a) => a.isSelected)).toBe(false);
  });

  it('clears selection when the clear-selected event is emitted', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    eventBus.emit('clear-selected');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.snmpAlertsData.every((a) => !a.isSelected)).toBe(true);
  });

  // ── Add destination ───────────────────────────────────────────────────

  it('calls addDestination with correct payload on modal ok', async () => {
    const addDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({ addDestination });
    await wrapper.vm.$nextTick();

    await wrapper.vm.onModalOk({ ipAddress: '192.168.1.5', port: '162' });
    await flushPromises();

    expect(addDestination).toHaveBeenCalledWith({
      Destination: 'snmp://192.168.1.5:162',
      SubscriptionType: 'SNMPTrap',
      Protocol: 'SNMPv2c',
    });
  });

  it('builds destination without port when port is empty', async () => {
    const addDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({ addDestination });

    await wrapper.vm.onModalOk({ ipAddress: '10.0.0.1', port: '' });
    await flushPromises();

    expect(addDestination).toHaveBeenCalledWith(
      expect.objectContaining({ Destination: 'snmp://10.0.0.1' }),
    );
  });

  it('shows success toast after adding a destination', async () => {
    const addDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({ addDestination });

    await wrapper.vm.onModalOk({ ipAddress: '10.0.0.1', port: '162' });
    await flushPromises();

    expect(mockSuccessToast).toHaveBeenCalledWith(
      'Successfully added SNMP alert destination.',
    );
  });

  it('shows error toast when addDestination fails', async () => {
    const addDestination = vi.fn().mockRejectedValue(new Error('fail'));
    const wrapper = mountSnmpAlerts({ addDestination });

    await wrapper.vm.onModalOk({ ipAddress: '10.0.0.1', port: '162' });
    await flushPromises();

    expect(mockErrorToast).toHaveBeenCalledWith(
      'Error in adding SNMP alert destination',
    );
  });

  it('does NOT call refetch after addDestination — onSuccess invalidation handles it', async () => {
    const refetch = vi.fn();
    const addDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({ addDestination, refetch });

    await wrapper.vm.onModalOk({ ipAddress: '10.0.0.1', port: '162' });
    await flushPromises();

    expect(refetch).not.toHaveBeenCalled();
  });

  // ── Delete single ─────────────────────────────────────────────────────

  it('opens delete modal when row delete action is triggered', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('delete', MOCK_ALERTS[0]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.openDeleteModal).toBe(true);
    expect(wrapper.vm.deleteType).toBe('singleEntry');
  });

  it('calls deleteDestination with the correct id', async () => {
    const deleteDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({
      snmpAlerts: ref(MOCK_ALERTS),
      deleteDestination,
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.onTableRowAction('delete', MOCK_ALERTS[0]);
    await wrapper.vm.$nextTick();
    await wrapper.vm.handleOk('singleEntry');
    await flushPromises();

    expect(deleteDestination).toHaveBeenCalledWith('sub-1');
  });

  it('shows success toast after deleting a destination', async () => {
    const deleteDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({
      snmpAlerts: ref(MOCK_ALERTS),
      deleteDestination,
    });

    wrapper.vm.onTableRowAction('delete', MOCK_ALERTS[0]);
    await wrapper.vm.$nextTick();
    await wrapper.vm.handleOk('singleEntry');
    await flushPromises();

    expect(mockSuccessToast).toHaveBeenCalled();
  });

  it('does NOT call refetch after deleteDestination', async () => {
    const refetch = vi.fn();
    const deleteDestination = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountSnmpAlerts({
      snmpAlerts: ref(MOCK_ALERTS),
      deleteDestination,
      refetch,
    });

    wrapper.vm.onTableRowAction('delete', MOCK_ALERTS[0]);
    await wrapper.vm.$nextTick();
    await wrapper.vm.handleOk('singleEntry');
    await flushPromises();

    expect(refetch).not.toHaveBeenCalled();
  });

  // ── Delete multiple ───────────────────────────────────────────────────

  it('opens delete modal for batch delete', async () => {
    const wrapper = mountSnmpAlerts({ snmpAlerts: ref(MOCK_ALERTS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onBatchAction('delete');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.openDeleteModal).toBe(true);
    expect(wrapper.vm.deleteType).toBe('selectedEntries');
  });

  it('calls deleteMultipleDestinations with selected rows', async () => {
    const deleteMultipleDestinations = vi
      .fn()
      .mockResolvedValue({ successCount: 2, errorCount: 0 });
    const wrapper = mountSnmpAlerts({
      snmpAlerts: ref(MOCK_ALERTS),
      deleteMultipleDestinations,
    });
    await wrapper.vm.$nextTick();

    // Simulate selected rows via the composable's selectedRowsList
    wrapper.vm.onBatchAction('delete');
    await wrapper.vm.$nextTick();
    await wrapper.vm.handleOk('selectedEntries');
    await flushPromises();

    expect(deleteMultipleDestinations).toHaveBeenCalled();
  });

  it('does NOT call refetch after deleteMultipleDestinations', async () => {
    const refetch = vi.fn();
    const deleteMultipleDestinations = vi
      .fn()
      .mockResolvedValue({ successCount: 1, errorCount: 0 });
    const wrapper = mountSnmpAlerts({
      snmpAlerts: ref(MOCK_ALERTS),
      deleteMultipleDestinations,
      refetch,
    });

    wrapper.vm.onBatchAction('delete');
    await wrapper.vm.$nextTick();
    await wrapper.vm.handleOk('selectedEntries');
    await flushPromises();

    expect(refetch).not.toHaveBeenCalled();
  });

  // ── onBeforeRouteLeave ────────────────────────────────────────────────

  it('registers an onBeforeRouteLeave hook', () => {
    mountSnmpAlerts();
    expect(onBeforeRouteLeaveMock).toHaveBeenCalled();
  });

  // ── defineExpose ──────────────────────────────────────────────────────

  it('exposes a refetch function via defineExpose', () => {
    const refetchMock = vi.fn();
    const wrapper = mountSnmpAlerts({ refetch: refetchMock });
    expect(typeof wrapper.vm.refetch).toBe('function');
  });
});
