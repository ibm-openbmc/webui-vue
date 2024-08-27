<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.auditLogs')" />
    <div class="section-divider mb-4 mt-4"></div>
    <BRow class="align-items-start">
      <BCol sm="8" xl="6" class="d-sm-flex align-items-end mb-4 searchStyle">
        <search
          :placeholder="$t('pageAuditLogs.table.searchLogs')"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
        <div class="ml-sm-4 margin-style">
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
      <BCol class="text-right">
        <BButton
          variant="primary"
          :class="{ disabled: allLogs.length === 0 }"
          @click="downloadEventLogs('all')"
        >
          <icon-download /> {{ $t('global.action.downloadAll') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <BTable
          id="table-audit-logs"
          ref="table"
          responsive="md"
          selectable
          no-select-on-click
          sort-icon-left
          hover
          no-sort-reset
          sticky-header="75vh"
          sort-by="date"
          :sort-desc="true"
          show-empty
          :fields="fields"
          :items="filteredLogs"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :per-page="itemPerPage"
          :current-page="currentPageNo"
          :filter="searchFilterInput"
          :busy="isBusy"
          @filtered="onFiltered"
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
              @click="toggleRow(row)"
            >
              <icon-chevron />
            </BButton>
          </template>

          <template #row-details="{ item }">
            <BContainer fluid class="expanded-row">
              <BRow>
                <BCol>
                  <dl>
                    <!-- Id -->
                    <dt>{{ $t('pageAuditLogs.table.id') }}:</dt>
                    <dd>{{ dataFormatter(item.auditId) }}</dd>
                  </dl>
                  <dl>
                    <!-- Message -->
                    <dt>{{ $t('pageAuditLogs.table.message') }}:</dt>
                    <dd>
                      {{ dataFormatter(item.message) }}
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
          aria-controls="table-audit-logs"
        />
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import IconDownload from '@carbon/icons-vue/es/download/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import { AuditLogsStore } from '@/store/index.js';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import Search from '@/components/Global/Search.vue';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import TableDateFilter from '@/components/Global/TableDateFilter.vue';
import useTableRowExpandComposable from '@/components/Composables/useTableRowExpandComposable';
import eventBus from '@/eventBus';

const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } =
  usePaginationComposable();
const auditLogsStore = AuditLogsStore();
const { successToast, infoToast, errorToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();
const { dataFormatter } = useDataFormatterGlobal();
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const isBusy = ref(true);
const fields = ref([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
  },
  {
    key: 'date',
    label: i18n.global.t('pageAuditLogs.table.eventTimeStamp'),
  },
  {
    key: 'operation',
    label: i18n.global.t('pageAuditLogs.table.op'),
  },
  {
    key: 'account',
    label: i18n.global.t('pageAuditLogs.table.acct'),
  },
  {
    key: 'addr',
    label: i18n.global.t('pageAuditLogs.table.addr'),
  },
  {
    key: 'res',
    label: i18n.global.t('pageAuditLogs.table.res'),
  },
]);
const { expandRowLabel } = useTableRowExpandComposable();
const { toggleRowDetails } = useTableRowExpandComposable();
const { getFilteredTableData, getFilteredTableDataByDate } =
  useTableFilterComposable();
const searchTotalFilteredRows = ref(0);
const searchFilterInput = ref('');
const activeFilters = ref([]);
const filterStartDate = ref(null);
const filterEndDate = ref(null);

onMounted(() => {
  startLoader();
  auditLogsStore.getAuditLogData().finally(() => {
    isBusy.value = false;
    endLoader();
  });
});

onBeforeMount(() => {
  eventBus.on('change', ({ fromDate, toDate }) => {
    filterStartDate.value = fromDate;
    filterEndDate.value = toDate;
  });
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : filteredLogs.value.length;
});
const filteredLogsByDate = computed(() => {
  return getFilteredTableDataByDate(
    auditLogsStore.allAuditLogsGetter,
    filterStartDate.value,
    filterEndDate.value,
  );
});
const filteredLogs = computed(() => {
  if (auditLogsStore.allAuditLogsGetter) {
    return getFilteredTableData(filteredLogsByDate.value, activeFilters.value);
  }
  return [];
});

const allLogs = computed(() => {
  return auditLogsStore.allAuditLogsGetter.map((auditLogs) => {
    return {
      ...auditLogs,
    };
  });
});

const onChangeDateTimeFilter = ({ fromDate, toDate }) => {
  filterStartDate.value = fromDate;
  filterEndDate.value = toDate;
};
function onChangeSearch(event) {
  searchFilterInput.value = event;
}
const onClearSearch = () => {
  searchFilterInput.value = '';
};

const toggleRow = (row) => {
  row.item.toggleDetails = !row.item.toggleDetails;
  toggleRowDetails(row);
};

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}

const downloadFile = (data) => {
  const decodedData = atob(data);
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  let fileName;
  fileName = 'audit_logs_' + date;
  var element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(decodedData),
  );
  element.setAttribute('download', fileName);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

const downloadEventLogs = async (value) => {
  const auditLogsData = [];
  infoToast(i18n.global.t('pageAuditLogs.toast.infoStartDownload'));
  if (value === 'all') {
    startLoader();
    await auditLogsStore
      .downloadLogData(allLogs.value[0].additionalDataUri)
      .then((response) => {
        auditLogsData.push(response.data);
      })
      .then(() => {
        downloadFile(auditLogsData);
        successToast(i18n.global.t('pageAuditLogs.toast.successStartDownload'));
      })
      .catch((error) => {
        console.log(error);
        errorToast(i18n.global.t('pageAuditLogs.toast.errorStartDownload'));
      })
      .finally(() => {
        endLoader();
      });
  }
};
</script>
<style lang="scss" scoped>
#table-audit-logs {
  td .btn-link {
    width: auto !important;
  }
}
.text-right {
  text-align: right;
}
.searchStyle {
  height: 74px;
  top: 22px;
  position: relative;
}
.margin-style {
  margin-bottom: 23px;
  margin-left: 10px;
}
.container-fluid {
  width: calc(100% - 90px);
}
.rotateSvg {
  svg {
    transform: rotate(180deg);
  }
}
</style>
