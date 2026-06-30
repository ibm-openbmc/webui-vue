import { mount } from '@vue/test-utils';
<<<<<<< HEAD
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
=======
import { describe, it, expect, vi, afterAll } from 'vitest';
import { ref } from 'vue';
>>>>>>> bb148f8e (Added sensors unit tests)
import { createPinia, setActivePinia } from 'pinia';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import Sensors from '@/views/HardwareStatus/Sensors/Sensors.vue';
import stores from '@/store';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

<<<<<<< HEAD
const onBeforeRouteLeaveMock = vi.fn();

=======
>>>>>>> bb148f8e (Added sensors unit tests)
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
<<<<<<< HEAD
    onBeforeRouteLeave: onBeforeRouteLeaveMock,
=======
    onBeforeRouteLeave: vi.fn(),
>>>>>>> bb148f8e (Added sensors unit tests)
  };
});

afterAll(() => {
  vi.unmock('vue-router');
});

<<<<<<< HEAD
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

=======
>>>>>>> bb148f8e (Added sensors unit tests)
// Mock the useSensors composable so tests don't require a live API
vi.mock('@/api/composables/useSensors', () => ({
  useSensors: vi.fn(),
}));

import { useSensors } from '@/api/composables/useSensors';
<<<<<<< HEAD
import eventBus from '@/eventBus';
=======
>>>>>>> bb148f8e (Added sensors unit tests)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build the minimal mock useSensors return value */
const makeSensorsHook = (overrides = {}) => ({
  sensors: ref([]),
  isLoading: ref(false),
<<<<<<< HEAD
  isFetching: ref(false),
=======
>>>>>>> bb148f8e (Added sensors unit tests)
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn(),
  ...overrides,
});

/** A small set of sensor fixtures used across tests */
const MOCK_SENSORS = [
  {
    odataId: '/redfish/v1/Chassis/chassis1/Sensors/Temp1',
    isSelected: false,
    name: 'CPU Temp',
    status: 'OK',
    currentValue: 55,
    units: 'Cel',
  },
  {
    odataId: '/redfish/v1/Chassis/chassis1/Sensors/Fan1',
    isSelected: false,
    name: 'Fan Speed',
    status: 'Warning',
    currentValue: 2800,
    units: 'RPM',
  },
  {
    odataId: '/redfish/v1/Chassis/chassis1/Sensors/Volt1',
    isSelected: false,
    name: 'Voltage Rail',
    status: 'Critical',
    currentValue: 3.24,
    units: 'V',
  },
];

/** Mount Sensors.vue with standard global config */
function mountSensors(hookOverrides = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  useSensors.mockReturnValue(makeSensorsHook(hookOverrides));

  const pinia = createPinia();
  setActivePinia(pinia);
  const globalStore = stores.GlobalStore();
  globalStore.getSystemInfo = vi.fn();

  return mount(Sensors, {
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

describe('Sensors.vue', () => {
<<<<<<< HEAD
  beforeEach(() => {
    vi.clearAllMocks();
  });
=======
>>>>>>> bb148f8e (Added sensors unit tests)
  // ── Rendering ─────────────────────────────────────────────────────────────

  it('renders without errors', () => {
    const wrapper = mountSensors();
    expect(wrapper.exists()).toBe(true);
  });

  it('renders the sensors table', () => {
    const wrapper = mountSensors();
    expect(wrapper.find('#table-sensors').exists()).toBe(true);
  });

  it('renders the search input', () => {
    const wrapper = mountSensors();
    expect(
      wrapper.find('[data-test-id="sensors-input-searchForSensors"]').exists(),
    ).toBe(true);
  });

  it('renders the pagination controls', () => {
    const wrapper = mountSensors();
    expect(wrapper.find('.b-pagination').exists()).toBe(true);
  });

  // ── Loading state ─────────────────────────────────────────────────────────

<<<<<<< HEAD
  it('isBusy computed is true when sensors are fetching', () => {
    const wrapper = mountSensors({ isFetching: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy computed is false when fetching is complete', () => {
    const wrapper = mountSensors({ isFetching: ref(false) });
=======
  it('isBusy computed is true when sensors are loading', () => {
    const wrapper = mountSensors({ isLoading: ref(true) });
    expect(wrapper.vm.isBusy).toBe(true);
  });

  it('isBusy computed is false when loading is complete', () => {
    const wrapper = mountSensors({ isLoading: ref(false) });
>>>>>>> bb148f8e (Added sensors unit tests)
    expect(wrapper.vm.isBusy).toBe(false);
  });

  // ── Data display ──────────────────────────────────────────────────────────

<<<<<<< HEAD
  it('renders sortable status header content', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('th[aria-sort] svg').exists()).toBe(true);
  });

=======
>>>>>>> bb148f8e (Added sensors unit tests)
  it('displays all sensors when no filter or search is active', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    // filteredSensors is the paginated data exposed to the template
    expect(wrapper.vm.filteredSensors.length).toBe(MOCK_SENSORS.length);
  });

  it('shows sensor names in the table rows', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    const tableText = wrapper.find('#table-sensors').text();
    expect(tableText).toContain('CPU Temp');
    expect(tableText).toContain('Fan Speed');
    expect(tableText).toContain('Voltage Rail');
  });

  it('shows an empty message element when there are no sensors', async () => {
    const wrapper = mountSensors({ sensors: ref([]) });
    await wrapper.vm.$nextTick();

    // BTable emits a `show-empty` slot — we check via the component's own
    // filteredSensors count so we are not coupled to internal library markup
    expect(wrapper.vm.filteredSensors.length).toBe(0);
    expect(wrapper.find('#table-sensors').text()).toContain(
      'global.table.emptyMessage',
    );
  });

  // ── Search filtering ───────────────────────────────────────────────────────

  it('filters the table rows when a search term matches the sensor name', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('CPU');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(1);
    expect(wrapper.vm.filteredSensors[0].name).toBe('CPU Temp');
  });

  it('is case-insensitive when searching', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('cpu temp');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(1);
  });

  it('returns no rows when the search term matches nothing', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('xyz_no_match');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(0);
  });

  it('restores all rows after search is cleared', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onChangeSearch('CPU');
    await wrapper.vm.$nextTick();
    wrapper.vm.onClearSearch();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(MOCK_SENSORS.length);
  });

  // ── Filter change ─────────────────────────────────────────────────────────

  it('applies a status filter to only show matching rows', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'status', values: ['OK'] }],
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(1);
    expect(wrapper.vm.filteredSensors[0].status).toBe('OK');
  });

  it('shows all rows when the filter is cleared', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'status', values: ['OK'] }],
    });
    await wrapper.vm.$nextTick();

    wrapper.vm.onFilterChange({ activeFilters: [] });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(MOCK_SENSORS.length);
  });

  it('can combine search and status filter', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    // Filter to 'OK' first — matches only CPU Temp
    wrapper.vm.onFilterChange({
      activeFilters: [{ key: 'status', values: ['OK'] }],
    });
    await wrapper.vm.$nextTick();

    // Then search within those results for "Fan" — no matches
    wrapper.vm.onChangeSearch('Fan');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.length).toBe(0);
  });

  // ── exportFileNameByDate ──────────────────────────────────────────────────

  it('exportFileNameByDate returns a string containing a date segment', () => {
    const wrapper = mountSensors();
    const filename = wrapper.vm.exportFileNameByDate();
    expect(typeof filename).toBe('string');
    // The filename always contains the ISO date part (YYYY-MM-DD)
    expect(filename).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('exportFileNameByDate filename starts with the sensors prefix', () => {
    const wrapper = mountSensors();
    const filename = wrapper.vm.exportFileNameByDate();
    // The real i18n key resolves to "sensors_" in en-US locale
    expect(filename.startsWith('sensors_')).toBe(true);
  });

  // ── toggleAll ─────────────────────────────────────────────────────────────

  it('toggleAll(true) marks all sensors as selected', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    const allSelected = wrapper.vm.sensorsData.every((s) => s.isSelected);
    expect(allSelected).toBe(true);
  });

<<<<<<< HEAD
  it('selects all sensors when the header checkbox is toggled through the UI', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    const headerCheckbox = wrapper.find('input[aria-label="checkbox-head"]');
    await headerCheckbox.setValue(true);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.sensorsData.every((sensor) => sensor.isSelected)).toBe(
      true,
    );
  });

  it('updates selection when a row checkbox is toggled through the UI', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    const rowCheckbox = wrapper.find('input[aria-label="checkbox"]');
    await rowCheckbox.setValue(true);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.sensorsData[0].isSelected).toBe(true);
  });

