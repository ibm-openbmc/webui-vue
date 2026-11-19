<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.dumps')" />
    <BRow v-if="selectedDumpType">
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <h5 class="fw-bold">
            {{ $t(`pageDumps.alert.${selectedDumpType}DumpHeading`) }}
          </h5>
          <p>
            {{ $t(`pageDumps.alert.${selectedDumpType}DumpMessage`) }}
            <span v-if="selectedDumpType === 'bmc'">
              {{
                hmcManaged === 'Disabled'
                  ? $t(`pageDumps.alert.refreshMessage`)
                  : ''
              }}
            </span>
            <span
              v-else-if="
                selectedDumpType === 'partition' ||
                selectedDumpType === 'retryPartition'
              "
            >
              {{ $t(`pageIbmiServiceFunctions.alert.osRunningPartitionDump`) }}
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
      </BCol>
    </BRow>
    <BRow>
      <BCol sm="6" lg="5" xl="4">
        <page-section :section-title="$t('pageDumps.initiateDump')">
          <dumps-form @update-dump-info="updateDumpInfo" />
        </page-section>
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="10">
        <page-section :section-title="$t('pageDumps.dumpsAvailableOnBmc')">
          <BRow class="align-items-start">
            <BCol
              sm="8"
              xl="6"
              class="d-sm-flex align-items-end mb-4 searchStyle"
            >
              <search
                :placeholder="$t('pageDumps.table.searchDumps')"
                @change-search="onChangeSearch"
                @clear-search="onClearSearch"
              />
              <div class="ml-sm-4 margin-style">
                <table-cell-count
                  :filtered-items-count="filteredRows"
                  :total-number-of-cells="allDumps.length"
                ></table-cell-count>
              </div>
            </BCol>
            <BCol sm="8" md="7" xl="6">
              <table-date-filter @change="onChangeDateTimeFilter" />
            </BCol>
          </BRow>
          <BRow>
            <BCol class="text-right">
              <table-filter
                :filters="tableFilters"
                @filter-change="onFilterChange"
              />
              <BButton
                variant="link"
                :disabled="allDumps.length === 0"
                @click="deleteAllDumps"
              >
                <icon-delete /> {{ $t('global.action.deleteAll') }}
              </BButton>
              <BButton
                :variant="allDumps.length === 0 ? 'light' : 'primary'"
                :class="{ disabled: allDumps.length === 0 }"
                @click="downloadDumps(allDumps)"
              >
                <icon-download /> {{ $t('global.action.downloadAll') }}
              </BButton>
            </BCol>
          </BRow>
          <table-toolbar
            :selected-items-count="selectedRows.length"
            :actions="batchActions"
            :table="tableDumps"
            @batch-action="onBatchAction"
          />
          <BTable
            id="table-dumps"
            ref="tableDumps"
            class="tableStyle"
            show-empty
            hover
            sort-icon-left
            no-sort-reset
            selectable
            no-select-on-click
            responsive="md"
            sticky-header="75vh"
            :fields="fields"
            :items="pagination.paginatedData.value"
            @row-selected="
              onRowSelected($event, pagination.paginatedData.value.length)
            "
          >
            <!-- Checkbox column -->
            <template #head(checkbox)>
              <BFormCheckbox
                v-model="tableHeaderCheckbox"
                aria-label="checkbox-head"
                data-test-id="dumps-checkbox-selectAll"
                :indeterminate="tableHeaderCheckboxIndeterminate"
                @change="
                  onChangeHeaderCheckbox(tableDumps, tableHeaderCheckbox)
                "
                @update:model-value="toggleAll"
              >
                <span class="visually-hidden">checkbox-head</span>
              </BFormCheckbox>
            </template>
            <template #cell(checkbox)="row">
              <BFormCheckbox
                :model-value="selectedDumpIds.has(row.item.id)"
                aria-label="checkbox"
                :data-test-id="`dumps-checkbox-selectRow-${row.index}`"
                @update:model-value="
                  (checked) => {
                    if (checked) {
                      selectedDumpIds.add(row.item.id);
                    } else {
                      selectedDumpIds.delete(row.item.id);
                    }
                    toggleSelectRowById(
                      tableDumps,
                      row.index,
                      checked,
                      row.item,
                    );
                  }
                "
              >
                <span class="visually-hidden">checkbox</span>
              </BFormCheckbox>
            </template>

            <!-- Date and Time column -->
            <template #cell(dateTime)="{ value }">
              <p class="mb-0">{{ $filters.formatDate(value) }}</p>
              <p class="mb-0">{{ $filters.formatTime(value) }}</p>
            </template>

            <!-- Size column -->
            <template #cell(size)="{ value }">
              {{ formatSize(value) }}
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
                  <icon-download
                    v-if="action.value === 'download'"
                    aria-label="download"
                  />
                  <icon-delete
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
              <span v-else-if="searchFilterInput">
                {{ $t('global.table.emptySearchMessage') }}
              </span>
              <span v-else>
                {{ $t('global.table.emptyMessage') }}
              </span>
            </template>
          </BTable>
        </page-section>
      </BCol>
    </BRow>
    <!-- Table pagination -->
    <BRow>
      <BCol sm="6" xl="5">
        <b-form-group
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <b-form-select
            id="pagination-items-per-page"
            v-model="itemPerPageRef"
            :options="itemsPerPageOptions"
          />
        </b-form-group>
      </BCol>
      <BCol sm="6" xl="5">
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
      :title="$t('pageDumps.modal.deleteDump', { count: count }, count)"
      :ok-title="$t('pageDumps.modal.deleteDump', { count: count }, count)"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk"
    >
      <p>
        {{
          $t('pageDumps.modal.deleteDumpConfirmation', { count: count }, count)
        }}
      </p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
