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
          :variant="allLogs.length === 0 ? 'light' : 'primary'"
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
          :table="$refs.table"
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
          :items="paginatedLogs"
          @row-selected="onRowSelected($event, paginatedLogs.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <b-form-checkbox
              v-model="tableHeaderCheckboxModel"
              aria-label="checkbox-head"
              data-test-id="eventLogs-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              @change="
                onChangeHeaderCheckbox($refs.table, tableHeaderCheckboxModel)
              "
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </b-form-checkbox>
          </template>
          <template #cell(checkbox)="row">
            <b-form-checkbox
              v-model="row.item.rowSelected"
              aria-label="checkbox"
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
              <span class="visually-hidden">checkbox</span>
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
                <icon-download
                  v-if="action.value === 'download'"
                  aria-label="download"
                />
                <icon-trashcan
                  v-if="action.value === 'delete'"
                  aria-label="delete"
                />
              </template>
            </table-row-action>
          </template>
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else-if="searchFilter">
              {{ $t('global.table.emptySearchMessage') }}
            </span>
            <span v-else>
              {{ $t('global.table.emptyMessage') }}
            </span>
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
          :total-rows="filteredRows"
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
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useTableFilter from '../../../components/Composables/useTableFilterComposable';
import usePaginationComposable from '../../../components/Composables/usePaginationComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import { computed, nextTick, ref, watch } from 'vue';
import eventBus from '@/eventBus';
import { useEventLogs } from '@/api/composables/useEventLogs';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';

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
  setup() {
    const {
      allLogs: eventLogsData,
      isLoading,
      isFetching,
      deleteAllLogs: deleteAllLogsApi,
      deleteEventLogs: deleteEventLogsApi,
      resolveEventLogs: resolveEventLogsApi,
      unresolveEventLogs: unresolveEventLogsApi,
      updateEventLogStatus: updateEventLogStatusApi,
      downloadLogData,
      refetchAll,
      refetchCELogs,
    } = useEventLogs();

    usePageLoadingBar(isFetching);
    const { startLoader, endLoader } = useLoadingBar();
    const { perPage } = usePaginationComposable();

    // Reactive filter state — must live in setup() so usePaginatedData can
    // watch them as proper Vue refs.
    const activeFilters = ref([]);
    const filterStartDate = ref(null);
    const filterEndDate = ref(null);
    const searchFilter = ref(useSearchFilterComposable().searchFilterInput);
    const perPageRef = ref(perPage);

    const allLogs = computed(() => eventLogsData.value || []);

    const filteredLogs = computed(() => {
      if (!allLogs.value) return [];
      let data = useTableFilter().getFilteredTableDataByDate(
        allLogs.value,
        filterStartDate.value,
        filterEndDate.value,
      );
      data = useTableFilter().getFilteredTableData(data, activeFilters.value);
      if (searchFilter.value) {
        const search = searchFilter.value.toLowerCase();
        data = data.filter((item) => {
          const expandColumn = ['eventId', 'name', 'type', 'modifiedDate'];
          const searchableFields = [
            'expandRow',
            'checkbox',
            'id',
            'severity',
            'date',
            'description',
            'status',
            'actions',
          ]
            .filter((key) => key in item)
            .map((key) => item[key])
            .concat(expandColumn.map((key) => item[key]));
          return searchableFields.some((field) =>
            String(field || '')
              .toLowerCase()
              .includes(search),
          );
        });
      }
      return data;
    });

    const pagination = usePaginatedData({
      data: filteredLogs,
      pageSize: perPageRef.value,
      initialPage: 1,
    });

    // Keep pageSize in sync with the perPage select
    watch(perPageRef, (newSize) => {
      pagination.pageSize.value = newSize;
    });

    return {
      eventLogsData,
      isLoading,
      deleteAllLogsApi,
      deleteEventLogsApi,
      resolveEventLogsApi,
      unresolveEventLogsApi,
      updateEventLogStatusApi,
      downloadLogData,
      refetchAll,
      refetchCELogs,
      // Pagination
      pagination,
      perPageRef,
      // Filter state (exposed so data() methods / template can reach them)
      activeFilters,
      filterStartDate,
      filterEndDate,
      searchFilter,
      // Computed
      filteredLogs,
      paginatedLogs: pagination.paginatedData,
      currentPage: pagination.currentPage,
      filteredRows: pagination.totalItems,
    };
  },
  data() {
    const rowExpandComposable = useTableRowExpandComposable();
    const { itemsPerPageOptions, perPage } = usePaginationComposable();

    return {
      toast: useToastComposable(),
      rowExpandComposable,
      openModal: false,
      deleteMessage: '',
      deleteTitle: '',
      deleteType: '',
      uris: [],
      fields: [
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'checkbox',
          sortable: false,
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'id',
          label: this.$t('pageEventLogs.table.id'),
          sortable: true,
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'severity',
          label: this.$t('pageEventLogs.table.severity'),
          sortable: true,
          tdClass: 'text-nowrap',
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'date',
          label: this.$t('pageEventLogs.table.date'),
          sortable: true,
          tdClass: 'text-nowrap',
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'description',
          label: this.$t('pageEventLogs.table.description'),
          tdClass: 'text-break',
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'status',
          label: this.$t('pageEventLogs.table.status'),
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
        },
        {
          key: 'actions',
          sortable: false,
          label: '',
          tdClass: 'text-right text-nowrap',
          thAttr: { scope: 'col' },
          tdAttr: { scope: null },
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
      expandRowLabel: rowExpandComposable.expandRowLabel,
      batchActions: [
        {
          value: 'delete',
          label: this.$t('global.action.delete'),
        },
      ],
      itemsPerPageOptions,
      perPage,
      selectedRows: useTableSelectableComposable().selectedRowsList,
      tableHeaderCheckboxModel:
        useTableSelectableComposable().tableHeaderCheckboxModel,
      tableHeaderCheckboxIndeterminate:
        useTableSelectableComposable().tableHeaderCheckboxIndeterminate,
      expandColumn: ['eventId', 'name', 'type', 'modifiedDate'],
    };
  },
  computed: {
    currentUser() {
      return stores.GlobalStore().currentUserGetter;
    },
    isServiceUser() {
      return stores.GlobalStore().isServiceUser;
    },
    allLogs() {
      return this.eventLogsData || [];
    },
    isBusy() {
      return this.isLoading;
    },
  },
  watch: {
    // Keep perPageRef (setup ref) in sync with the perPage data property
    perPage(newSize) {
      this.perPageRef = newSize;
    },
    filteredLogs: function (value) {
      this.$nextTick(() => {
        document
          .querySelectorAll('.b-table-sortable-column svg')
          .forEach((svg) => {
            svg.setAttribute('aria-hidden', 'true');
          });
        if (!value.length) {
          document
            .querySelector('tr.b-table-empty-slot td[scope]')
            ?.removeAttribute('scope');
        }
      });
    },
  },
  created() {
    eventBus.on('clear-selected', () => {
      this.allLogs?.forEach((singleLog) => {
        singleLog.rowSelected = false;
      });
      useTableSelectableComposable().clearSelectedRowsOptions(this.$refs.table);
    });

    this.checkForUserData();
    if (this.isServiceUser) {
      this.refetchCELogs();
    }
  },
  methods: {
    onChangeSearchInput(event) {
      this.searchFilter = event;
    },
    onClearSearchInput() {
      this.searchFilter = '';
    },
    toggleRow(row) {
      this.rowExpandComposable.toggleRow(row);
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
      this.refetchAll();
    },
    async changelogStatus(row) {
      // Capture the new (toggled) value before the API call so we can revert on
      // failure.  v-model has already flipped row.status by the time this method
      // runs, so the previous value is the opposite.
      const newStatus = row.status;
      let toastShown = false;
      try {
        await this.updateEventLogStatusApi({
          log: row,
          onSuccessCallback: () => {
            if (!toastShown) {
              this.toast.successToast(
                newStatus
                  ? this.$t('pageEventLogs.toast.successResolveLogs', 1)
                  : this.$t('pageEventLogs.toast.successUnresolveLogs', 1),
              );
              toastShown = true;
            }
          },
        });
      } catch (error) {
        // Revert the toggle to its original state on failure
        row.status = !newStatus;
        this.toast.errorToast(error.message);
      }
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
    async handleOk(value) {
      if (value === 'all') {
        const totalEntries = [...this.allLogs];
        let deletedEntries = 0;
        try {
          await this.deleteAllLogsApi();
          useLoadingBar().startLoader();
          this.reloadEventLogData();
          setTimeout(() => {
            deletedEntries = totalEntries.length - this.allLogs.length;
            if (this.allLogs.length > 0) {
              this.toast.errorToast(
                this.$t(
                  'pageEventLogs.toast.errorDeleteGuardRecord',
                  this.allLogs.length,
                ),
              );
              this.toast.errorToast(
                this.$t('pageEventLogs.toast.errorDelete', this.allLogs.length),
              );
            }
            if (deletedEntries > 0) {
              this.toast.successToast(
                this.$t('pageEventLogs.toast.successDelete', deletedEntries),
              );
            }
            useLoadingBar().endLoader();
          }, 8000);
        } catch (error) {
          this.toast.errorToast(error.message);
          useLoadingBar().endLoader();
        } finally {
          eventBus.emit('clear-selected');
          this.openModal = false;
        }
      } else {
        if (this.selectedRows.length === this.allLogs.length) {
          const totalEntries = [...this.allLogs];
          let deletedEntries = 0;
          try {
            await this.deleteAllLogsApi();
            useLoadingBar().startLoader();
            this.reloadEventLogData();
            setTimeout(() => {
              deletedEntries = totalEntries.length - this.allLogs.length;
              if (this.allLogs.length > 0) {
                this.toast.errorToast(
                  this.$t(
                    'pageEventLogs.toast.errorDeleteGuardRecord',
                    this.allLogs.length,
                  ),
                );
                this.toast.errorToast(
                  this.$t(
                    'pageEventLogs.toast.errorDelete',
                    this.allLogs.length,
                  ),
                );
              }
              if (deletedEntries > 0) {
                this.toast.successToast(
                  this.$t('pageEventLogs.toast.successDelete', deletedEntries),
                );
              }
              useLoadingBar().endLoader();
            }, 8000);
          } catch (error) {
            this.toast.errorToast(error.message);
            useLoadingBar().endLoader();
          } finally {
            eventBus.emit('clear-selected');
            this.openModal = false;
          }
        } else {
          this.deleteLogs(this.uris);
        }
      }
    },
    async deleteLogs(uris) {
      try {
        const messages = await this.deleteEventLogsApi(uris);
        messages.forEach(({ type, message }) => {
          this.reloadEventLogData();
          if (type === 'success') {
            this.toast.successToast(message);
          } else if (type === 'error') {
            this.toast.errorToast(message);
          }
        });
      } finally {
        eventBus.emit('clear-selected');
        this.openModal = false;
      }
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    async onTableRowAction(action, { uri }) {
      if (action === 'delete') {
        this.uris = [uri];
        this.openModal = true;
        this.deleteMessage = this.$t('pageEventLogs.modal.deleteMessage');
        this.deleteTitle = this.$t('pageEventLogs.modal.deleteTitle');
        this.deleteType = 'selected';
      } else if (action === 'download') {
        const pelJsonInfo = [];
        useLoadingBar().startLoader();
        try {
          const returned = await this.downloadLogData(uri);
          pelJsonInfo.push(returned);
        } finally {
          this.downloadFile(pelJsonInfo);
          useLoadingBar().endLoader();
        }
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
    async resolveLogs() {
      try {
        const messages = await this.resolveEventLogsApi({
          logs: this.selectedRows,
          onSuccessCallback: (count) => {
            this.toast.successToast(
              this.$t('pageEventLogs.toast.successResolveLogs', count),
            );
          },
        });
        messages.forEach(({ type, message }) => {
          if (type === 'error') {
            this.toast.errorToast(message);
          }
        });
        eventBus.emit('clear-selected');
      } catch (error) {
        this.toast.errorToast(error.message);
      }
    },
    async unresolveLogs() {
      try {
        const messages = await this.unresolveEventLogsApi({
          logs: this.selectedRows,
          onSuccessCallback: (count) => {
            this.toast.successToast(
              this.$t('pageEventLogs.toast.successUnresolveLogs', count),
            );
          },
        });
        messages.forEach(({ type, message }) => {
          if (type === 'error') {
            this.toast.errorToast(message);
          }
        });
        eventBus.emit('clear-selected');
      } catch (error) {
        this.toast.errorToast(error.message);
      }
    },
    async downloadEventLogs(value) {
      const pelJsonInfo = [];
      this.toast.infoToast(this.$t('pageEventLogs.toast.infoStartDownload'));
      if (value === 'all') {
        //  download all logs
        let counter = 1;
        while (counter <= this.allLogs.length) {
          useLoadingBar().startLoader();
          try {
            const returned = await this.downloadLogData(
              this.allLogs[counter - 1].uri,
            );
            pelJsonInfo.push(returned);
            counter = counter + 1;
          } finally {
            if (pelJsonInfo.length === this.allLogs.length) {
              this.downloadFile(pelJsonInfo);
              useLoadingBar().endLoader();
            }
          }
        }
      } else {
        // several logs
        let counter = 1;
        while (counter <= this.selectedRows.length) {
          useLoadingBar().startLoader();
          try {
            const returned = await this.downloadLogData(
              this.selectedRows[counter - 1].uri,
            );
            pelJsonInfo.push(returned);
            counter = counter + 1;
          } finally {
            if (pelJsonInfo.length === this.selectedRows.length) {
              this.downloadFile(pelJsonInfo);
              useLoadingBar().endLoader();
            }
          }
        }
      }
    },
    dataFormatter(value) {
      return useDataFormatterGlobal().dataFormatter(value);
    },
    toggleAll(checked) {
      this.allLogs?.forEach((singleLog) => {
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
    clearSelectedRows(table) {
      return useTableSelectableComposable().clearSelectedRowsOptions(table);
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
