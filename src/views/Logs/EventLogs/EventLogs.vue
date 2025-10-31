<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.eventLogs')" />
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4 searchStyle">
        <search
          :placeholder="$t('pageEventLogs.table.searchLogs')"
          data-test-id="eventLogs-input-searchLogs"
          @change-search="onChangeSearchInput"
          @clear-search="onClearSearchInput"
        />
        <div class="ml-sm-4 margin-style">
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
          sticky-header="75vh"
          show-empty
          :fields="fields"
          :items="filteredLogs"
          :empty-text="
            isBusy
              ? $t('global.table.loading')
              : $t('global.table.emptyMessage')
          "
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :per-page="perPage === 0 ? filteredLogs.length || 1 : perPage"
          :current-page="currentPage"
          :filter="searchFilter"
          @filtered="onFiltered"
          @row-selected="onRowSelected($event, filteredLogs.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <b-form-checkbox
              v-model="tableHeaderCheckboxModel"
              data-test-id="eventLogs-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              @change="
                onChangeHeaderCheckbox($refs.table, tableHeaderCheckboxModel)
              "
              @update:model-value="toggleAll"
            >
            </b-form-checkbox>
          </template>
          <template #cell(checkbox)="row">
            <b-form-checkbox
              v-model="row.item.rowSelected"
              :data-test-id="`eventLogs-checkbox-selectRow-${row.index}`"
              @change="
                toggleSelectRow(
                  $refs.table,
                  row.index,
                  row.item.rowSelected,
                  row.item,
                )
              "
            >
            </b-form-checkbox>
          </template>

          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <b-button
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
                      {{ $filters.formatDate(item.modifiedDate) }}
                      {{ $filters.formatTime(item.modifiedDate) }}
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
            <p class="mb-0">{{ $filters.formatDate(value) }}</p>
            <p class="mb-0">{{ $filters.formatTime(value) }}</p>
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
          class="b-pagination"
          first-number
          last-number
          :per-page="perPage === 0 ? filteredLogs.length || 1 : perPage"
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-event-logs"
        />
      </b-col>
    </b-row>
    <BModal
      v-model="openModal"
      :title="deleteTitle"
      :ok-title="$t('global.action.delete')"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk(deleteType)"
    >
      <p>
        {{ deleteMessage }}
      </p>
    </BModal>
  </b-container>
</template>

<script>
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import IconDownload from '@carbon/icons-vue/es/download/20';

import PageTitle from '@/components/Global/PageTitle.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableDateFilter from '@/components/Global/TableDateFilter.vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';

import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableFilter from '../../../components/Composables/useTableFilterComposable';
import usePaginationComposable from '../../../components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableSortComposable from '../../../components/Composables/useTableSortComposable';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import eventBus from '@/eventBus';

import stores from '../../../store';

