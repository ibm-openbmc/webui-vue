<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.deconfigurationRecords')"
      :description="$t('pageDeconfigurationRecords.pageDescription.description')"
      :link="$t('pageDeconfigurationRecords.pageDescription.link')"
      to="/settings/hardware-deconfiguration"
    />
    <b-row>
      <b-col class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
        <b-button
          variant="link"
          :disabled="allEntries.length === 0 || !isServerOff()"
          @click="clearAllEntries"
        >
          <icon-delete /> {{ $t('global.action.clearAll') }}
        </b-button>
        <b-button
          variant="primary"
          :class="{ disabled: allEntries.length === 0 }"
          :download="exportFileNameByDate()"
          :href="href"
        >
          <icon-export /> {{ $t('global.action.exportAll') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRows.length"
          @clear-selected="clearSelectedRows($refs.table)"
        >
          <template #toolbar-buttons>
            <table-toolbar-export :data="batchExportData" :file-name="exportFileNameByDate()" />
          </template>
        </table-toolbar>
        <b-table
          id="table-deconfiguration-records"
          ref="table"
          responsive="xl"
          selectable
          no-select-on-click
          sort-icon-left
          hover
          no-sort-reset
          sort-desc
          show-empty
          sort-by="id"
          sort-desc.sync="status"
          :fields="fields"
          :items="filteredLogs"
          :empty-text="$t('global.table.emptyMessage')"
          :current-page="currentPage"
          :per-page="perPage"
          @row-selected="onRowSelected($event, filteredLogs.length)"
        >
          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <b-button
              variant="link"
              :aria-label="expandRowLabel"
              :title="expandRowLabel"
              class="btn-icon-only"
              @click="toggleRowDetails(row)"
            >
              <icon-chevron />
            </b-button>
          </template>
          <template #row-details="{ item }">
            <b-container fluid="xl">
              <b-row>
                <b-col cols="4">
                  <dl>
                    <!-- Event Id -->
                    <dt>
                      {{ $t('pageDeconfigurationRecords.table.srcDetails') }}
                      <info-tooltip
                        class="info-icon"
                        :title="$t('pageDeconfigurationRecords.table.srcDetailsToolTip')"
                      >
                      </info-tooltip>
                    </dt>
                    <dd>{{ dataFormatter(item.srcDetails) }}</dd>
                  </dl>
                </b-col>
                <b-col cols="4">
                  <dl>
                    <dt>
                      {{ $t('pageDeconfigurationHardware.table.locationCode') }}
                    </dt>
                    <dd>{{ dataFormatter(item.location) }}</dd>
                  </dl>
                </b-col>
                <b-col v-if="item.additionalDataUri" cols="4" class="text-nowrap">
                  <b-button
                    class="btn btn-secondary"
                    target="_blank"
                    @click="downloadLog(item.oemPelAttachment, item.date)"
                  >
                    <icon-download />
                    {{ $t('pageDeconfigurationRecords.additionalDataUri') }}
                  </b-button>
                </b-col>
              </b-row>
            </b-container>
          </template>
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <b-form-checkbox
              v-model="tableHeaderCheckboxModel"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              @change="onChangeHeaderCheckbox($refs.table)"
            >
              <span class="sr-only">{{ $t('global.table.selectAll') }}</span>
            </b-form-checkbox>
          </template>
          <template #cell(checkbox)="row">
            <b-form-checkbox
              v-model="row.rowSelected"
              @change="toggleSelectRow($refs.table, row.index)"
            >
              <span class="sr-only">{{ $t('global.table.selectItem') }}</span>
            </b-form-checkbox>
          </template>
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ value | formatDate }}</p>
            <p class="mb-0">{{ value | formatTime }}</p>
          </template>
          <template #cell(severity)="{ value }">
            {{
              value === 'Critical'
                ? $t('pageDeconfigurationRecords.severityValues.fatal')
                : value === 'Warning'
                  ? $t('pageDeconfigurationRecords.severityValues.predictive')
                  : value === 'OK'
                    ? $t('pageDeconfigurationRecords.severityValues.manual')
                    : '--'
            }}
          </template>
          <!-- Status column -->
          <template #cell(status)="row">
            <span v-if="row.item.status">
              {{ $t('pageDeconfigurationRecords.resolved') }}
            </span>
            <span v-else>
              {{ $t('pageDeconfigurationRecords.unresolved') }}
            </span>
          </template>
          <template #cell(filterByStatus)="{ value }">
            {{ value }}
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
          :total-rows="getTotalRowCount(filteredLogs.length)"
          aria-controls="table-event-logs"
        />
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import { omit } from 'lodash';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import IconExport from '@carbon/icons-vue/es/document--export/20';
import InfoTooltip from '@/components/Global/InfoTooltip';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import PageTitle from '@/components/Global/PageTitle';
import TableFilter from '@/components/Global/TableFilter';
import TableFilterMixin from '@/components/Mixins/TableFilterMixin';
import TableToolbar from '@/components/Global/TableToolbar';
import TableToolbarExport from '@/components/Global/TableToolbarExport';

import BVTableSelectableMixin, {
  selectedRows,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} from '@/components/Mixins/BVTableSelectableMixin';
import BVPaginationMixin, {
  currentPage,
  perPage,
  itemsPerPageOptions,
} from '@/components/Mixins/BVPaginationMixin';
import TableRowExpandMixin, { expandRowLabel } from '@/components/Mixins/TableRowExpandMixin';

