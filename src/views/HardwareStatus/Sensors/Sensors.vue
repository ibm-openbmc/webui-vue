<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.sensors')" />

    <BRow class="align-items-end">
      <BCol sm="6" md="5" xl="4" class="searchStyle">
        <search
          :placeholder="$t('pageSensors.searchForSensors')"
          data-test-id="sensors-input-searchForSensors"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
      </BCol>
      <BCol sm="3" md="3" xl="2">
        <table-cell-count
          :filtered-items-count="totalItems"
          :total-number-of-cells="sensorsData.length"
        ></table-cell-count>
      </BCol>
      <BCol sm="3" md="4" xl="6" class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
      </BCol>
    </BRow>

    <!-- Chassis tabs — only rendered when there are multiple chassis -->
    <BRow v-if="sensorsByChassis.length > 1">
      <BCol>
        <BCard no-body>
          <BTabs content-class="mt-3 p-0" @update:model-value="onTabChange">
            <BTab
              v-for="group in sensorsByChassis"
              :key="group.chassisId"
              :title="group.chassisName || group.chassisId"
            />
          </BTabs>
        </BCard>
      </BCol>
    </BRow>

    <BRow>
      <BCol xl="12">
        <table-toolbar
          ref="toolbar"
          :table="tableRef"
          :selected-items-count="selectedRowsList.length"
          @clear-selected="clearSelectedRows(tableRef)"
        >
          <template #toolbar-buttons>
            <table-toolbar-export
              :data="selectedRowsList"
              :file-name="exportFileNameByDate()"
            />
          </template>
        </table-toolbar>
        <BTable
          id="table-sensors"
          ref="tableRef"
          responsive="md"
          selectable
          no-select-on-click
          hover
          sticky-header="75vh"
          show-empty
          :no-border-collapse="true"
          :items="filteredSensors"
          :fields="fields"
          class="no-scroll-sticky"
          @row-selected="onRowSelected($event, filteredSensors.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              aria-label="checkbox-head"
              label="Select-all-rows"
              label-class="visually-hidden"
              :indeterminate="isHeaderIndeterminate"
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              :model-value="row.item.isSelected"
              :label="`Select-row-for-sensor-${row.item.name}`"
              label-class="visually-hidden"
              aria-label="checkbox"
              @update:model-value="
                (checked) => {
                  if (checked) {
                    selectedSensors.add(row.item.name);
                  } else {
                    selectedSensors.delete(row.item.name);
                  }
                  toggleSelectRow(tableRef, row.index, checked, row.item);
                }
              "
            >
              <span class="visually-hidden">checkbox</span>
            </BFormCheckbox>
          </template>
          <template #head(status)="row">
            <span style="cursor: pointer" @click="row.toggleSorting">
              <svg
                :style="{
                  opacity: row.field.thAttr['aria-sort'] === 'none' ? 0.5 : 1,
                }"
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                :class="{
                  bi: true,
                  'bi-arrow-up-short':
                    row.field.thAttr['aria-sort'] === 'ascending',
                  'bi-arrow-down-short':
                    row.field.thAttr['aria-sort'] === 'descending',
                }"
                viewBox="0 0 16 16"
                aria-hidden=""
              >
                <path
                  v-if="row.field.thAttr['aria-sort'] === 'descending'"
                  fill-rule="evenodd"
                  d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"
                ></path>
                <path
                  v-else
                  fill-rule="evenodd"
                  d="M8 12a.5.5 0 0 0 .5-.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 .5.5z"
                ></path>
              </svg>
              {{ row.label }}
            </span>
            <info-tooltip :title="$t('pageSensors.table.statusTooltip')" />
          </template>
          <template #cell(status)="{ value }">
            <status-icon :status="statusIconValue(value)" /> {{ value }}
          </template>
          <template #cell(currentValue)="data">
            {{ dataFormatter(data.value) }} {{ data.item.units }}
          </template>
          <template #empty>
            <span v-if="isSensorsLoading">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else-if="searchFilterInput">
              {{ $t('global.table.emptySearchMessage') }}
            </span>
            <span v-else>
              {{ $t('global.table.emptyMessage') }}
            </span>
          </template>
        </BTable>
      </BCol>
    </BRow>
    <!-- Table pagination -->

    <BRow>
      <BCol sm="6">
        <BFormGroup
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <BFormSelect
            id="pagination-items-per-page"
            v-model="itemPerPage"
            :options="itemsPerPageOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <BPagination
          v-model="currentPageNo"
          :tabindex="currentPageNo - 1"
          class="b-pagination"
          first-number
          last-number
          :per-page="
            itemPerPage === 0 ? filteredSensors.length || 1 : itemPerPage
          "
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-sensors"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import {
  ref,
  computed,
  onBeforeMount,
  watch,
  watchEffect,
  nextTick,
} from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { useSensors } from '@/api/composables/useSensors';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableToolbarExport from '@/components/Global/TableToolbarExport.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import eventBus from '@/eventBus';

const { perPage, itemsPerPageOptions, getTotalRowCount } =
  usePaginationComposable();
const {
  clearSelectedRows,
  toggleSelectRow,
  onRowSelected,
  selectedRowsList,
  tableHeaderCheckboxModel,
} = useTableSelectableComposable();
const { dataFormatter } = useDataFormatterGlobal();
const { statusIconValue } = useDataFormatterGlobal();
const { getFilteredTableData } = useTableFilterComposable();