=======
>>>>>>> bb148f8e (Added sensors unit tests)
  it('toggleAll(false) clears all selections', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();
    wrapper.vm.toggleAll(false);
    await wrapper.vm.$nextTick();

    const anySelected = wrapper.vm.sensorsData.some((s) => s.isSelected);
    expect(anySelected).toBe(false);
  });

  // ── sensorsData computed ──────────────────────────────────────────────────

  it('sensorsData reflects the sensor list from useSensors', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.sensorsData).toHaveLength(MOCK_SENSORS.length);
    expect(wrapper.vm.sensorsData[0].name).toBe('CPU Temp');
  });

  it('sensorsData returns empty array when no sensors are returned', () => {
    const wrapper = mountSensors({ sensors: ref([]) });
    expect(wrapper.vm.sensorsData).toHaveLength(0);
  });

<<<<<<< HEAD
  it('starts the loader immediately when loading is true on mount', () => {
    mountSensors({ isLoading: ref(true) });

    expect(startLoaderMock).toHaveBeenCalledTimes(1);
    expect(endLoaderMock).not.toHaveBeenCalled();
  });

  it('ends the loader immediately when loading is false on mount', () => {
    mountSensors({ isLoading: ref(false) });

    expect(endLoaderMock).toHaveBeenCalledTimes(1);
    expect(startLoaderMock).not.toHaveBeenCalled();
  });

  it('ends the loader when the sensors query enters an error state', async () => {
    const isError = ref(false);
    mountSensors({ isError });

    endLoaderMock.mockClear();
    isError.value = true;
    await nextTick();

    expect(endLoaderMock).toHaveBeenCalledTimes(1);
  });

  it('clears selected rows when the clear-selected event is emitted', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    wrapper.vm.toggleAll(true);
    await wrapper.vm.$nextTick();

    eventBus.emit('clear-selected');
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.sensorsData.every((sensor) => !sensor.isSelected)).toBe(
      true,
    );
  });

  it('onFiltered does not change the current filtered sensors', async () => {
    const wrapper = mountSensors({ sensors: ref(MOCK_SENSORS) });
    await wrapper.vm.$nextTick();

    const before = wrapper.vm.filteredSensors.map((sensor) => sensor.name);
    wrapper.vm.onFiltered([{ name: 'Different Sensor' }]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.filteredSensors.map((sensor) => sensor.name)).toEqual(
      before,
    );
  });

=======
>>>>>>> bb148f8e (Added sensors unit tests)
  // ── defineExpose ──────────────────────────────────────────────────────────

  it('exposes a refetch function via defineExpose', () => {
    const refetchMock = vi.fn();
    const wrapper = mountSensors({ refetch: refetchMock });
    expect(typeof wrapper.vm.refetch).toBe('function');
  });
});