export default {
  components: {
    IconChevron,
    IconDelete,
    IconDownload,
    IconExport,
    InfoTooltip,
    PageTitle,
    TableFilter,
    TableToolbar,
    TableToolbarExport,
  },
  mixins: [
    BVPaginationMixin,
    BVTableSelectableMixin,
    BVToastMixin,
    DataFormatterMixin,
    LoadingBarMixin,
    TableFilterMixin,
    TableRowExpandMixin,
  ],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      expandRowLabel,
      fields: [
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
        },
        {
          key: 'checkbox',
          sortable: false,
        },
        {
          key: 'id',
          label: this.$t('pageDeconfigurationRecords.table.id'),
          sortable: true,
        },
        {
          key: 'eventID',
          label: this.$t('pageDeconfigurationRecords.table.eventId'),
          sortable: true,
        },
        {
          key: 'date',
          label: this.$t('pageDeconfigurationRecords.table.date'),
          sortable: true,
        },
        {
          key: 'severity',
          label: this.$t('pageDeconfigurationRecords.table.severity'),
          sortable: true,
        },
        {
          key: 'description',
          label: this.$t('pageDeconfigurationRecords.table.resource'),
          sortable: false,
        },
        {
          key: 'status',
          label: this.$t('pageDeconfigurationRecords.table.status'),
          sortable: false,
        },
      ],
      tableFilters: [
        {
          key: 'filterByStatus',
          label: this.$t('pageDeconfigurationRecords.table.status'),
          values: [this.$t('pageEventLogs.resolved'), this.$t('pageEventLogs.unresolved')],
        },
      ],
      activeFilters: [],
      selectedRows: selectedRows,
      tableHeaderCheckboxModel: tableHeaderCheckboxModel,
      tableHeaderCheckboxIndeterminate: tableHeaderCheckboxIndeterminate,
      currentPage: currentPage,
      perPage: perPage,
      itemsPerPageOptions: itemsPerPageOptions,
    };
  },
  computed: {
    href() {
      return `data:text/json;charset=utf-8,${this.exportAllRecords()}`;
    },
    allEntries() {
      return this.$store.getters['deconfigurationRecords/deconfigRecords'];
    },
    recordItems() {
      return this.$store.getters['deconfigurationRecords/deconfigRecords'];
    },
    batchExportData() {
      return this.selectedRows.map((row) => omit(row, 'actions'));
    },
    filteredLogs() {
      return this.getFilteredTableData(this.recordItems, this.activeFilters);
    },
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
  },
  created() {
    this.startLoader();
    this.$store
      .dispatch('deconfigurationRecords/getDeconfigurationRecordInfo')
      .finally(() => this.endLoader());
  },
  methods: {
    isServerOff() {
      return this.serverStatus === 'off';
    },
    clearAllEntries() {
      this.$bvModal
        .msgBoxConfirm(this.$t('pageDeconfigurationRecords.modal.deleteAllMessage'), {
          title: this.$t('pageDeconfigurationRecords.modal.deleteAllTitle'),
          okTitle: this.$t('global.action.delete'),
          okVariant: 'danger',
          cancelTitle: this.$t('global.action.cancel'),
        })
        .then((deleteConfirmed) => {
          if (deleteConfirmed) {
            this.$store
              .dispatch('deconfigurationRecords/clearAllEntries', this.allEntries)
              .then((message) => this.successToast(message))
              .catch(({ message }) => this.errorToast(message));
          }
        });
    },
    deleteRecords(uris) {
      this.$store.dispatch('deconfigurationRecords/deleteRecords', uris).then((messages) => {
        messages.forEach(({ type, message }) => {
          if (type === 'success') {
            this.successToast(message);
          } else if (type === 'error') {
            this.errorToast(message);
          }
        });
      });
    },
    downloadLog(uri, date) {
      this.startLoader();
      this.$store
        .dispatch('deconfigurationRecords/downloadLog', {
          uri: uri,
          date: date,
        })
        .then((message) => this.successToast(...message))
        .catch(({ message }) => this.successToast(message))
        .finally(() => this.endLoader());
    },
    // Create export file name based on date
    exportFileNameByDate(value) {
      let date = new Date();
      date =
        date.toISOString().slice(0, 10) + '_' + date.toString().split(':').join('-').split(' ')[4];
      let fileName;
      if (value === 'export') {
        fileName = 'deconfig_record_';
      } else {
        fileName = 'all_deconfig_records_';
      }
      return fileName + date;
    },
    exportAllRecords() {
      {
        return this.$store.getters['deconfigurationRecords/deconfigRecords'].map((records) => {
          const allDeconfigRecordsString = JSON.stringify(records);
          return allDeconfigRecordsString;
        });
      }
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onTableRowAction(action, { uri }) {
      if (action === 'delete') {
        this.$bvModal
          .msgBoxConfirm(this.$tc('pageDeconfigurationRecords.modal.deleteMessage'), {
            title: this.$tc('pageDeconfigurationRecords.modal.deleteTitle'),
            okTitle: this.$t('global.action.delete'),
            cancelTitle: this.$t('global.action.cancel'),
          })
          .then((deleteConfirmed) => {
            if (deleteConfirmed) this.deleteRecords([uri]);
          });
      }
    },
  },
};
</script>
