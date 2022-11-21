<template>
  <b-container fluid="xl">
    <page-title />
    <b-row v-if="selectedDumpType">
      <b-col md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div class="font-weight-bold">
            {{ $t(`pageDumps.alert.${selectedDumpType}DumpHeading`) }}
          </div>
          <p>
            {{ $t(`pageDumps.alert.${selectedDumpType}DumpMessage`) }}
            <span v-if="selectedDumpType === 'bmc'">
              {{
                hmcManaged === 'Disabled'
                  ? $t(`pageDumps.alert.refreshMessage`)
                  : ''
              }}
            </span>
            <span v-else>
              {{ $t(`pageDumps.alert.refreshMessage`) }}
            </span>
          </p>
          <p v-if="selectedDumpType === 'resource'">
            {{ $t(`pageDumps.alert.resourceDumpMessage2`) }}
          </p>
          <p v-if="selectedDumpType === 'bmc' && hmcManaged === 'Enabled'">
            {{ $t(`pageDumps.alert.bmcDumpMessageHmcEnabled`) }}
          </p>
          <p v-if="selectedDumpType === 'system'">
            {{ $t(`pageDumps.alert.systemDumpMessageHmc${hmcManaged}`) }}
          </p>
        </alert>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="6" lg="5" xl="4">
        <page-section :section-title="$t('pageDumps.initiateDump')">
          <dumps-form @updateDumpInfo="updateDumpInfo" />
        </page-section>
      </b-col>
    </b-row>
    <b-row>
      <b-col xl="10">
        <page-section :section-title="$t('pageDumps.dumpsAvailableOnBmc')">
          <b-row class="align-items-start">
            <b-col sm="8" xl="6" class="d-sm-flex align-items-end">
              <search
                :placeholder="$t('pageDumps.table.searchDumps')"
                @change-search="onChangeSearchInput"
                @clear-search="onClearSearchInput"
              />
              <div class="ml-sm-4">
                <table-cell-count
                  :filtered-items-count="filteredRows"
                  :total-number-of-cells="allDumps.length"
                ></table-cell-count>
              </div>
            </b-col>
            <b-col sm="8" md="7" xl="6">
              <table-date-filter @change="onChangeDateTimeFilter" />
            </b-col>
          </b-row>
          <b-row>
            <b-col class="text-right">
              <table-filter
                :filters="tableFilters"
                @filter-change="onFilterChange"
              />
            </b-col>
          </b-row>
          <table-toolbar
            :selected-items-count="selectedRows.length"
            :actions="batchActions"
            @clear-selected="clearSelectedRows($refs.table)"
            @batch-action="onTableBatchAction"
          />
          <b-table
            ref="table"
            show-empty
            hover
            sort-icon-left
            no-sort-reset
            sort-desc
            selectable
            no-select-on-click
            responsive="md"
            sort-by="dateTime"
            :fields="fields"
            :items="filteredDumps"
            :empty-text="$t('global.table.emptyMessage')"
            :empty-filtered-text="$t('global.table.emptySearchMessage')"
            :per-page="perPage"
            :current-page="currentPage"
            :filter="searchFilter"
            :busy="isBusy"
            @filtered="onFiltered"
            @row-selected="onRowSelected($event, filteredTableItems.length)"
          >
            <!-- Date and Time column -->
            <template #cell(dateTime)="{ value }">
              <p class="mb-0">{{ value | formatDate }}</p>
              <p class="mb-0">{{ value | formatTime }}</p>
            </template>

            <!-- Size column -->
            <template #cell(size)="{ value }">
              {{ convertBytesToMegabytes(value) }} MB
            </template>

            <!-- Actions column -->
            <template #cell(actions)="row">
              <table-row-action
                v-for="(action, index) in row.item.actions"
                :key="index"
                :value="action.value"
                :title="action.title"
                :download-location="row.item.data"
                :export-name="exportFileName(row)"
                @click-table-action="onTableRowAction($event, row.item)"
              >
                <template #icon>
                  <icon-download v-if="action.value === 'download'" />
                  <icon-delete v-if="action.value === 'delete'" />
                </template>
              </table-row-action>
            </template>
          </b-table>
        </page-section>
      </b-col>
    </b-row>
    <!-- Table pagination -->
    <b-row>
      <b-col sm="6" xl="5">
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
      <b-col sm="6" xl="5">
        <b-pagination
          v-model="currentPage"
          first-number
          last-number
          :per-page="perPage"
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-dump-entries"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Alert from '@/components/Global/Alert';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import DumpsForm from './DumpsForm';
import PageSection from '@/components/Global/PageSection';
import PageTitle from '@/components/Global/PageTitle';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import TableDateFilter from '@/components/Global/TableDateFilter';
import TableRowAction from '@/components/Global/TableRowAction';
import TableToolbar from '@/components/Global/TableToolbar';
import BVTableSelectableMixin, {
  selectedRows,
} from '@/components/Mixins/BVTableSelectableMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import BVPaginationMixin, {
  currentPage,
  perPage,
  itemsPerPageOptions,
} from '@/components/Mixins/BVPaginationMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';
import TableFilter from '@/components/Global/TableFilter';
import TableFilterMixin from '@/components/Mixins/TableFilterMixin';

