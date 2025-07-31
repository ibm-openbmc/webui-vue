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
        <div sm="3" md="3" xl="2" class="cellCountStyle">
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
          :items="filteredLogs"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :per-page="perPageVal"
          :current-page="currentPageNo"
          :filter="searchFilterInputVal"
          :busy="isBusy"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredLogs.length)"
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
          first-number
          last-number
          :per-page="perPageVal"
          :total-rows="getTotalRowCount(filteredRows, perPageVal)"
          aria-controls="table-post-code-logs"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import api from '@/store/api';
import i18n from '@/i18n';
import { omit } from 'lodash';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableDateFilter from '@/components/Global/TableDateFilter.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableFilter from "../../../components/Composables/useTableFilterComposable";
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from "@/components/Composables/useToastComposable";
import useTableSortComposable from '../../../components/Composables/useTableSortComposable';
import useTableRowExpandComposable from "../../../components/Composables/useTableRowExpandComposable";
import useSearchFilterComposable from "../../../components/Composables/useSearchFilterComposable";
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import stores from "../../../store";

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
    const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } = usePaginationComposable();
    const { getFilteredTableData, getFilteredTableDataByDate } = useTableFilter();
    const { toggleRowDetails } = useTableRowExpandComposable();
    const { expandRowLabel } = useTableRowExpandComposable();
    const { errorToast } = useToastComposable();
    const { hideLoader, startLoader, endLoader } = useLoadingBar();
    const postCodeLogsStore = stores.PostCodeLogsStore();
    const srcData = ref({});
    const isBusy = ref(true)
    const fields = ref([
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
        },
        {
          key: 'date',
          label: i18n.global.t('pagePostCodeLogs.table.created'),
          sortable: true,
        },
        {
          key: 'timeStampOffset',
          label: i18n.global.t('pagePostCodeLogs.table.timeStampOffset'),
        },
        {
          key: 'bootCount',
          label: i18n.global.t('pagePostCodeLogs.table.bootCount'),
        },
        {
          key: 'postCode',
          label: i18n.global.t('pagePostCodeLogs.table.postCode'),
        },
      ])
    const activeFiltersData = ref([]);
    const currentPageNo = ref(currentPage);
    const filterStartDate= ref( null);
    const filterEndDate= ref(null)
    const itemsPerPageOptionsVal = ref(itemsPerPageOptions);
    const perPageVal = ref(perPage);
    const searchFilterInputVal = ref(searchFilterInput);
    const searchTotalFilteredRows = ref(0);
    const selectedRows= ref(selectedRowsList);
    const tableHeaderCheckboxModelVal = ref(tableHeaderCheckboxModel);
    const tableHeaderCheckboxIndeterminateVal = ref(tableHeaderCheckboxIndeterminate);

  onMounted(() => {
    startLoader();
    postCodeLogsStore.getPostCodesLogData().finally(() => {
      endLoader();
      isBusy.value = false;
    });
  })
  onBeforeRouteLeave(() => {
    // Hide loader if the user navigates to another page
    // before request is fulfilled.
    hideLoader();
  });

    const filteredRows = computed(() => {
      return searchFilterInputVal.value
        ? searchTotalFilteredRows.value
        : filteredLogs.value.length;
    })
    const allLogs = computed(() => {
      return postCodeLogsStore.allPostCodesGetter;
    });
    const batchExportData = computed(() => {
      return selectedRows.value.map((row) => omit(row, 'actions'));
    })
    const filteredLogsByDate = computed(() => {
      return getFilteredTableDataByDate(
        allLogs.value,
        filterStartDate.value,
        filterEndDate.value,
      );
    })
    const filteredLogs = computed(() => {
      return getFilteredTableData(
        filteredLogsByDate.value,
        activeFiltersData.value,
      );
    })

    const fetchSrcDetails = (row) => {
      row.item.toggleDetails = !row.item.toggleDetails;
      toggleRowDetails(row);
      if (!row.detailsShowing) {
        const { timeStampOffset, uri, postCode } = row.item;
        if (!srcData.value[timeStampOffset]) {
          api
            .get(uri)
            .then((response) => generateSrcWords(response.data))
            .then((srcWords) => {
              srcData.value[timeStampOffset] = `${postCode.trim()} ${srcWords}`;
            }
            )
            .catch(() =>
              errorToast(i18n.global.t('pagePostCodeLogs.toast.errorSrcFetch')),
            );
        }
      }
    }
    const generateSrcWords = (data) => {
      const decodedData = atob(data); // `atob` decodes base64 to ASCII string
      const hexData = Array.from(decodedData).map(c => c.charCodeAt(0).toString(16)).join('');
      const srcBulk = hexData.substring(16, 80).toUpperCase();
      if (!isNaN(srcBulk) && !Number(srcBulk)) {
        return '';
      }
      let srcWords = '';
      for (let i = 0; i <= 56; i += 8) {
        srcWords += `${srcBulk.substring(i, i + 8)} `;
      }
      return srcWords.trim();
    }
    const openConsoleWindow = () => {
      window.open(
        `${window.location.origin}/#/console/post-codes`,
        '_blank',
        'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=200,height=200',
      );
    }
    const onFilterChange = ({ activeFilters }) => {
      activeFiltersData.value = activeFilters;
    }
    const onChangeDateTimeFilter = ({ fromDate, toDate }) => {
      filterStartDate.value = fromDate;
      filterEndDate.value = toDate;
    }
    const onFiltered = (filteredItems) => {
      searchTotalFilteredRows.value = filteredItems.length;
    }
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
    }
    const onChangeSearchInput = (event) => {
      searchFilterInputVal.value = event;
    }
    const onClearSearchInput = () => {
      searchFilterInputVal.value = '';
    };
</script>
<style lang="scss" scoped>
  .text-right {
    text-align: right;
  }
  .cellCountStyle {
    margin-bottom: 22px;
    margin-left: 15px;
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
