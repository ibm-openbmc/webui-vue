<template>
  <b-container fluid="xl">
    <page-title />
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pageEventLogs.table.searchLogs')"
          data-test-id="eventLogs-input-searchLogs"
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
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
        <b-button
          variant="link"
          :disabled="allLogs.length === 0"
          @click="deleteAllLogs"
        >
          <icon-delete /> {{ $t('global.action.deleteAll') }}
        </b-button>
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
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRows.length"
          :actions="batchActions"
          @clear-selected="clearSelectedRows($refs.table)"
          @batch-action="onBatchAction"
        >
          <template #toolbar-buttons>
            <b-button variant="primary" @click="resolveLogs">
              {{ $t('pageEventLogs.resolve') }}
            </b-button>
            <b-button variant="primary" @click="unresolveLogs">
              {{ $t('pageEventLogs.unresolve') }}
            </b-button>
            <b-button variant="primary" @click="downloadEventLogs">
              {{ $t('global.action.download') }}
            </b-button>
          </template>
        </table-toolbar>
        <b-table
          id="table-event-logs"
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
          :fields="fields"
          :items="filteredLogs"
          :sort-compare="onSortCompare"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :per-page="perPage"
          :current-page="currentPage"
          :filter="searchFilter"
          :busy="isBusy"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredLogs.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <b-form-checkbox
              v-model="tableHeaderCheckboxModel"
              data-test-id="eventLogs-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              @change="onChangeHeaderCheckbox($refs.table)"
            >
              <span class="sr-only">{{ $t('global.table.selectAll') }}</span>
            </b-form-checkbox>
          </template>
          <template #cell(checkbox)="row">
            <b-form-checkbox
              v-model="row.rowSelected"
              :data-test-id="`eventLogs-checkbox-selectRow-${row.index}`"
              @change="toggleSelectRow($refs.table, row.index)"
            >
              <span class="sr-only">{{ $t('global.table.selectItem') }}</span>
            </b-form-checkbox>
          </template>

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
            <b-container fluid>
              <b-row>
                <b-col>
                  <dl>
                    <!-- Event Id -->
                    <dt>
                      {{ $t('pageEventLogs.table.srcDetails') }}:
                      <info-tooltip
                        class="info-icon"
                        :title="$t('pageEventLogs.table.srcDetailsToolTip')"
                      >
                      </info-tooltip>
                    </dt>
                    <dd>{{ dataFormatter(item.eventId) }}</dd>
                  </dl>
                  <dl>
                    <!-- Resolution -->
                    <dt>{{ $t('pageEventLogs.table.resolution') }}:</dt>
                    <dd v-for="value in resolutionValue(item)" :key="value">
                      {{ dataFormatter(value) }}
                    </dd>
                  </dl>
                </b-col>
              </b-row>
              <div class="section-divider mb-3 mt-2"></div>
              <b-row>
                <b-col>
                  <dl>
                    <!-- Name -->
                    <dt>{{ $t('pageEventLogs.table.name') }}:</dt>
                    <dd>
                      {{
                        item.name === 'System Event Log Entry'
                          ? $t('pageEventLogs.table.systemEventLogEntry')
                          : dataFormatter(item.name)
                      }}
                    </dd>
                  </dl>
                  <dl>
                    <!-- Type -->
                    <dt>{{ $t('pageEventLogs.table.type') }}:</dt>
                    <dd>
                      {{
                        item.type === 'Event'
                          ? $t('pageEventLogs.table.typeValues.event')
                          : item.type === 'SEL'
                          ? $t('pageEventLogs.table.typeValues.sel')
                          : item.type === 'Oem'
                          ? $t('pageEventLogs.table.typeValues.oem')
                          : '--'
                      }}
                    </dd>
                  </dl>
                </b-col>
                <b-col>
                  <dl>
                    <!-- Modified date -->
                    <dt>{{ $t('pageEventLogs.table.modifiedDate') }}:</dt>
                    <dd v-if="item.modifiedDate">
                      {{ item.modifiedDate | formatDate }}
                      {{ item.modifiedDate | formatTime }}
                    </dd>
                    <dd v-else>--</dd>
                  </dl>
                </b-col>
              </b-row>
            </b-container>
          </template>

          <!-- Severity column -->
          <template #cell(severity)="{ value }">
            <status-icon v-if="value" :status="statusIcon(value)" />
            {{
              value === 'OK'
                ? $t('pageEventLogs.table.severityValues.ok')
                : value === 'Critical'
                ? $t('pageEventLogs.table.severityValues.critical')
                : $t('pageEventLogs.table.severityValues.warning')
            }}
          </template>
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ value | formatDate }}</p>
            <p class="mb-0">{{ value | formatTime }}</p>
          </template>

          <!-- Status column -->
          <template #cell(status)="row">
            <b-form-checkbox
              v-model="row.item.status"
              name="switch"
              switch
              @change="changelogStatus(row.item)"
            >
              <span v-if="row.item.status">
                {{ $t('pageEventLogs.resolved') }}
              </span>
              <span v-else> {{ $t('pageEventLogs.unresolved') }} </span>
            </b-form-checkbox>
          </template>
          <template #cell(filterByStatus)="{ value }">
            {{ value }}
          </template>

          <!-- Actions column -->
          <template #cell(actions)="row">
            <table-row-action
              v-for="(action, index) in row.item.actions"
              :key="index"
              :value="action.value"
              :title="action.title"
              :row-data="row.item"
              :data-test-id="`eventLogs-button-deleteRow-${row.index}`"
              @click-table-action="onTableRowAction($event, row.item)"
            >
              <template #icon>
                <icon-download v-if="action.value === 'download'" />
                <icon-trashcan v-if="action.value === 'delete'" />
              </template>
            </table-row-action>
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
          aria-controls="table-event-logs"
        />
      </b-col>
    </b-row>
    <!-- Modals -->
    <modal-pel-info :pel-data="pelData" />
  </b-container>