import Alert from '@/components/Global/Alert.vue';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import DumpsForm from './DumpsForm.vue';
import PageSection from '@/components/Global/PageSection.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableDateFilter from '@/components/Global/TableDateFilter.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToast from '@/components/Composables/useToastComposable';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import { useDumps } from '@/api/composables/useDumps';
import stores from '@/store';
import eventBus from '@/eventBus';

const { hideLoader, startLoader, endLoader } = useLoadingBar();
const { itemsPerPageOptions } = usePaginationComposable();
const { getFilteredTableData, getFilteredTableDataByDate } =
  useTableFilterComposable();
const { successToast, errorToast } = useToast();
const {
  clearSelectedRowsOptions,
  toggleSelectRowById,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList: selectedRows,
  tableHeaderCheckboxModel: tableHeaderCheckbox,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();

const { allDumps, isLoading, deleteDumps } = useDumps();
const resourceMemory = stores.ResourceMemoryStore();
const global = stores.GlobalStore();

const isBusy = computed(() => isLoading.value);
const selectedDumpType = ref('');
const tableDumps = ref(null);
// Tracks selected dump ids for checkbox display
const selectedDumpIds = ref(new Set());
const fields = ref([
  {
    key: 'checkbox',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'id',
    label: i18n.global.t('pageDumps.table.id'),
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'dateTime',
    label: i18n.global.t('pageDumps.table.dateAndTime'),
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'dumpType',
    label: i18n.global.t('pageDumps.table.dumpType'),
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'size',
    label: i18n.global.t('pageDumps.table.size'),
    sortable: true,
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
]);
const batchActions = ref([
  {
    value: 'download',
    label: i18n.global.t('global.action.download'),
  },
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);
const tableFilters = ref([
  {
    key: 'dumpType',
    label: i18n.global.t('pageDumps.table.dumpType'),
    values: [
      'BMC Dump Entry',
      'Hardware Dump Entry',
      'Hostboot Dump Entry',
      'SBE Dump Entry',
      'OCMB SBE Dump Entry',
      'Resource Dump Entry',
      'System Dump Entry',
    ],
  },
]);
const activeFiltersRows = ref([]);
const currentPageRef = ref(1);

const itemPerPageRef = ref(20);
const filterEndDate = ref(null);
const filterStartDate = ref(null);
const searchFilterInput = ref('');
const openModal = ref(false);
const dumpsToDelete = ref([]);
const count = ref(0);

onBeforeRouteLeave(() => {
  hideLoader();
  eventBus.emit('clear-selected');
});

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    selectedDumpIds.value.clear();
    clearSelectedRowsOptions(tableDumps.value);
  });
});

