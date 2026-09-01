<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.postCodeLogs')" />
    <BRow>
      <BCol xl="12" class="text-right">
        <BButton variant="dark" type="button" @click="openConsoleWindow()">
          <icon-launch />
          {{ $t('pagePostCodeLogs.viewCodesInRealtime') }}
        </BButton>
      </BCol>
    </BRow>
    <div class="section-divider mb-4 mt-4"></div>
    <BRow class="align-items-start">
      <BCol sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pagePostCodeLogs.table.searchLogs')"
          @change-search="onChangeSearchInput"
          @clear-search="onClearSearchInput"
        />
        <div sm="3" md="3" xl="2" class="margin-style">
          <table-cell-count
            :filtered-items-count="filteredRows"
            :total-number-of-cells="allLogs.length"
          ></table-cell-count>
        </div>
      </BCol>
      <BCol sm="8" md="7" xl="6">
        <table-date-filter @change="onChangeDateTimeFilter" />
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BTable
          id="table-post-code-logs"
          ref="table"
          responsive="md"
          selectable
          no-select-on-click
          sort-icon-left
          hover
          sticky-header="75vh"
          no-sort-reset
          sort-by="date"
          :sort-desc="true"
          show-empty
          :fields="fields"
          :items="paginatedLogs"
          @row-selected="onRowSelected($event, paginatedLogs.length)"
        >
          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <BButton
              variant="link"
              :aria-label="expandRowLabel"
              :title="expandRowLabel"
              :class="
                row.item.toggleDetails
                  ? 'rotateSvg btn-icon-only'
                  : 'btn-icon-only'
              "
              @click="fetchSrcDetails(row)"
            >
              <icon-chevron />
            </BButton>
          </template>
          <template #row-details="{ item }">
            <BContainer fluid
              ><BRow>
                <BCol>
                  <dl>
                    <!-- SRC Details -->
                    <dt>
                      {{ $t('pagePostCodeLogs.table.srcDetails') }}:
                      <info-tooltip
                        class="info-icon"
                        :title="$t('pagePostCodeLogs.table.srcDetailsToolTip')"
                      >
                      </info-tooltip>
                    </dt>
                    <dd>
                      {{ dataFormatter(srcData[item.timeStampOffset]) }}
                    </dd>
                  </dl>
                </BCol>
              </BRow>
            </BContainer>
          </template>
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ $filters.formatDate(value) }}</p>
            <p class="mb-0">{{ $filters.formatTime(value) }}</p>
          </template>
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else-if="searchFilterInputVal">
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
            v-model="perPageVal"
            :options="itemsPerPageOptionsVal"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <BPagination
          v-model="currentPageNo"
          class="b-pagination"
          :tabindex="currentPageNo - 1"
          first-number
          last-number
          :per-page="perPageVal === 0 ? filteredLogs.length || 1 : perPageVal"
          :total-rows="filteredRows"
          aria-controls="table-post-code-logs"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import i18n from '@/i18n';
import { omit } from 'lodash';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableDateFilter from '@/components/Global/TableDateFilter.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useTableFilter from '../../../components/Composables/useTableFilterComposable';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import useTableSortComposable from '../../../components/Composables/useTableSortComposable';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import { ref, computed, watch, nextTick } from 'vue';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
import { onBeforeRouteLeave } from 'vue-router';
import { buildUrlNewTab } from '@/utilities/url';
import { usePostCodeLogs } from '@/api/composables/usePostCodeLogs';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';

// Composables
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
const { searchFilterInput } = useSearchFilterComposable();
const { perPage, itemsPerPageOptions } = usePaginationComposable();
const { getFilteredTableData, getFilteredTableDataByDate } = useTableFilter();
const { toggleRowDetails } = useTableRowExpandComposable();
const { expandRowLabel } = useTableRowExpandComposable();
const { errorToast } = useToastComposable();

// Use the new vue-query composable
const {
  allLogs: postCodeLogsData,
  isLoading,
  isFetching,
  isError,
  fetchSrcDetails: fetchSrcDetailsApi,
} = usePostCodeLogs();

usePageLoadingBar(isFetching, isError);

