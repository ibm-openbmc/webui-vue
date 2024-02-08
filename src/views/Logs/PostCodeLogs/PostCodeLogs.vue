<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.postCodeLogs')" />
    <b-row>
      <b-col xl="12" class="text-right">
        <b-button variant="dark" type="button" @click="openConsoleWindow()">
          <icon-launch />
          {{ $t('pagePostCodeLogs.viewCodesInRealtime') }}
        </b-button>
      </b-col>
    </b-row>
    <div class="section-divider mb-4 mt-4"></div>
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pagePostCodeLogs.table.searchLogs')"
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
      <b-col>
        <b-table
          id="table-post-code-logs"
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
          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <b-button
              variant="link"
              :aria-label="expandRowLabel"
              :title="expandRowLabel"
              class="btn-icon-only"
              @click="fetchSrcDetails(row)"
            >
              <icon-chevron />
            </b-button>
          </template>
          <template #row-details="{ item }">
            <b-container fluid
              ><b-row>
                <b-col>
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
                </b-col>
              </b-row>
            </b-container>
          </template>
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
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import api from '@/store/api';
import i18n from '@/i18n';
import { omit } from 'lodash';
import PageTitle from '@/components/Global/PageTitle';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import TableDateFilter from '@/components/Global/TableDateFilter';
import InfoTooltip from '@/components/Global/InfoTooltip';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import TableFilterMixin from '@/components/Mixins/TableFilterMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
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
    IconLaunch,
    PageTitle,
    Search,
    TableCellCount,
    TableDateFilter,
    IconChevron,
    InfoTooltip,
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
    DataFormatterMixin,
  ],
  beforeRouteLeave(to, from, next) {
    // Hide loader if the user navigates to another page
    // before request is fulfilled.
    this.hideLoader();
    next();
  },
  data() {
    return {
      srcData: {},
      isBusy: true,
      fields: [
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
        },
        {
          key: 'date',
          label: this.$t('pagePostCodeLogs.table.created'),
          sortable: true,
        },
        {
          key: 'timeStampOffset',
          label: this.$t('pagePostCodeLogs.table.timeStampOffset'),
        },
        {
          key: 'bootCount',
          label: this.$t('pagePostCodeLogs.table.bootCount'),
        },
        {
          key: 'postCode',
          label: this.$t('pagePostCodeLogs.table.postCode'),
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
      return this.$store.getters['postCodeLogs/allPostCodes'].map(
        (postCodes) => {
          return {
            ...postCodes,
            actions: [
              {
                value: 'export',
                title: this.$t('pagePostCodeLogs.action.exportLogs'),
              },
              {
                value: 'download',
                title: this.$t('pagePostCodeLogs.action.downloadDetails'),
              },
            ],
          };
        }
      );
    },
    batchExportData() {
      return this.selectedRows.map((row) => omit(row, 'actions'));
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
    this.$store.dispatch('postCodeLogs/getPostCodesLogData').finally(() => {
      this.endLoader();
      this.isBusy = false;
    });
  },
  methods: {
    fetchSrcDetails(row) {
      this.toggleRowDetails(row);
      if (!row.detailsShowing) {
        const { timeStampOffset, uri, postCode } = row.item;
        if (!this.srcData[timeStampOffset]) {
          api
            .get(uri)
            .then((response) => this.generateSrcWords(response.data))
            .then((srcWords) =>
              this.$set(
                this.srcData,
                timeStampOffset,
                `${postCode.trim()} ${srcWords}`
              )
            )
            .catch(() =>
              this.errorToast(i18n.t('pagePostCodeLogs.toast.errorSrcFetch'))
            );
        }
      }
    },
    generateSrcWords(data) {
      const decodedData = Buffer.from(data, 'base64').toString('hex');
      const srcBulk = decodedData.substring(16, 80).toUpperCase();
      if (!isNaN(srcBulk) && !Number(srcBulk)) {
        return '';
      }
      let srcWords = '';
      for (let i = 0; i <= 56; i += 8) {
        srcWords += `${srcBulk.substring(i, i + 8)} `;
      }
      return srcWords.trim();
    },
    openConsoleWindow() {
      window.open(
        '#/console/post-codes',
        '_blank',
        'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=200,height=200'
      );
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onChangeDateTimeFilter({ fromDate, toDate }) {
      this.filterStartDate = fromDate;
      this.filterEndDate = toDate;
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    // Create export file name based on date and action
    exportFileNameByDate(value) {
      let date = new Date();
      date =
        date.toISOString().slice(0, 10) +
        '_' +
        date.toString().split(':').join('-').split(' ')[4];
      let fileName;
      if (value === 'download') {
        fileName = this.$t('pagePostCodeLogs.downloadFilePrefix');
      } else if (value === 'export') {
        fileName = this.$t('pagePostCodeLogs.exportFilePrefix');
      } else {
        fileName = this.$t('pagePostCodeLogs.allExportFilePrefix');
      }
      return fileName + date;
    },
  },
};
</script>