export default {
  components: {
    Alert,
    DumpsForm,
    IconDelete,
    IconDownload,
    PageSection,
    PageTitle,
    Search,
    TableCellCount,
    TableDateFilter,
    TableRowAction,
    TableToolbar,
    TableFilter,
  },
  mixins: [
    BVTableSelectableMixin,
    BVToastMixin,
    BVPaginationMixin,
    LoadingBarMixin,
    SearchFilterMixin,
    TableFilterMixin,
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
      selectedDumpType: null,
      fields: [
        {
          key: 'id',
          label: this.$t('pageDumps.table.id'),
          sortable: true,
        },
        {
          key: 'dateTime',
          label: this.$t('pageDumps.table.dateAndTime'),
          sortable: true,
        },
        {
          key: 'dumpType',
          label: this.$t('pageDumps.table.dumpType'),
          sortable: true,
        },
        {
          key: 'size',
          label: this.$t('pageDumps.table.size'),
          sortable: true,
        },
        {
          key: 'actions',
          sortable: false,
          label: '',
          tdClass: 'text-right text-nowrap',
        },
      ],
      batchActions: [
        {
          value: 'delete',
          label: this.$t('global.action.delete'),
        },
      ],
      tableFilters: [
        {
          key: 'dumpType',
          label: this.$t('pageDumps.table.dumpType'),
          values: [
            this.$t('pageDumps.table.filter.bmcDumpEntry'),
            this.$t('pageDumps.table.filter.hostbootDumpEntry'),
            this.$t('pageDumps.table.filter.resourceDumpEntry'),
            this.$t('pageDumps.table.filter.systemDumpEntry'),
          ],
        },
      ],
      activeFilters: [],
      currentPage: currentPage,
      filterEndDate: null,
      filterStartDate: null,
      itemsPerPageOptions: itemsPerPageOptions,
      perPage: perPage,
      searchFilter,
      searchTotalFilteredRows: 0,
      selectedRows,
    };
  },
  computed: {
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.filteredDumps.length;
    },
    allDumps() {
      return this.$store.getters['dumps/allDumps'].map((item) => {
        return {
          ...item,
          actions: [
            {
              value: 'download',
              title: this.$t('global.action.download'),
            },
            {
              value: 'delete',
              title: this.$t('global.action.delete'),
            },
          ],
        };
      });
    },
    filteredDumpsByDate() {
      return this.getFilteredTableDataByDate(
        this.allDumps,
        this.filterStartDate,
        this.filterEndDate,
        'dateTime'
      );
    },
    filteredDumps() {
      return this.getFilteredTableData(
        this.filteredDumpsByDate,
        this.activeFilters
      );
    },
    isInPhypStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
    hmcManaged() {
      return this.$store.getters['resourceMemory/hmcManaged'];
    },
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('dumps/getAllDumps'),
      this.$store.dispatch('userManagement/getUsers'),
      this.$store.dispatch('resourceMemory/getHmcManaged'),
      this.$store.dispatch('global/getBootProgress'),
    ]).finally(() => {
      this.endLoader();
      this.isBusy = false;
    });
  },
  methods: {
    updateDumpInfo(selectedDumpType) {
      this.selectedDumpType = selectedDumpType;
    },
    convertBytesToMegabytes(bytes) {
      return parseFloat((bytes / 1000000).toFixed(3));
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    onChangeDateTimeFilter({ fromDate, toDate }) {
      this.filterStartDate = fromDate;
      this.filterEndDate = toDate;
    },
    onTableRowAction(action, dump) {
      if (action === 'delete') {
        this.$bvModal
          .msgBoxConfirm(this.$tc('pageDumps.modal.deleteDumpConfirmation'), {
            title: this.$tc('pageDumps.modal.deleteDump'),
            okTitle: this.$tc('pageDumps.modal.deleteDump'),
            cancelTitle: this.$t('global.action.cancel'),
          })
          .then((deleteConfrimed) => {
            if (deleteConfrimed) {
              this.$store
                .dispatch('dumps/deleteDumps', [dump])
                .then((messages) => {
                  messages.forEach(({ type, message }) => {
                    if (type === 'success') {
                      this.successToast(message);
                    } else if (type === 'error') {
                      this.errorToast(message);
                    }
                  });
                });
            }
          });
      }
    },
    onTableBatchAction(action) {
      if (action === 'delete') {
        this.$bvModal
          .msgBoxConfirm(
            this.$tc(
              'pageDumps.modal.deleteDumpConfirmation',
              this.selectedRows.length
            ),
            {
              title: this.$tc(
                'pageDumps.modal.deleteDump',
                this.selectedRows.length
              ),
              okTitle: this.$tc(
                'pageDumps.modal.deleteDump',
                this.selectedRows.length
              ),
              cancelTitle: this.$t('global.action.cancel'),
            }
          )
          .then((deleteConfrimed) => {
            if (deleteConfrimed) {
              if (this.selectedRows.length === this.dumps.length) {
                this.$store
                  .dispatch('dumps/deleteAllDumps')
                  .then((success) => this.successToast(success))
                  .catch(({ message }) => this.errorToast(message));
              } else {
                this.$store
                  .dispatch('dumps/deleteDumps', this.selectedRows)
                  .then((messages) => {
                    messages.forEach(({ type, message }) => {
                      if (type === 'success') {
                        this.successToast(message);
                      } else if (type === 'error') {
                        this.errorToast(message);
                      }
                    });
                  });
              }
            }
          });
      }
    },
    exportFileName(row) {
      let filename = row.item.dumpType + '_' + row.item.id;
      filename = filename.replace(RegExp(' ', 'g'), '_');
      return filename;
    },
  },
};
</script>