const srcData = ref({});
const isBusy = ref(true);
const fields = ref([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'date',
    label: i18n.global.t('pagePostCodeLogs.table.created'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: true,
  },
  {
    key: 'timeStampOffset',
    label: i18n.global.t('pagePostCodeLogs.table.timeStampOffset'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'bootCount',
    label: i18n.global.t('pagePostCodeLogs.table.bootCount'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'postCode',
    label: i18n.global.t('pagePostCodeLogs.table.postCode'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);
const activeFiltersData = ref([]);
const filterStartDate = ref(null);
const filterEndDate = ref(null);
const itemsPerPageOptionsVal = ref(itemsPerPageOptions);
const perPageVal = ref(perPage);
const searchFilterInputVal = ref(searchFilterInput);
const selectedRows = ref(selectedRowsList);
const tableHeaderCheckboxModelVal = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminateVal = ref(
  tableHeaderCheckboxIndeterminate,
);
const expandColumn = ref(['timeStampOffset']);

// Keep isBusy in sync for the table empty-slot spinner
watch(
  isLoading,
  (loading) => {
    isBusy.value = loading;
  },
  { immediate: true },
);

const allLogs = computed(() => {
  return postCodeLogsData.value || [];
});
const batchExportData = computed(() => {
  return selectedRows.value.map((row) => omit(row, 'actions'));
});
const filteredLogsByDate = computed(() => {
  return getFilteredTableDataByDate(
    allLogs.value,
    filterStartDate.value,
    filterEndDate.value,
  );
});
const filteredLogs = computed(() => {
  if (!filteredLogsByDate.value) return [];
  let data = getFilteredTableData(
    filteredLogsByDate.value,
    activeFiltersData.value,
  );
  if (searchFilterInput.value) {
    const search = searchFilterInput.value.toLowerCase();
    const allowedKeys = fields.value.map((item) => item.key);
    data = data.filter((item) => {
      const searchableFields = [
        ...allowedKeys.filter((key) => key in item).map((key) => item[key]),
        ...expandColumn.value.map((path) => srcData[item[path]]),
      ];
      return searchableFields.some((field) =>
        String(field || '')
          .toLowerCase()
          .includes(search),
      );
    });
  }
  return data;
});

// ── Client-side pagination via usePaginatedData ───────────────────────────────
const pagination = usePaginatedData({
  data: filteredLogs,
  pageSize: perPageVal.value,
  initialPage: 1,
});

watch(perPageVal, (newSize) => {
  pagination.pageSize.value = newSize;
});

const paginatedLogs = pagination.paginatedData;
const currentPageNo = pagination.currentPage;
const filteredRows = pagination.totalItems;

const fetchSrcDetails = async (row) => {
  row.item.toggleDetails = !row.item.toggleDetails;
  toggleRowDetails(row);
  if (!row.detailsShowing) {
    const { timeStampOffset, uri, postCode } = row.item;
    if (!srcData.value[timeStampOffset]) {
      try {
        const result = await fetchSrcDetailsApi(uri, postCode);
        srcData.value[timeStampOffset] = result;
      } catch (error) {
        errorToast(error.message);
      }
    }
  }
};
const openConsoleWindow = () => {
  window.open(
    buildUrlNewTab(`/#/console/post-codes`),
    '_blank',
    'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=200,height=200',
  );
};
const onFilterChange = ({ activeFilters }) => {
  activeFiltersData.value = activeFilters;
};
const onChangeDateTimeFilter = ({ fromDate, toDate }) => {
  filterStartDate.value = fromDate;
  filterEndDate.value = toDate;
};
// Create export file name based on date and action
const exportFileNameByDate = (value) => {
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  let fileName;
  if (value === 'download') {
    fileName = i18n.global.t('pagePostCodeLogs.downloadFilePrefix');
  } else if (value === 'export') {
    fileName = i18n.global.t('pagePostCodeLogs.exportFilePrefix');
  } else {
    fileName = i18n.global.t('pagePostCodeLogs.allExportFilePrefix');
  }
  return fileName + date;
};
const onChangeSearchInput = (event) => {
  searchFilterInputVal.value = event;
};
const onClearSearchInput = () => {
  searchFilterInputVal.value = '';
};

watch(
  () => filteredLogs,
  (item) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!item.length) {
        document
          .querySelector('tr.b-table-empty-slot td[scope]')
          ?.removeAttribute('scope');
      }
    });
  },
  { deep: true },
);
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}
.margin-style {
  margin-bottom: 23px;
  margin-left: 1.5rem;
}
.container-fluid {
  width: calc(100% - 126px);
}
.rotateSvg {
  svg {
    transform: rotate(180deg);
  }
}
</style>