const {
  sensors: allSensors,
  sensorsByChassis,
  isLoading: isSensorsLoading,
  isFetching: isSensorsFetching,
  isError,
  refetch: refetchSensors,
} = useSensors();

usePageLoadingBar(isSensorsFetching, isError);

defineExpose({
  refetch: refetchSensors,
});

// Active chassis tab — keyed by chassisId (string) so refetches that reorder
// the array never accidentally show the wrong chassis's sensors.
const activeChassisId = ref(null);

// Initialise to the first chassis as soon as data arrives; preserve the
// selection when subsequent refetches arrive (identity is stable by chassisId).
watchEffect(() => {
  if (sensorsByChassis.value.length && !activeChassisId.value) {
    activeChassisId.value = sensorsByChassis.value[0].chassisId;
  }
});

// Track selection state separately to avoid circular dependencies
const selectedSensors = ref(new Set());

// Sensors for the currently active chassis tab
const activeSensorsRaw = computed(() => {
  if (sensorsByChassis.value.length <= 1) {
    return allSensors.value ?? [];
  }
  const group = sensorsByChassis.value.find(
    (g) => g.chassisId === activeChassisId.value,
  );
  return group ? group.sensors : [];
});

// Computed property that merges sensor data with selection state
const sensorsData = computed(() => {
  if (!activeSensorsRaw.value) return [];
  return activeSensorsRaw.value.map((sensor) => ({
    ...sensor,
    isSelected: selectedSensors.value.has(sensor.name),
  }));
});

// Use the composable refs directly — already reactive.
const tableHeaderCheckbox = tableHeaderCheckboxModel;

// True when some — but not all — sensors on the active tab are selected.
const isHeaderIndeterminate = computed(() => {
  const count = selectedSensors.value.size;
  return count > 0 && count < activeSensorsRaw.value.length;
});
const tableRef = ref(null);
const activeFiltersRows = ref([]);
const searchFilterInput = ref('');

const fields = ref([
  {
    key: 'checkbox',
    sortable: false,
    label: '',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'name',
    sortable: true,
    label: i18n.global.t('pageSensors.table.name'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'status',
    sortable: true,
    label: i18n.global.t('pageSensors.table.status'),
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'currentValue',
    label: i18n.global.t('pageSensors.table.currentValue'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

const tableFilters = ref([
  {
    key: 'status',
    label: i18n.global.t('pageSensors.table.status'),
    values: [
      i18n.global.t('pageSensors.table.filter.ok'),
      i18n.global.t('pageSensors.table.filter.warning'),
      i18n.global.t('pageSensors.table.filter.critical'),
    ],
  },
]);

onBeforeRouteLeave(() => {
  eventBus.emit('clear-selected');
});

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    selectedSensors.value.clear();
    clearSelectedRows(tableRef);
  });
});

// Filtered data before pagination
const filteredSensorsData = computed(() => {
  if (!sensorsData.value) return [];

  let data = getFilteredTableData(sensorsData.value, activeFiltersRows.value);

  if (searchFilterInput.value) {
    const search = searchFilterInput.value.toLowerCase();
    const allowedKeys = fields.value.map((item) => item.key);
    data = data.filter((item) => {
      const searchableFields = allowedKeys
        .filter((key) => key in item)
        .map((key) => item[key]);
      return searchableFields.some((field) =>
        String(field || '')
          .toLowerCase()
          .includes(search),
      );
    });
  }
  return data;
});

const itemPerPage = ref(perPage);

const pagination = usePaginatedData({
  data: filteredSensorsData,
  pageSize: itemPerPage.value,
  initialPage: 1,
});

watch(itemPerPage, (newSize) => {
  pagination.pageSize.value = newSize;
});

// Clear selection and reset page when switching tabs.
// selectedRowsList is reset unconditionally first so the export toolbar is
// always cleared even when tableRef has not yet mounted.
function onTabChange(index) {
  const group = sensorsByChassis.value[index];
  if (group) activeChassisId.value = group.chassisId;
  selectedSensors.value.clear();
  selectedRowsList.value = [];
  clearSelectedRows(tableRef);
  pagination.currentPage.value = 1;
}

const filteredSensors = pagination.paginatedData;
const currentPageNo = pagination.currentPage;
const totalItems = pagination.totalItems;
const filteredRows = computed(() => totalItems.value);

// Accessibility fixes
watch(
  () => filteredSensors.value,
  (items) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!items || !items.length) {
        document
          .querySelector('tr.b-table-empty-slot td[scope]')
          ?.removeAttribute('scope');
      }
    });
  },
  { deep: true },
);

function toggleAll(checked) {
  if (checked) {
    sensorsData.value.forEach((sensor) => {
      selectedSensors.value.add(sensor.name);
    });
    selectedRowsList.value = [...sensorsData.value];
  } else {
    selectedSensors.value.clear();
    selectedRowsList.value = [];
  }
}

function onFilterChange({ activeFilters }) {
  activeFiltersRows.value = activeFilters;
}

function onChangeSearch(event) {
  searchFilterInput.value = event;
}

const onClearSearch = () => {
  searchFilterInput.value = '';
};

function exportFileNameByDate() {
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  return i18n.global.t('pageSensors.exportFilePrefix') + date;
}
</script>

<style lang="scss" scoped>
#table-sensors {
  td .btn-link {
    width: auto !important;
  }
}
.text-right {
  text-align: right;
}
.searchStyle {
  height: 74px;
}
</style>
