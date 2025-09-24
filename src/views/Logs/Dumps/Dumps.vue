<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.dumps')" />
    <BRow v-if="selectedDumpType">
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div class="fw-bold">
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
          <dumps-form @update-dump-info="updateDumpInfo"  />
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
            </BCol>
          </BRow>
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
            :sort-by="[{ key: 'dateTime', order: 'asc' }]"
            sticky-header="75vh"
            :fields="fields"
            :items="filteredDumps"
            :empty-text="$t('global.table.emptyMessage')"
            :empty-filtered-text="$t('global.table.emptySearchMessage')"
            :per-page="
              
              itemPerPage === 0 ? filteredDumps.length || 1 : itemPerPage
            
            "
            :current-page="currentPageNo"
            :filter="searchFilterInput"
            :busy="isBusy"
            @filtered="onFiltered"
            @row-selected="onRowSelected($event, filteredDumps.length)"
          >
            <!-- Date and Time column -->
            <template #cell(dateTime)="{ value }">
              <p class="mb-0">{{ $filters.formatDate(value) }}</p>
              <p class="mb-0">{{ $filters.formatTime(value) }}</p>
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
            v-model="itemPerPage"
            :options="itemsPerPageOptions"
          />
        </b-form-group>
      </BCol>
      <BCol sm="6" xl="5">
        <b-pagination
          v-model="currentPageNo"
          class="b-pagination"
          first-number
          last-number
          :per-page="
            itemPerPage === 0 ? filteredDumps.length || 1 : itemPerPage
          "
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-dump-entries"
        />
      </BCol>
    </BRow>
    <BModal
      v-model="openModal"
      :title="$t('pageDumps.modal.deleteDump')"
      :ok-title="$t('pageDumps.modal.deleteDump')"
      ok-variant="danger"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk"
    >
      <p>
        {{ $t('pageDumps.modal.deleteDumpConfirmation') }}
        {{ $t('pageDumps.modal.deleteDumpConfirmation') }}
      </p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, computed, onBeforeMount, onMounted } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
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
import useToast from '@/components/Composables/useToastComposable';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import stores from '@/store';
import eventBus from '@/eventBus';

const { hideLoader, startLoader, endLoader } = useLoadingBar();
const { currentPage, perPage, itemsPerPageOptions, getTotalRowCount } =
 
  usePaginationComposable();
const { getFilteredTableData, getFilteredTableDataByDate } =
 
  useTableFilterComposable();
const { successToast, errorToast } = useToast();

const dumps = stores.DumpsStore();
const userManagement = stores.UserManagementStore();
const resourceMemory = stores.ResourceMemoryStore();
const global = stores.GlobalStore();

const isBusy = ref(true);
const selectedDumpType = ref('');
const fields = ref([
  {
    key: 'id',
    label: i18n.global.t('pageDumps.table.id'),
    sortable: true,
  },
  {
    key: 'dateTime',
    label: i18n.global.t('pageDumps.table.dateAndTime'),
    sortable: true,
  },
  {
    key: 'dumpType',
    label: i18n.global.t('pageDumps.table.dumpType'),
    sortable: true,
  },
  {
    key: 'size',
    label: i18n.global.t('pageDumps.table.size'),
    sortable: true,
  },
  {
    key: 'actions',
    sortable: false,
    label: '',
    tdClass: 'text-right text-nowrap',
  },
]);
  {
    key: 'id',
    label: i18n.global.t('pageDumps.table.id'),
    sortable: true,
  },
  {
    key: 'dateTime',
    label: i18n.global.t('pageDumps.table.dateAndTime'),
    sortable: true,
  },
  {
    key: 'dumpType',
    label: i18n.global.t('pageDumps.table.dumpType'),
    sortable: true,
  },
  {
    key: 'size',
    label: i18n.global.t('pageDumps.table.size'),
    sortable: true,
  },
  {
    key: 'actions',
    sortable: false,
    label: '',
    tdClass: 'text-right text-nowrap',
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
      'Resource Dump Entry',
      'System Dump Entry',
    ],
  },
]);
  {
    key: 'dumpType',
    label: i18n.global.t('pageDumps.table.dumpType'),
    values: [
      'BMC Dump Entry',
      'Hardware Dump Entry',
      'Hostboot Dump Entry',
      'SBE Dump Entry',
      'Resource Dump Entry',
      'System Dump Entry',
    ],
  },
]);
const activeFiltersRows = ref([]);
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const filterEndDate = ref(null);
const filterStartDate = ref(null);
const searchFilterInput = ref('');
const searchTotalFilteredRows = ref(0);
const openModal = ref(false);
const dumpVal = ref();

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  Promise.all([
    dumps.getAllDumps(),
    userManagement.getUsers(),
    resourceMemory.getHmcManaged(),
    global.getBootProgress(),
  ]).finally(() => {
    endLoader();
    isBusy.value = false;
  });
});