export default {
  components: {
    IconDelete,
    IconTrashcan,
    IconChevron,
    IconDownload,
    InfoTooltip,
    PageTitle,
    Search,
    StatusIcon,
    TableCellCount,
    TableFilter,
    TableRowAction,
    TableToolbar,
    TableDateFilter,
  },
  beforeRouteLeave(to, from, next) {
    // Hide loader if the user navigates to another page
    // before request is fulfilled.
    eventBus.emit('clear-selected');
    useLoadingBar().hideLoader();
    next();
  },
  data() {
    return {
      toast: useToastComposable(),
      openModal: false,
      deleteMessage: '',
      deleteTitle: '',
      deleteType: '',
      uris: [],
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
      expandRowLabel: useTableRowExpandComposable().expandRowLabel,
      activeFilters: [],
      batchActions: [
        {
          value: 'delete',
          label: this.$t('global.action.delete'),
        },
      ],
      currentPage: usePaginationComposable().currentPage,
      filterStartDate: null,
      filterEndDate: null,
      itemsPerPageOptions: usePaginationComposable().itemsPerPageOptions,
      perPage: usePaginationComposable().perPage,
      searchFilter: useSearchFilterComposable().searchFilterInput,
      searchTotalFilteredRows: 0,
      selectedRows: useTableSelectableComposable().selectedRowsList,
      tableHeaderCheckboxModel:
        useTableSelectableComposable().tableHeaderCheckboxModel,
      tableHeaderCheckboxIndeterminate:
        useTableSelectableComposable().tableHeaderCheckboxIndeterminate,
    };
  },
  computed: {
    currentUser() {
      return stores.GlobalStore().currentUserGetter;
    },
    isServiceUser() {
      return stores.GlobalStore().isServiceUser;
    },
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.filteredLogs.length;
    },
    allLogs() {
      return stores.EventLogStore().eventlogsGetter;
    },
    filteredLogsByDate() {
      return useTableFilter().getFilteredTableDataByDate(
        this.allLogs,
        this.filterStartDate,
        this.filterEndDate,
      );
    },
    filteredLogs() {
      return useTableFilter().getFilteredTableData(
        this.filteredLogsByDate,
        this.activeFilters,
      );
    },
  },
  created() {
    (eventBus.on('clear-selected', () => {
      stores.EventLogStore().eventlogsGetter?.map((singleLog) => {
        singleLog.rowSelected = false;
      });
      useTableSelectableComposable().clearSelectedRowsOptions(this.$refs.table);
    }),
      useLoadingBar().startLoader());
    stores
      .EventLogStore()
      .initializeLogs()
      .then(() => {
        stores
          .EventLogStore()
          .getEventLogData()
          .finally(() => {
            this.checkForUserData();
            if (this.isServiceUser) {
              stores.EventLogStore().getCELogData();
            }
          });
        useLoadingBar().endLoader();
        this.isBusy = false;
      });
  },
  methods: {
    onChangeSearchInput(event) {
      this.searchFilter = event;
    },
    onClearSearchInput() {
      this.searchFilter = '';
    },
    toggleRow(row) {
      row.item.toggleDetails = !row.item.toggleDetails;
      useTableRowExpandComposable().toggleRowDetails(row);
    },
    downloadFile(pelJsonInfo) {
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
        'data:text/plain;charset=utf-8,' + encodeURIComponent(pelJsonInfo),
      );
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    checkForUserData() {
      if (!this.currentUser) {
        // this.$store.dispatch('userManagement/getUsers');
        stores.GlobalStore().getCurrentUser();
      }
    },
    reloadEventLogData() {
      if (this.isServiceUser) {
        stores.EventLogStore().getCELogData();
      }
      stores.EventLogStore().getEventLogData();
    },
    changelogStatus(row) {
      stores
        .EventLogStore()
        .updateEventLogStatus({
          uri: row.uri,
          status: row.status,
        })
        .then((success) => {
          this.toast.successToast(success);
        })
        .catch(({ message }) => this.toast.errorToast(message))
        .finally(() => this.reloadEventLogData());
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
      this.openModal = true;
      this.deleteMessage = this.$t('pageEventLogs.modal.deleteAllMessage');
      this.deleteTitle = this.$t('pageEventLogs.modal.deleteAllTitle');
      this.deleteType = 'all';
    },
    handleOk(value) {
      if (value === 'all') {
        let totalEntries = [...this.allLogs];
        let deletedEntries = 0;
        stores
          .EventLogStore()
          .deleteAllEventLogs(this.allLogs)
          .then(() => {
            useLoadingBar().startLoader();
            this.reloadEventLogData();
            setTimeout(() => {
              deletedEntries = totalEntries.length - this.allLogs.length;
              if (this.allLogs.length > 0) {
                this.toast.errorToast(
                  this.$tc(
                    'pageEventLogs.toast.errorDeleteGuardRecord',
                    this.allLogs.length,
                  ),
                );
                this.toast.errorToast(
                  this.$tc(
                    'pageEventLogs.toast.errorDelete',
                    this.allLogs.length,
                  ),
                );
              }
              if (deletedEntries > 0) {
                this.toast.successToast(
                  this.$tc('pageEventLogs.toast.successDelete', deletedEntries),
                );
              }
              useLoadingBar().endLoader();
            }, 5000);
          })
          .catch(
            ({ message }) => this.toast.errorToast(message),
            useLoadingBar().endLoader(),
          )
          .finally(() => (this.openModal = false));
      } else {
        if (this.selectedRows.length === this.allLogs.length) {
          let totalEntries = [...this.allLogs];
          let deletedEntries = 0;
          stores
            .EventLogStore()
            .deleteAllEventLogs(this.allLogs)
            .then(() => {
              useLoadingBar().startLoader();
              this.reloadEventLogData();
              setTimeout(() => {
                deletedEntries = totalEntries.length - this.allLogs.length;
                if (this.allLogs.length > 0) {
                  this.errorToast(
                    this.$tc(
                      'pageEventLogs.toast.errorDeleteGuardRecord',
                      this.allLogs.length,
                    ),
                  );
                  this.errorToast(
                    this.$tc(
                      'pageEventLogs.toast.errorDelete',
                      this.allLogs.length,
                    ),
                  );
                }
                if (deletedEntries > 0) {
                  this.toast.successToast(
                    this.$tc(
                      'pageEventLogs.toast.successDelete',
                      deletedEntries,
                    ),
                  );
                }
                useLoadingBar().endLoader();
              }, 5000);
            })
            .catch(
              ({ message }) => this.toast.errorToast(message),
              useLoadingBar().endLoader(),
            )
            .finally(() => (this.openModal = false));
        } else {
          this.deleteLogs(this.uris);
        }
      }
    },
    deleteLogs(uris) {
      stores
        .EventLogStore()
        .deleteEventLogs(uris)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            this.reloadEventLogData();
            if (type === 'success') {
              this.toast.successToast(message);
            } else if (type === 'error') {
              this.toast.errorToast(message);
            }
          });
        })
        .finally(() => {
          eventBus.emit('clear-selected');
          this.openModal = false;
        });
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onTableRowAction(action, { uri }) {
      if (action === 'delete') {
        this.uris = [uri];
        this.openModal = true;
        this.deleteMessage = this.$t('pageEventLogs.modal.deleteMessage');
        this.deleteTitle = this.$t('pageEventLogs.modal.deleteTitle');
        this.deleteType = 'selected';
      } else if (action === 'download') {
        //  download single log
        const pelJsonInfo = [];
        useLoadingBar().startLoader();
        stores
          .EventLogStore()
          .downloadLogData(uri)
          .then((returned) => {
            pelJsonInfo.push(returned);
          })
          .finally(() => {
            this.downloadFile(pelJsonInfo);
            useLoadingBar().endLoader();
          });
      }
    },
    onBatchAction(action) {
      if (action === 'delete') {
        this.uris = this.selectedRows.map((row) => row.uri);
        this.openModal = true;
        this.deleteMessage = this.$t(
          'pageEventLogs.modal.deleteMessage',
          this.selectedRows.length,
        );
        this.deleteTitle = this.$t(
          'pageEventLogs.modal.deleteTitle',
          this.selectedRows.length,
        );
        this.deleteType = 'selected';
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
      stores
        .EventLogStore()
        .resolveEventLogs(this.selectedRows)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') {
              this.reloadEventLogData();
              this.toast.successToast(message);
            } else if (type === 'error') {
              this.toast.errorToast(message);
            }
          });
          eventBus.emit('clear-selected');
        });
    },
    unresolveLogs() {
      stores
        .EventLogStore()
        .unresolveEventLogs(this.selectedRows)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') {
              this.reloadEventLogData();
              this.toast.successToast(message);
            } else if (type === 'error') {
              this.toast.errorToast(message);
            }
          });
          eventBus.emit('clear-selected');
        });
    },
    async downloadEventLogs(value) {
      const pelJsonInfo = [];
      this.toast.infoToast(this.$t('pageEventLogs.toast.infoStartDownload'));
      if (value === 'all') {
        //  download all logs
        let counter = 1;
        while (counter <= this.allLogs.length) {
          useLoadingBar().startLoader();
          await stores
            .EventLogStore()
            .downloadLogData(this.allLogs[counter - 1].uri)
            .then((returned) => {
              pelJsonInfo.push(returned);
              counter = counter + 1;
            })
            .finally(() => {
              if (pelJsonInfo.length === this.allLogs.length) {
                this.downloadFile(pelJsonInfo);
                useLoadingBar().endLoader();
              }
            });
        }
      } else {
        // several logs
        let counter = 1;
        while (counter <= this.selectedRows.length) {
          useLoadingBar().startLoader();
          await stores
            .EventLogStore()
            .downloadLogData(this.selectedRows[counter - 1].uri)
            .then((returned) => {
              pelJsonInfo.push(returned);
              counter = counter + 1;
            })
            .finally(() => {
              if (pelJsonInfo.length === this.selectedRows.length) {
                this.downloadFile(pelJsonInfo);
                useLoadingBar().endLoader();
              }
            });
        }
      }
    },
    getTotalRowCount(rows, perPage) {
      return usePaginationComposable().getTotalRowCount(rows, perPage);
    },
    dataFormatter(value) {
      return useDataFormatterGlobal().dataFormatter(value);
    },
    toggleAll(checked) {
      stores.EventLogStore().eventlogsGetter?.map((singleLog) => {
        singleLog.rowSelected = checked;
      });
    },
    statusIcon(value) {
      return useDataFormatterGlobal().statusIconValue(value);
    },
    toggleSelectRow(table, rowIndex, rowSelected, row) {
      return useTableSelectableComposable().toggleSelectRowById(
        table,
        rowIndex,
        rowSelected,
        row,
      );
    },
    onRowSelected(event, logsLength) {
      return useTableSelectableComposable().onRowSelected(event, logsLength);
    },
    onChangeHeaderCheckbox(table, tableHeaderCheckboxModel) {
      return useTableSelectableComposable().onChangeHeaderCheckbox(
        table,
        tableHeaderCheckboxModel,
      );
    },
  },
};
</script>
<style lang="scss" scoped>
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
  margin-left: 1.5rem;
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