</template>

<script>
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import IconDownload from '@carbon/icons-vue/es/download/20';

import PageTitle from '@/components/Global/PageTitle';
import StatusIcon from '@/components/Global/StatusIcon';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import TableDateFilter from '@/components/Global/TableDateFilter';
import TableFilter from '@/components/Global/TableFilter';
import TableRowAction from '@/components/Global/TableRowAction';
import TableToolbar from '@/components/Global/TableToolbar';
import InfoTooltip from '@/components/Global/InfoTooltip';

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
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import TableSortMixin from '@/components/Mixins/TableSortMixin';
import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';
import ModalPelInfo from '../Modals/ModalPelInfo';

export default {
  components: {
    IconDelete,
    IconTrashcan,
    IconChevron,
    IconDownload,
    InfoTooltip,
    ModalPelInfo,
    PageTitle,
    Search,
    StatusIcon,
    TableCellCount,
    TableFilter,
    TableRowAction,
    TableToolbar,
    TableDateFilter,
  },
  mixins: [
    BVPaginationMixin,
    BVTableSelectableMixin,
    BVToastMixin,
    LoadingBarMixin,
    TableFilterMixin,
    DataFormatterMixin,
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
          label: this.$t('pageEventLogs.table.id'),
          sortable: true,
        },
        {
          key: 'severity',
          label: this.$t('pageEventLogs.table.severity'),
          sortable: true,
          tdClass: 'text-nowrap',
        },
        {
          key: 'date',
          label: this.$t('pageEventLogs.table.date'),
          sortable: true,
          tdClass: 'text-nowrap',
        },
        {
          key: 'description',
          label: this.$t('pageEventLogs.table.description'),
          tdClass: 'text-break',
        },
        {
          key: 'status',
          label: this.$t('pageEventLogs.table.status'),
        },
        {
          key: 'actions',
          sortable: false,
          label: '',
          tdClass: 'text-right text-nowrap',
        },
      ],
      tableFilters: [
        {
          key: 'severity',
          label: this.$t('pageEventLogs.table.severity'),
          values: [
            this.$t('pageEventLogs.table.severityValues.ok'),
            this.$t('pageEventLogs.table.severityValues.warning'),
            this.$t('pageEventLogs.table.severityValues.critical'),
          ],
        },
        {
          key: 'filterByStatus',
          label: this.$t('pageEventLogs.table.status'),
          values: [
            this.$t('pageEventLogs.resolved'),
            this.$t('pageEventLogs.unresolved'),
          ],
        },
      ],
      expandRowLabel,
      activeFilters: [],
      batchActions: [
        {
          value: 'delete',
          label: this.$t('global.action.delete'),
        },
      ],
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
      pelData: [],
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters['global/currentUser'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.filteredLogs.length;
    },
    allLogs() {
      return this.$store.getters['eventLog/allEvents'].map((event) => {
        return {
          ...event,
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
    this.$store.dispatch('eventLog/getEventLogData').finally(() => {
      this.checkForUserData();
      if (this.isServiceUser) {
        this.$store.dispatch('eventLog/getCELogData');
      }
      this.endLoader();
      this.isBusy = false;
    });
  },
  methods: {
    downloadFile(pelJsonInfo) {
      this.pelData = pelJsonInfo;
      this.$bvModal.show('modal-pel-info');
      let date = new Date();
      date =
        date.toISOString().slice(0, 10) +
        '_' +
        date.toString().split(':').join('-').split(' ')[4];
      let fileName;
      fileName = 'event_logs_' + date;
      var element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(pelJsonInfo)
      );
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    checkForUserData() {
      if (!this.currentUser) {
        this.$store.dispatch('userManagement/getUsers');
        this.$store.dispatch('global/getCurrentUser');
      }
    },
    reloadEventLogData() {
      if (this.isServiceUser) {
        this.$store.dispatch('eventLog/getCELogData');
      }
      this.$store.dispatch('eventLog/getEventLogData');
    },
    changelogStatus(row) {
      this.$store
        .dispatch('eventLog/updateEventLogStatus', {
          uri: row.uri,
          status: row.status,
        })
        .then((success) => {
          this.reloadEventLogData();
          this.successToast(success);
        })
        .catch(({ message }) => this.errorToast(message));
    },
    resolutionValue(item) {
      let value = item?.resolution?.split('\n');
      if (value) {
        value.pop();
      } else {
        value = [''];
      }
      return value;
    },
    deleteAllLogs() {
      this.$bvModal
        .msgBoxConfirm(this.$t('pageEventLogs.modal.deleteAllMessage'), {
          title: this.$t('pageEventLogs.modal.deleteAllTitle'),
          okTitle: this.$t('global.action.delete'),
          okVariant: 'danger',
          cancelTitle: this.$t('global.action.cancel'),
        })
        .then((deleteConfirmed) => {
          if (deleteConfirmed) {
            this.$store
              .dispatch('eventLog/deleteAllEventLogs', this.allLogs)
              .then((message) => {
                this.reloadEventLogData();
                this.successToast(message);
              })
              .catch(({ message }) => this.errorToast(message));
          }
        });
    },
    deleteLogs(uris) {
      this.$store
        .dispatch('eventLog/deleteEventLogs', uris)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            this.reloadEventLogData();
            if (type === 'success') {
              this.successToast(message);
            } else if (type === 'error') {
              this.errorToast(message);
            }
          });
        });
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onSortCompare(a, b, key) {
      if (key === 'severity') {
        return this.sortStatus(a, b, key);
      }
    },
    onTableRowAction(action, { id, name, uri }) {
      if (action === 'delete') {
        this.$bvModal
          .msgBoxConfirm(this.$tc('pageEventLogs.modal.deleteMessage'), {
            title: this.$tc('pageEventLogs.modal.deleteTitle'),
            okTitle: this.$t('global.action.delete'),
            cancelTitle: this.$t('global.action.cancel'),
          })
          .then((deleteConfirmed) => {
            if (deleteConfirmed) this.deleteLogs([uri]);
          });
      } else if (action === 'download') {
        //  download single log
        const pelJsonInfo = [];
        this.startLoader();
        if (name === 'System CE Log Entry') {
          this.$store
            .dispatch('eventLog/downloadCELogData', id)
            .then((returned) => {
              pelJsonInfo.push(returned);
            })
            .finally(() => {
              this.downloadFile(pelJsonInfo);
              this.endLoader();
            });
        } else {
          this.$store
            .dispatch('eventLog/downloadEventLogData', id)
            .then((returned) => {
              pelJsonInfo.push(returned);
            })
            .finally(() => {
              this.downloadFile(pelJsonInfo);
              this.endLoader();
            });
        }
      }
    },
    onBatchAction(action) {
      if (action === 'delete') {
        const uris = this.selectedRows.map((row) => row.uri);
        this.$bvModal
          .msgBoxConfirm(
            this.$tc(
              'pageEventLogs.modal.deleteMessage',
              this.selectedRows.length
            ),
            {
              title: this.$tc(
                'pageEventLogs.modal.deleteTitle',
                this.selectedRows.length
              ),
              okTitle: this.$t('global.action.delete'),
              cancelTitle: this.$t('global.action.cancel'),
            }
          )
          .then((deleteConfirmed) => {
            if (deleteConfirmed) {
              if (this.selectedRows.length === this.allLogs.length) {
                this.$store
                  .dispatch(
                    'eventLog/deleteAllEventLogs',
                    this.selectedRows.length
                  )
                  .then((message) => {
                    this.reloadEventLogData();
                    this.successToast(message);
                  })
                  .catch(({ message }) => this.errorToast(message));
              } else {
                this.deleteLogs(uris);
              }
            }
          });
      }
    },
    onChangeDateTimeFilter({ fromDate, toDate }) {
      this.filterStartDate = fromDate;
      this.filterEndDate = toDate;
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    resolveLogs() {
      this.$store
        .dispatch('eventLog/resolveEventLogs', this.selectedRows)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') {
              this.reloadEventLogData();
              this.successToast(message);
            } else if (type === 'error') {
              this.errorToast(message);
            }
          });
        });
    },
    unresolveLogs() {
      this.$store
        .dispatch('eventLog/unresolveEventLogs', this.selectedRows)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') {
              this.reloadEventLogData();
              this.successToast(message);
            } else if (type === 'error') {
              this.errorToast(message);
            }
          });
        });
    },
    async downloadEventLogs(value) {
      const pelJsonInfo = [];
      this.infoToast(this.$t('pageEventLogs.toast.infoStartDownload'));
      if (value === 'all') {
        //  download all logs
        let counter = 1;
        while (counter <= this.allLogs.length) {
          this.startLoader();
          if (this.allLogs[counter - 1].name === 'System CE Log Entry') {
            await this.$store
              .dispatch(
                'eventLog/downloadCELogData',
                this.allLogs[counter - 1].id
              )
              .then((returned) => {
                pelJsonInfo.push(returned);
                counter = counter + 1;
              })
              .finally(() => {
                if (pelJsonInfo.length === this.allLogs.length) {
                  this.downloadFile(pelJsonInfo);
                  this.endLoader();
                }
              });
          } else {
            await this.$store
              .dispatch(
                'eventLog/downloadEventLogData',
                this.allLogs[counter - 1].id
              )
              .then((returned) => {
                pelJsonInfo.push(returned);
                counter = counter + 1;
              })
              .finally(() => {
                if (pelJsonInfo.length === this.allLogs.length) {
                  this.downloadFile(pelJsonInfo);
                  this.endLoader();
                }
              });
          }
        }
      } else {
        // several logs
        let counter = 1;
        while (counter <= this.selectedRows.length) {
          this.startLoader();
          if (this.selectedRows[counter - 1].name === 'System CE Log Entry') {
            await this.$store
              .dispatch(
                'eventLog/downloadCELogData',
                this.selectedRows[counter - 1].id
              )
              .then((returned) => {
                pelJsonInfo.push(returned);
                counter = counter + 1;
              })
              .finally(() => {
                if (pelJsonInfo.length === this.selectedRows.length) {
                  this.downloadFile(pelJsonInfo);
                  this.endLoader();
                }
              });
          } else {
            await this.$store
              .dispatch(
                'eventLog/downloadEventLogData',
                this.selectedRows[counter - 1].id
              )
              .then((returned) => {
                pelJsonInfo.push(returned);
                counter = counter + 1;
              })
              .finally(() => {
                if (pelJsonInfo.length === this.selectedRows.length) {
                  this.downloadFile(pelJsonInfo);
                  this.endLoader();
                }
              });
          }
        }
      }
    },
  },
};
</script>