onMounted(() => {
  eventBus.on('updateDumpInfo', updateDumpInfo);
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : filteredDumps.value.length;
});
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : filteredDumps.value.length;
});
const allDumps = computed(() => {
  return dumps.allDumpsGetter;
});
  return dumps.allDumpsGetter;
});
const filteredDumpsByDate = computed(() => {
  return getFilteredTableDataByDate(
    allDumps.value,
    filterStartDate.value,
    filterEndDate.value,
    'dateTime',
  );
});
  return getFilteredTableDataByDate(
    allDumps.value,
    filterStartDate.value,
    filterEndDate.value,
    'dateTime',
  );
});
const filteredDumps = computed(() => {
  return getFilteredTableData(
    filteredDumpsByDate.value,
    activeFiltersRows.value,
  );
});
const isInPhypStandby = computed(() => {
  return global.isInPhypStandby;
});
const hmcManaged = computed(() => {
  return resourceMemory.hmcManagedGetter;
});
  return resourceMemory.hmcManagedGetter;
});

const updateDumpInfo = (selectedDumpTypeVal) => {
  selectedDumpType.value = selectedDumpTypeVal.toString();
};
  selectedDumpType.value = selectedDumpTypeVal.toString();
};
const convertBytesToMegabytes = (bytes) => {
  return parseFloat((bytes / 1000000).toFixed(3));
};
  return parseFloat((bytes / 1000000).toFixed(3));
};
const onFilterChange = ({ activeFilters }) => {
  activeFiltersRows.value = activeFilters;
};
  activeFiltersRows.value = activeFilters;
};
const onFiltered = (filteredItems) => {
  searchTotalFilteredRows.value = filteredItems.length;
};
  searchTotalFilteredRows.value = filteredItems.length;
};
const onChangeDateTimeFilter = ({ fromDate, toDate }) => {
  filterStartDate.value = fromDate;
  filterEndDate.value = toDate;
};
  filterStartDate.value = fromDate;
  filterEndDate.value = toDate;
};
const onTableRowAction = (action, dump) => {
  if (action === 'delete') {
    openModal.value = true;
    dumpVal.value = dump;
  }
};
  if (action === 'delete') {
    openModal.value = true;
    dumpVal.value = dump;
  }
};
const handleOk = () => {
  openModal.value = false;
  dumps.deleteDumps([dumpVal.value]).then((messages) => {
    messages.forEach(({ type, message }) => {
      if (type === 'success') {
        successToast(message);
      } else if (type === 'error') {
        errorToast(message);
      }
    });
  });
};
  dumps.deleteDumps([dumpVal.value]).then((messages) => {
    messages.forEach(({ type, message }) => {
      if (type === 'success') {
        successToast(message);
      } else if (type === 'error') {
        errorToast(message);
      }
    });
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
  let filename = row.item.dumpType + '_' + row.item.id;
  filename = filename.replace(RegExp(' ', 'g'), '_');
  return filename;
};
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
