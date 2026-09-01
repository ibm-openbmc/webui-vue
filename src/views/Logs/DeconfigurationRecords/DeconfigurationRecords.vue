<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.deconfigurationRecords')"
      :description="
        $t('pageDeconfigurationRecords.pageDescription.description')
      "
      :link="$t('pageDeconfigurationRecords.pageDescription.link')"
      to="/settings/hardware-deconfiguration"
      class="deconfig-records-title"
    />
    <alert v-if="!isServerOff()" variant="info" class="mb-4">
      <p>
        {{ $t('pageDeconfigurationRecords.alertPowerOff') }}
      </p>
    </alert>
    <BRow>
      <BCol class="text-right">
        <table-filter
          :filters="tableFilters"
          data-test-id="deconfigRecords-filter"
          @filter-change="onFilterChange"
        />
        <BButton
          variant="link"
          :disabled="allEntries.length === 0 || !isServerOff()"
          data-test-id="deconfigRecords-button-clearAll"
          @click="clearAllEntries"
        >
          <icon-delete /> {{ $t('global.action.clearAll') }}
        </BButton>
        <BButton
          :variant="allEntries.length === 0 ? 'light' : 'primary'"
          :class="{ disabled: allEntries.length === 0 }"
          :download="exportFileNameByDate()"
          :href="href"
          data-test-id="deconfigRecords-button-exportAll"
        >
          <icon-export /> {{ $t('global.action.exportAll') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <table-toolbar
          ref="toolbar"
          :table="tableDeconfigurationRecordsRef"
          :selected-items-count="selectedRowsList.length"
          @clear-selected="clearSelectedRows(tableDeconfigurationRecordsRef)"
        >
          <template #toolbar-buttons>
            <table-toolbar-export
              :data="batchExportData"
              :file-name="exportFileNameByDate()"
            />
            <BButton
              variant="primary"
              :disabled="!isServerOff()"
              @click="onBatchAction('delete')"
            >
              <icon-delete /> {{ $t('global.action.delete') }}
            </BButton>
          </template>
        </table-toolbar>
        <BTable
          id="table-deconfiguration-records"
          ref="tableDeconfigurationRecordsRef"
          class="tableStyle"
          responsive="xl"
          selectable
          no-select-on-click
          hover
          show-empty
          sticky-header="75vh"
          sort-desc.sync="status"
          :actions="batchActions"
          :fields="fields"
          :items="pagination.paginatedData.value"
          @row-selected="
            onRowSelected($event, pagination.paginatedData.value.length)
          "
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
            <BContainer fluid="xl">
              <BRow>
                <BCol cols="4">
                  <dl>
                    <!-- Event Id -->
                    <dt>
                      {{ $t('pageDeconfigurationRecords.table.srcDetails') }}
                      <info-tooltip
                        class="info-icon"
                        :title="
                          $t(
                            'pageDeconfigurationRecords.table.srcDetailsToolTip',
                          )
                        "
                      >
                      </info-tooltip>
                    </dt>
                    <dd>{{ dataFormatter(item.srcDetails) }}</dd>
                  </dl>
                </BCol>
                <BCol cols="4" class="mt-2">
                  <dl>
                    <dt>
                      {{ $t('pageDeconfigurationHardware.table.locationCode') }}
                    </dt>
                    <dd>{{ dataFormatter(item.location) }}</dd>
                  </dl>
                </BCol>
                <BCol
                  v-if="item.additionalDataUri"
                  cols="4"
                  class="text-nowrap mt-2"
                >
                  <BButton
                    class="btn btn-secondary"
                    target="_blank"
                    @click="downloadLog(item.oemPelAttachment, item.date)"
                  >
                    <icon-download />
                    {{ $t('pageDeconfigurationRecords.additionalDataUri') }}
                  </BButton>
                </BCol>
              </BRow>
            </BContainer>
          </template>
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              aria-label="checkbox-head"
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="
                onChangeHeaderCheckbox(
                  tableDeconfigurationRecordsRef,
                  tableHeaderCheckbox,
                )
              "
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="row.item.isSelected"
              aria-label="checkbox"
              :name="'switch-' + row.item.id"
              @change="
                toggleSelectRowById(
                  tableDeconfigurationRecordsRef,
                  row.index,
                  row.item.isSelected,
                  row.item,
                )
              "
            >
              <span class="visually-hidden">checkbox</span>
            </BFormCheckbox>
          </template>
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ $filters.formatDate(value) }}</p>
            <p class="mb-0">{{ $filters.formatTime(value) }}</p>
          </template>
          <!-- Severity column -->
          <template #cell(severity)="{ value }">
            {{
              value === 'Critical'
                ? $t('pageDeconfigurationRecords.severityValues.fatal')
                : value === 'Spare'
                  ? $t('pageDeconfigurationRecords.severityValues.spare')
                  : value === 'Warning'
                    ? $t('pageDeconfigurationRecords.severityValues.predictive')
                    : value === 'Manual'
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
          <!-- Actions column -->
          <template #cell(actions)="row">
            <table-row-action
              v-for="(action, index) in batchActions"
              :key="index"
              :value="action.value"
              :title="action.title"
              :enabled="isServerOff()"
              :row-data="row.item"
              @click-table-action="onTableRowAction(action.value, row.item.uri)"
            >
              <template #icon>
                <icon-delete v-if="action.value === 'delete'" />
              </template>
            </table-row-action>
          </template>
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
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
            v-model="itemPerPageRef"
            :options="itemsPerPageOptions"
            data-test-id="deconfigRecords-itemsPerPage"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <b-pagination
          v-model="currentPageRef"
          class="b-pagination"
          :tabindex="currentPageRef - 1"
          first-number
          last-number
          :per-page="
            itemPerPageRef === 0
              ? pagination.filteredData.value.length || 1
              : itemPerPageRef
          "
          :total-rows="pagination.totalItems.value"
        />
      </BCol>
    </BRow>
    <BModal
      v-model="openModal"
      :title="$t('pageDeconfigurationRecords.modal.deleteAllTitle')"
      :ok-title="$t('global.action.delete')"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk"
    >
      <p>
        {{ $t('pageDeconfigurationRecords.modal.deleteAllMessage') }}
      </p>
    </BModal>
    <BModal
      v-model="openModal2"
      :title="
        $t(
          'pageDeconfigurationRecords.modal.deleteTitle',
          { count: count },
          count,
        )
      "
      :ok-title="$t('global.action.delete')"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk2"
    >
      <p>
        {{
          $t(
            'pageDeconfigurationRecords.modal.deleteMessage',
            { count: count },
            count,
          )
        }}
      </p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { omit } from 'lodash';
import i18n from '@/i18n';
import { ref, computed, watch, nextTick } from 'vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableRowExpandComposable from '@/components/Composables/useTableRowExpandComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import IconExport from '@carbon/icons-vue/es/document--export/20';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableToolbarExport from '@/components/Global/TableToolbarExport.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { onBeforeRouteLeave } from 'vue-router';
import eventBus from '@/eventBus';
import { useDeconfigurationRecords } from '@/api/composables/useDeconfigurationRecords';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';

// Composables
const {
  onRowSelected,
  toggleSelectRowById,
  selectedRowsList,
  clearSelectedRows,
  onChangeHeaderCheckbox,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();
const { itemsPerPageOptions } = usePaginationComposable();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const Toast = useToastComposable();
const { getFilteredTableData } = useTableFilterComposable();
const { dataFormatter } = useDataFormatterGlobal();
const { startLoader, endLoader } = useLoadingBar();

// Use the new vue-query composable
const {
  allRecords: deconfigRecordsData,
  isLoading,
  isFetching,
  isProcessing,
  isError,
  clearAllRecords: clearAllRecordsApi,
  deleteRecords: deleteRecordsApi,
  downloadLog: downloadLogApi,
  refetchRecords,
} = useDeconfigurationRecords();

usePageLoadingBar(isFetching, isError);

const global = stores.GlobalStore();

const tableDeconfigurationRecordsRef = ref(null);
const isBusy = ref(false);
const fields = ref([
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
    label: i18n.global.t('pageDeconfigurationRecords.table.id'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: true,
  },
  {
    key: 'eventID',
    label: i18n.global.t('pageDeconfigurationRecords.table.eventId'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: true,
  },
  {
    key: 'date',
    label: i18n.global.t('pageDeconfigurationRecords.table.date'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: true,
  },
  {
    key: 'severity',
    label: i18n.global.t('pageDeconfigurationRecords.table.severity'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: true,
  },
  {
    key: 'description',
    label: i18n.global.t('pageDeconfigurationRecords.table.resource'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: false,
  },
  {
    key: 'status',
    label: i18n.global.t('pageDeconfigurationRecords.table.status'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
    sortable: false,
  },
  {
    key: 'actions',
    sortable: false,
    label: '',
    tdClass: 'text-right text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);
const tableFilters = ref([
  {
    key: 'filterByStatus',
    label: i18n.global.t('pageDeconfigurationRecords.table.status'),
    values: [
      i18n.global.t('pageEventLogs.resolved'),
      i18n.global.t('pageEventLogs.unresolved'),
    ],
  },
]);
const activeFiltersRows = ref([]);
const selectedRowsLists = ref(selectedRowsList);
const tableHeaderCheckbox = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminated = ref(tableHeaderCheckboxIndeterminate);
const openModal = ref(false);
const openModal2 = ref(false);
const isAllSelected = ref(false);
const batchActions = ref([
  {
    value: 'delete',
    title: i18n.global.t('global.action.delete'),
  },
]);
const count = ref(0);
const urival = ref();

// Client-side pagination setup
const currentPageRef = ref(1);

const itemPerPageRef = ref(20);

// Keep isBusy in sync with loading state
watch(
  () => isLoading.value || isProcessing.value,
  (loading) => {
    isBusy.value = loading;
  },
  { immediate: true },
);

onBeforeRouteLeave(() => {
  eventBus.emit('clear-selected');
  isBusy.value = false;
});

eventBus.on('clear-selected', () => {
  deconfigRecordsData.value?.forEach((singleConnection) => {
    singleConnection.isSelected = false;
  });
  clearSelectedRows(tableDeconfigurationRecordsRef);
});

const href = computed(() => {
  return `data:text/json;charset=utf-8,${exportAllRecords()}`;
});
const allEntries = computed(() => {
  return deconfigRecordsData.value || [];
});
const recordItems = computed(() => {
  return deconfigRecordsData.value || [];
});
const batchExportData = computed(() => {
  return selectedRowsLists.value.map((row) => omit(row, 'actions'));
});
const filteredLogs = computed(() => {
  return getFilteredTableData(recordItems.value, activeFiltersRows.value);
});

// Client-side pagination composable
const pagination = usePaginatedData({
  data: filteredLogs,
  pageSize: itemPerPageRef.value,
  initialPage: 1,
});

// Keep pageSize in sync with itemPerPageRef
watch(itemPerPageRef, (newSize) => {
  pagination.pageSize.value = newSize;
});

// Keep currentPageRef in sync with pagination.currentPage
watch(currentPageRef, (newPage) => {
  pagination.currentPage.value = newPage;
});

watch(pagination.currentPage, (newPage) => {
  currentPageRef.value = newPage;
});

const serverStatus = computed(() => {
  return global.serverStatusGetter;
});

const isServerOff = () => {
  return serverStatus.value === 'off';
};
const clearAllEntries = () => {
  openModal.value = true;
};
const handleOk = async () => {
  openModal.value = false;
  const totalEntries = [...allEntries.value];
  let deletedEntries = 0;

  try {
    startLoader();
    await clearAllRecordsApi();
    await refetchRecords();

    deletedEntries = totalEntries.length - allEntries.value.length;
    if (allEntries.value.length > 0) {
      Toast.errorToast(
        i18n.global.t(
          'pageDeconfigurationRecords.toast.clearAllInfo',
          allEntries.value.length,
        ),
      );
      Toast.errorToast(
        i18n.global.t(
          'pageDeconfigurationRecords.toast.errorDelete',
          allEntries.value.length,
        ),
      );
    }
    if (deletedEntries > 0) {
      Toast.successToast(
        i18n.global.t(
          'pageDeconfigurationRecords.toast.successDelete',
          deletedEntries,
        ),
      );
    }
  } catch (error) {
    Toast.errorToast(error.message);
  } finally {
    endLoader();
  }
};
const handleOk2 = () => {
  openModal2.value = false;
  deleteRecords(urival.value);
};
const deleteRecords = async (uri) => {
  try {
    const message = await deleteRecordsApi(uri);
    Toast.successToast(message);
  } catch (error) {
    Toast.errorToast(error.message);
  } finally {
    eventBus.emit('clear-selected');
  }
};
const downloadLog = async (uri, date) => {
  try {
    startLoader();
    const message = await downloadLogApi(uri, date);
    Toast.successToast(...message);
  } catch (error) {
    Toast.errorToast(error.message);
  } finally {
    endLoader();
  }
};
// Create export file name based on date
const exportFileNameByDate = (value) => {
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  let fileName;
  if (value === 'export') {
    fileName = 'deconfig_record_';
  } else {
    fileName = 'all_deconfig_records_';
  }
  return fileName + date;
};
const exportAllRecords = () => {
  return deconfigRecordsData.value.map((records) => {
    const allDeconfigRecordsString = JSON.stringify(records);
    return allDeconfigRecordsString;
  });
};
const onFilterChange = ({ activeFilters }) => {
  activeFiltersRows.value = activeFilters;
};
const toggleAll = (checked) => {
  deconfigRecordsData.value?.forEach((singleRecord) => {
    singleRecord.isSelected = checked;
  });
  isAllSelected.value = checked;
};
const onTableRowAction = (action, uri) => {
  if (action === 'delete') {
    count.value = 1;
    urival.value = [uri];
    openModal2.value = true;
  }
};
const onBatchAction = (action) => {
  if (action === 'delete') {
    count.value = selectedRowsLists.value.length;
    urival.value = selectedRowsLists.value.map((row) => row.uri);
    openModal2.value = true;
  }
};

watch(
  () => pagination.filteredData.value,
  (logs) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!logs.length) {
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
#table-deconfiguration-records {
  td .btn-link {
    width: auto !important;
  }
}
.rotateSvg {
  svg {
    transform: rotate(180deg);
  }
}
.container-xl {
  width: calc(100% - 90px);
}
.tableStyle {
  overflow-x: hidden;
}
.deconfig-records-title {
  :deep(a) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
