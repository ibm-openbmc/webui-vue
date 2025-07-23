<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.deconfigurationRecords')"
      :description="
        $t('pageDeconfigurationRecords.pageDescription.description')
      "
      :link="$t('pageDeconfigurationRecords.pageDescription.link')"
      to="/settings/hardware-deconfiguration"
    />
    <BRow>
      <BCol class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
        <BButton
          variant="link"
          :disabled="allEntries.length === 0 || !isServerOff()"
          @click="clearAllEntries"
        >
          <icon-delete /> {{ $t('global.action.clearAll') }}
        </BButton>
        <BButton
          variant="primary"
          :class="{ disabled: allEntries.length === 0 }"
          :download="exportFileNameByDate()"
          :href="href"
        >
          <icon-export /> {{ $t('global.action.exportAll') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsList.length"
          @clear-selected="clearSelectedRows(tableDeconfigurationRecordsRef)"
        >
          <template #toolbar-buttons>
            <table-toolbar-export
              :data="batchExportData"
              :file-name="exportFileNameByDate()"
            />
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
          :sort-by="[{ key: 'id', order: 'asc' }]"
          sort-desc.sync="status"
          :fields="fields"
          :items="filteredLogs"
          :empty-text="$t('global.table.emptyMessage')"
          :current-page="currentPageNo"
          :per-page="itemPerPage === 0 ? filteredLogs.length || 1 : itemPerPage"
          @row-selected="onRowSelected($event, filteredLogs.length)"
        >
          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <BButton
              variant="link"
              :aria-label="expandRowLabel"
              :title="expandRowLabel"
              :class="row.item.toggleDetails ? 'rotateSvg btn-icon-only' : 'btn-icon-only'"
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
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="onChangeHeaderCheckbox(tableDeconfigurationRecordsRef, tableHeaderCheckbox)"
              @update:modelValue="toggleAll"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="row.item.isSelected"
              @change="toggleSelectRowById(tableDeconfigurationRecordsRef, row.index, row.item.isSelected, row.item)"
            >
            </BFormCheckbox>
          </template>
          <!-- Date column -->
          <template #cell(date)="{ value }">
            <p class="mb-0">{{ $filters.formatDate(value)  }}</p>
            <p class="mb-0">{{ $filters.formatTime(value) }}</p>
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
            v-model="itemPerPage"
            :options="itemsPerPageOptions"
          />
        </BFormGroup>
      </BCol>
      <BCol sm="6">
        <b-pagination
          v-model="currentPageNo"
          class="b-pagination"
          first-number
          last-number
          :per-page="itemPerPage === 0 ? filteredLogs.length || 1 : itemPerPage"
          :total-rows="getTotalRowCount(filteredLogs.length)"
          aria-controls="table-event-logs"
        />
      </BCol>
    </BRow>
    <BModal
      v-model="openModal"
      :title="$t('pageDeconfigurationRecords.modal.deleteAllTitle')"
      :ok-title="$t('global.action.delete')"
      okVariant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk"
    >
      <p>
        {{
          $t('pageDeconfigurationRecords.modal.deleteAllMessage')
        }}
      </p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { omit } from 'lodash';
import i18n from '@/i18n';
import { ref, computed, onBeforeMount } from 'vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import usePaginationComposable from '@/components/Composables/usePaginationComposable';
import useTableRowExpandComposable from '@/components/Composables/useTableRowExpandComposable';
import useTableFilterComposable from '@/components/Composables/useTableFilterComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import IconDelete from '@carbon/icons-vue/es/trash-can/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import IconExport from '@carbon/icons-vue/es/document--export/20';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableToolbarExport from '@/components/Global/TableToolbarExport.vue';
import { DeconfigurationRecordsStore, GlobalStore } from '@/store';
import { onBeforeRouteLeave } from 'vue-router';
import eventBus from '@/eventBus';

const {
  onRowSelected,
  toggleSelectRowById,
  selectedRowsList,
  clearSelectedRows,
  onChangeHeaderCheckbox,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();
const {
  currentPage,
  perPage,
  itemsPerPageOptions,
  getTotalRowCount,
} = usePaginationComposable();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();

const Toast = useToastComposable();
const { getFilteredTableData } = useTableFilterComposable();
const { dataFormatter } = useDataFormatterGlobal();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const deconfigurationRecoredsStore = DeconfigurationRecordsStore();
const global = GlobalStore();

onBeforeRouteLeave(() => {
  hideLoader();
});
const tableDeconfigurationRecordsRef = ref(null);


const fields = ref([
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
          label:  i18n.global.t('pageDeconfigurationRecords.table.id'),
          sortable: true,
        },
        {
          key: 'eventID',
          label:  i18n.global.t('pageDeconfigurationRecords.table.eventId'),
          sortable: true,
        },
        {
          key: 'date',
          label:  i18n.global.t('pageDeconfigurationRecords.table.date'),
          sortable: true,
        },
        {
          key: 'severity',
          label:  i18n.global.t('pageDeconfigurationRecords.table.severity'),
          sortable: true,
        },
        {
          key: 'description',
          label:  i18n.global.t('pageDeconfigurationRecords.table.resource'),
          sortable: false,
        },
        {
          key: 'status',
          label:  i18n.global.t('pageDeconfigurationRecords.table.status'),
          sortable: false,
        },
      ]);
const tableFilters = ref([
        {
          key: 'filterByStatus',
          label:  i18n.global.t('pageDeconfigurationRecords.table.status'),
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
const currentPageNo = ref(currentPage);
const itemPerPage = ref(perPage);
const openModal = ref(false);
const isAllSelected = ref(false);

const href = computed(() => {
      return `data:text/json;charset=utf-8,${exportAllRecords()}`;
    });
const allEntries = computed(() => {
      return deconfigurationRecoredsStore.deconfigRecordsGetter;
    });
const recordItems = computed(() => {
      return deconfigurationRecoredsStore.deconfigRecordsGetter;
    });
const batchExportData = computed(() => {
      return selectedRowsLists.value.map((row) => omit(row, 'actions'));
    });
const filteredLogs = computed(() => {
      return getFilteredTableData(recordItems.value, activeFiltersRows.value);
    });
const serverStatus = computed(() => {
      return global.serverStatusGetter;
    });

onBeforeMount(() => {
    startLoader();
    deconfigurationRecoredsStore.getDeconfigurationRecordInfo()
      .finally(() => endLoader());
    eventBus.on('clear-selected', () => {
    deconfigurationRecoredsStore?.deconfigRecordsGetter?.map((singleConnection) => {
      singleConnection.isSelected = false;
    });
    clearSelectedRows(tableDeconfigurationRecordsRef);
  });
});

const isServerOff = () => {
      return serverStatus.value === 'off';
    };
const clearAllEntries = () => {
      openModal.value = true;
    };
const handleOk = () => {
  openModal.value = false;
  deconfigurationRecoredsStore.clearAllEntries(
          allEntries.value
          )
          .then((message) => Toast.successToast(message))
          .catch(({ message }) => Toast.errorToast(message));
    };
const downloadLog = (uri, date) => {
      startLoader();
      deconfigurationRecoredsStore.downloadLog({
          uri: uri,
          date: date,
        })
        .then((message) => Toast.successToast(...message))
        .catch(({ message }) => Toast.successToast(message))
        .finally(() => endLoader());
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
      {
        return deconfigurationRecoredsStore.deconfigRecordsGetter
        .map((records) => {
          const allDeconfigRecordsString = JSON.stringify(records);
          return allDeconfigRecordsString;
        });
      }
    };
const onFilterChange = ({ activeFilters }) => {
      activeFiltersRows.value = activeFilters;
    };
const toggleAll = (checked) => {
  deconfigurationRecoredsStore?.deconfigRecordsGetter?.map((singleRecord) => {
    singleRecord.isSelected = checked;
  });
  isAllSelected.value = checked;
};
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
  margin-left: 42px;
}
.tableStyle {
  overflow-x: hidden;
}
</style>