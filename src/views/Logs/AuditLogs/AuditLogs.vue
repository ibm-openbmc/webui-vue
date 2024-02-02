<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.auditLogs')" />
    <div class="section-divider mb-4 mt-4"></div>
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pageAuditLogs.table.searchLogs')"
          @change-search="onChangeSearchInput"
          @clear-search="onClearSearchInput"
        />
        <div class="ml-sm-4">
          <table-cell-count
            :filtered-items-count="filteredRows"
            :total-number-of-cells="allLogs.length"
          ></table-cell-count>
        </div>
      </b-col>
      <b-col sm="8" md="7" xl="6">
        <table-date-filter @change="onChangeDateTimeFilter" />
      </b-col>
    </b-row>
    <b-row>
      <b-col class="text-right">
        <b-button
          variant="primary"
          :class="{ disabled: allLogs.length === 0 }"
          @click="downloadEventLogs('all')"
        >
          <icon-download /> {{ $t('global.action.downloadAll') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-table
          id="table-audit-logs"
          ref="table"
          responsive="md"
          selectable
          no-select-on-click
          sort-icon-left
          hover
          no-sort-reset
          sort-by="date"
          :sort-desc="true"
          show-empty
          :fields="fields"
          :items="filteredLogs"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :per-page="perPage"
          :current-page="currentPage"
          :filter="searchFilter"
          :busy="isBusy"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredLogs.length)"
        >
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ value | formatDate }}</p>
            <p class="mb-0">{{ value | formatTime }}</p>
          </template>
        </b-table>
      </b-col>
    </b-row>

    <!-- Table pagination -->
    <b-row>
      <b-col sm="6">
        <b-form-group
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <b-form-select
            id="pagination-items-per-page"
            v-model="perPage"
            :options="itemsPerPageOptions"
          />
        </b-form-group>
      </b-col>
      <b-col sm="6">
        <b-pagination
          v-model="currentPage"
          first-number
          last-number
          :per-page="perPage"
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-post-code-logs"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import IconDownload from '@carbon/icons-vue/es/download/20';
import PageTitle from '@/components/Global/PageTitle';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import TableDateFilter from '@/components/Global/TableDateFilter';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import TableFilterMixin from '@/components/Mixins/TableFilterMixin';
import BVPaginationMixin, {
  currentPage,
  perPage,
  itemsPerPageOptions,
} from '@/components/Mixins/BVPaginationMixin';
import BVTableSelectableMixin, {
  selectedRows,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} from '@/components/Mixins/BVTableSelectableMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import TableSortMixin from '@/components/Mixins/TableSortMixin';
import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';

export default {
  components: {
    IconDownload,
    PageTitle,
    Search,
    TableCellCount,
    TableDateFilter,
  },
  mixins: [
    BVPaginationMixin,
    BVTableSelectableMixin,
    BVToastMixin,
    LoadingBarMixin,
    TableFilterMixin,
    TableSortMixin,
    TableRowExpandMixin,
    SearchFilterMixin,
  ],
  beforeRouteLeave(to, from, next) {
    // Hide loader if the user navigates to another page
    // before request is fulfilled.
    this.hideLoader();
    next();
  },
  data() {
    return {
      isBusy: true,
      fields: [
        {
          key: 'id',
          label: this.$t('pageAuditLogs.table.id'),
          sortable: true,
        },
        {
          key: 'date',
          label: this.$t('pageAuditLogs.table.eventTimeStamp'),
        },
        {
          key: 'operation',
          label: this.$t('pageAuditLogs.table.op'),
        },
        {
          key: 'account',
          label: this.$t('pageAuditLogs.table.acct'),
        },
        {
          key: 'addr',
          label: this.$t('pageAuditLogs.table.addr'),
        },
        {
          key: 'res',
          label: this.$t('pageAuditLogs.table.res'),
        },
        {
          key: 'messageId',
          label: this.$t('pageAuditLogs.table.messageId'),
        },
      ],
      expandRowLabel,
      activeFilters: [],
      currentPage: currentPage,
      filterStartDate: null,
      filterEndDate: null,
      itemsPerPageOptions: itemsPerPageOptions,
      perPage: perPage,
      searchFilter: searchFilter,
      searchTotalFilteredRows: 0,
      selectedRows: selectedRows,
      tableHeaderCheckboxModel: tableHeaderCheckboxModel,
      tableHeaderCheckboxIndeterminate: tableHeaderCheckboxIndeterminate,
    };
  },
  computed: {
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.filteredLogs.length;
    },
    allLogs() {
      return this.$store.getters['auditLogs/allAuditLogs'].map((auditLogs) => {
        return {
          ...auditLogs,
        };
      });
    },
    filteredLogsByDate() {
      return this.getFilteredTableDataByDate(
        this.allLogs,
        this.filterStartDate,
        this.filterEndDate
      );
    },
    filteredLogs() {
      return this.getFilteredTableData(
        this.filteredLogsByDate,
        this.activeFilters
      );
    },
  },
  created() {
    this.startLoader();
    this.$store.dispatch('auditLogs/getAuditLogData').finally(() => {
      this.endLoader();
      this.isBusy = false;
    });
  },
  methods: {
    onChangeDateTimeFilter({ fromDate, toDate }) {
      this.filterStartDate = fromDate;
      this.filterEndDate = toDate;
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    downloadFile(data) {
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
        'data:text/plain;charset=utf-8,' + encodeURIComponent(decodedData)
      );
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    async downloadEventLogs(value) {
      const auditLogsData = [];
      this.infoToast(this.$t('pageAuditLogs.toast.infoStartDownload'));
      if (value === 'all') {
        this.startLoader();
        await this.$store
          .dispatch(
            'auditLogs/downloadLogData',
            this.allLogs[0].additionalDataUri
          )
          .then((response) => {
            auditLogsData.push(response.data);
          })
          .catch((message) => {
            this.errorToast(message);
          })
          .finally(() => {
            this.downloadFile(auditLogsData);
            this.endLoader();
          });
      }
    },
  },
};
</script>
