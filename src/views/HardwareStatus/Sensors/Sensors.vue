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
          :filtered-items-count="filteredRows"
          :total-number-of-cells="filteredSensors.length"
        ></table-cell-count>
      </BCol>
      <BCol sm="3" md="4" xl="6" class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="12">
        <table-toolbar
          ref="toolbar"
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
          :sort-by="[{ key: 'status', order: 'asc' }]"
          :busy="isBusy"
          show-empty
          :no-border-collapse="true"
          :items="filteredSensors"
          :fields="fields"
          :per-page="itemPerPage"
          :current-page="currentPageNo"
          :filter="searchFilterInput"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredSensors.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="onChangeHeaderCheckbox(tableRef, tableHeaderCheckbox)"
              @update:modelValue="toggleAll"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="row.item.isSelected"
              @change="
                toggleSelectRow(
                  tableRef,
                  row.index,
                  row.item.isSelected,
                  row.item,
                )
              "
            >
            </BFormCheckbox>
          </template>

          <template #cell(status)="{ value }">
            <status-icon :status="statusIconValue(value)" /> {{ value }}
          </template>
          <template #cell(currentValue)="data">
            {{ dataFormatter(data.value) }} {{ data.item.units }}
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
          class="b-pagination"
          first-number
          last-number
          :per-page="itemPerPage"
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-sensors"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { SensorsStore } from '@/store/modules/HardwareStatus/SensorsStore';
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
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import eventBus from '@/eventBus';
const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } =
  usePaginationComposable();
const {
  clearSelectedRows,
  toggleSelectRow,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();
const { dataFormatter } = useDataFormatterGlobal();
const { getFilteredTableData } = useTableFilterComposable();
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const tableHeaderCheckbox = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminated = ref(tableHeaderCheckboxIndeterminate);
const tableRef = ref(null);
const searchTotalFilteredRows = ref(0);
const activeFiltersRows = ref([]);
const isBusy = ref(true);
const isAllSelected = ref(false);
const searchFilterInput = ref('');
const sensorsStore = SensorsStore();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const fields = ref([
  {
    key: 'checkbox',
    sortable: false,
    label: '',
  },
  {
    key: 'name',
    sortable: true,
    label: i18n.global.t('pageSensors.table.name'),
  },
  {
    key: 'status',
    sortable: true,
    label: i18n.global.t('pageSensors.table.status'),
    tdClass: 'text-nowrap',
  },
  {
    key: 'currentValue',
    label: i18n.global.t('pageSensors.table.currentValue'),
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
  hideLoader();
});
onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    sensorsStore?.sensors?.map((singleSensor) => {
      singleSensor.isSelected = false;
    });
    clearSelectedRows(tableRef);
  });
});
onMounted(() => {
  startLoader();
  sensorsStore.getAllSensors().finally(() => {
    isBusy.value = false;
    endLoader();
  });
});
const statusIconValue = (val) => {
  if (val) {
    if (val === 'OK') {
      return 'success';
    } else if (val === 'Warning') {
      return 'warning';
    } else if (val === 'Critical') {
      return 'danger';
    } else {
      return 'unavailable';
    }
  }
};
const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : filteredSensors.value.length;
});
const filteredSensors = computed(() => {
  if (sensorsStore.sensorsGetter) {
    return getFilteredTableData(
      sensorsStore.sensorsGetter,
      activeFiltersRows.value,
    );
  }
  return [];
});
function toggleAll(checked) {
  sensorsStore?.sensors?.map((singleSensor) => {
    singleSensor.isSelected = checked;
  });
  isAllSelected.value = checked;
}
function onFilterChange({ activeFilters }) {
  activeFiltersRows.value = activeFilters;
}
function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}
function onChangeSearch(event) {
  searchFilterInput.value = event;
}
const onClearSearch = () => {
  searchFilterInput.value = '';
};
function exportFileNameByDate() {
  // Create export file name based on date
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