// Watch loading state to drive the loading bar
watch(
  isLoading,
  (loading) => {
    if (loading) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

const filteredRows = computed(() => {
  return filteredDumps.value.length;
});
const filteredDumpsByDate = computed(() => {
  return getFilteredTableDataByDate(
    allDumps.value,
    filterStartDate.value,
    filterEndDate.value,
    'dateTime',
  );
});
const filteredDumps = computed(() => {
  if (!filteredDumpsByDate.value) return [];
  let data = getFilteredTableData(
    filteredDumpsByDate.value,
    activeFiltersRows.value,
  );
  if (searchFilterInput.value) {
    const search = searchFilterInput.value.toLowerCase();
    const allowedKeys = fields.value.map((item) => item.key);
    data = data.filter((item) => {
      const searchableFields = allowedKeys
        .filter((key) => key in item)
        .map((key) => item[key]);
      return searchableFields.some((field) =>
        String(field || '')
          .toLowerCase()
          .includes(search),
      );
    });
  }
  return data;
});
const hmcManaged = computed(() => {
  return resourceMemory.hmcManagedGetter;
});

// Client-side pagination composable
const pagination = usePaginatedData({
  data: filteredDumps,
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

const updateDumpInfo = (selectedDumpTypeVal) => {
  selectedDumpType.value = selectedDumpTypeVal.toString();
};
eventBus.on('updateDumpInfo', updateDumpInfo);
const formatSize = (bytes) => {
  if (bytes >= 1000000000) {
    return `${parseFloat((bytes / 1000000000).toFixed(1))} GB`;
  }
  if (bytes >= 1000000) {
    return `${parseFloat((bytes / 1000000).toFixed(1))} MB`;
  }
  if (bytes >= 1000) {
    return `${parseFloat((bytes / 1000).toFixed(1))} KB`;
  }
  return `${Math.round(bytes)} bytes`;
};
const onFilterChange = ({ activeFilters }) => {
  activeFiltersRows.value = activeFilters;
};
const onChangeDateTimeFilter = ({ fromDate, toDate }) => {
  filterStartDate.value = fromDate;
  filterEndDate.value = toDate;
};
const onTableRowAction = (action, dump) => {
  if (action === 'delete') {
    dumpsToDelete.value = [dump];
    count.value = 1;
    openModal.value = true;
  }
};
const downloadDumps = (dumps) => {
  // Stagger downloads so browsers do not block multiple simultaneous ones
  dumps
    .filter((dump) => dump.data)
    .forEach((dump, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = dump.data;
        link.download = `${dump.dumpType}_${dump.id}`.replace(/ /g, '_');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
};
const deleteAllDumps = () => {
  dumpsToDelete.value = [...allDumps.value];
  count.value = dumpsToDelete.value.length;
  openModal.value = true;
};
const onBatchAction = (action) => {
  if (action === 'download') {
    downloadDumps(selectedRows.value);
  } else if (action === 'delete') {
    dumpsToDelete.value = [...selectedRows.value];
    count.value = dumpsToDelete.value.length;
    openModal.value = true;
  }
};
const toggleAll = (checked) => {
  if (checked) {
    pagination.paginatedData.value.forEach((dump) => {
      selectedDumpIds.value.add(dump.id);
    });
  } else {
    selectedDumpIds.value.clear();
  }
};
const handleOk = () => {
  openModal.value = false;
  deleteDumps(dumpsToDelete.value).then((messages) => {
    messages.forEach(({ type, message }) => {
      if (type === 'success') {
        successToast(message);
      } else if (type === 'error') {
        errorToast(message);
      }
    });
    eventBus.emit('clear-selected');
  });
};
const onChangeSearch = (event) => {
  searchFilterInput.value = event;
};
const onClearSearch = () => {
  searchFilterInput.value = '';
};
const exportFileName = (row) => {
  let filename = row.item.dumpType + '_' + row.item.id;
  filename = filename.replace(RegExp(' ', 'g'), '_');
  return filename;
};

watch(
  () => pagination.filteredData.value,
  (item) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!item.length) {
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
#table-dumps {
  td .btn-link {
    width: auto !important;
  }
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
.text-right {
  text-align: right;
}
.tableStyle {
  overflow-x: hidden;
}
</style>
