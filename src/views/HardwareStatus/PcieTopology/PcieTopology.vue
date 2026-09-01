<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.pcieTopology')" />
    <b-row>
      <b-col md="8" xl="6">
        <alert v-if="isInPhypStandby" variant="info" class="mb-4">
          <span>
            {{ i18n.global.t('pagePcieTopology.alert') }}
          </span>
        </alert>
        <alert v-else variant="warning" class="mb-4">
          <span class="alert-message-link">
            {{ $t('pagePcieTopology.warning') }}
            <router-link to="/operations/server-power-operations">{{
              i18n.global.t('pagePower.alert.message3Link')
            }}</router-link>
          </span>
        </alert>
      </b-col>
    </b-row>
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pagePcieTopology.table.search')"
          data-test-id="pcie-input-search"
          :is-search-disabled="isBusy"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
        <div class="ml-sm-10 mb-4 ms-4">
          <table-cell-count
            :filtered-items-count="filteredRows"
            :total-number-of-cells="filteredEntries.length"
          ></table-cell-count>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="text-right">
        <table-filter
          :is-filter-disabled="isBusy"
          :filters="tableFilters"
          @filter-change="onFilterChange"
        />
        <b-button
          v-if="isServiceUser"
          variant="primary"
          :disabled="isBusy"
          @click="savePcieTopology"
        >
          {{ i18n.global.t('pagePcieTopology.savePcieTopology') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <BTable
          id="table-pcie-topology"
          ref="table"
          responsive="xl"
          sort-icon-left
          hover
          no-sort-reset
          :sort-desc="false"
          show-empty
          sticky-header="75vh"
          sort-by="id"
          :fields="fields"
          :filter="searchFilterInput"
          :items="pagination.paginatedData.value"
          @filtered="onFiltered"
        >
          <template #cell(localPortLocation)="{ item }">
            <template v-if="item.localPortLocation.length > 0">
              <span
                v-for="(value, index) in item.localPortLocation"
                :key="'localPortLocation ' + index"
              >
                {{ value.locationNumber }}
              </span>
            </template>
            <span v-else>--</span>
          </template>
          <template #cell(remotePortLocation)="{ item }">
            <template v-if="item.remotePortLocation.length > 0">
              <span
                v-for="(value, index) in item.remotePortLocation"
                :key="'remotePortLocation ' + index"
              >
                {{ value.locationNumber }}
              </span>
            </template>
            <span v-else>--</span>
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
              <div class="dropdwn">
                <b-row>
                  <b-col lg="4" xl="4" md="4" sm="4" xs="4">
                    <dl class="fontStyle">
                      <!-- Link properties -->
                      <dt class="headerStyle">
                        {{ i18n.global.t('pagePcieTopology.linkProperties') }}:
                      </dt>
                      <dd>
                        {{ i18n.global.t('pagePcieTopology.speed') }}:
                        {{ dataFormatter(item.linkPropertiesSpeed) }}
                      </dd>
                      <dd>
                        {{ i18n.global.t('pagePcieTopology.width') }}:
                        {{ dataFormatter(item.linkPropertiesWidth) }}
                      </dd>
                      <dd>
                        {{ i18n.global.t('pagePcieTopology.type') }}:
                        {{ dataFormatter(item.linkPropertiesType) }}
                      </dd>
                    </dl>
                  </b-col>
                  <b-col class="section-left-divider">
                    <b-row>
                      <b-col>
                        <dl class="fontStyle">
                          <!-- PCIe Bridge -->
                          <dt class="headerStyle">
                            {{
                              i18n.global.t('pagePcieTopology.bridgeOrHost')
                            }}:
                          </dt>
                          <dd>
                            {{ dataFormatter(item.pcieBridge.locationNumber) }}
                          </dd>
                        </dl>
                      </b-col>
                      <b-col class="text-nowrap">
                        <b-button
                          v-if="item.resetLinkAvailable"
                          class="btn btn-secondary float-right reset-btn"
                          target="_blank"
                          @click="openResetLinkModal(item)"
                        >
                          {{ i18n.global.t('pagePcieTopology.resetLink') }}
                        </b-button>
                      </b-col>
                    </b-row>
                    <div v-for="(value, i) in item.cablePartNumber" :key="i">
                      <div class="section-divider mb-3 mt-2"></div>
                      <div class="fontStyle headerStyle">
                        {{ dataFormatter('Cable ' + (i + 1)) }}
                      </div>
                      <b-row>
                        <b-col lg="5" xl="5" md="5" sm="5" xs="5">
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.localPort') }}:
                            {{
                              item.localPortLocation.length > 0 &&
                              item.localPortLocation[i]
                                ? item.localPortLocation[i].locationNumber
                                : '--'
                            }}
                          </div>
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.remotePort') }}:
                            {{
                              dataFormatter(
                                item.remotePortLocation.length > 0 &&
                                  item.remotePortLocation[i]
                                  ? item.remotePortLocation[i].locationNumber
                                  : '--',
                              )
                            }}
                          </div>
                        </b-col>
                        <b-col lg="4" xl="4" md="4" sm="4" xs="4">
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.partNumber') }}:
                            {{ dataFormatter(value) }}
                          </div>
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.cableType') }}:
                            {{ dataFormatter(item.cableType[i]) }}
                          </div>
                        </b-col>
                        <b-col lg="3" xl="3" md="3" sm="6" xs="3">
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.cableLength') }}:
                            {{ dataFormatter(item.cableLength[i]) }}m
                          </div>
                          <div class="fontStyle">
                            {{ i18n.global.t('pagePcieTopology.cableStatus') }}:
                            {{ dataFormatter(item.cableStatus[i]) }}
                          </div>
                        </b-col>
                      </b-row>
                    </div>
                    <div class="section-divider mb-3 mt-2"></div>
                    <div class="fontStyle headerStyle">
                      {{ i18n.global.t('pagePcieTopology.ioSlots') }}
                    </div>
                    <b-row>
                      <b-col>
                        <template v-if="item.ioSlots.length > 0">
                          <div
                            v-for="(val, i) in item.ioSlots"
                            :key="i"
                            class="fontStyle"
                          >
                            {{ dataFormatter(val.locationNumber) }}
                          </div>
                        </template>
                        <div v-else>--</div>
                      </b-col>
                    </b-row>
                  </b-col>
                </b-row>
              </div>
            </b-container>
          </template>
          <!-- Actions column -->
          <template #cell(actions)="{ item }">
            <span class="identifyLedStyle" @click="openIdentifyLedsModal(item)">
              {{ i18n.global.t('pagePcieTopology.identifyLed') }}
            </span>
          </template>
          <template #empty>
            <span v-if="tableIsBusy">
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
            v-model="itemPerPage"
            :options="itemsPerPageOptions"
          />
        </b-form-group>
      </b-col>

      <b-col sm="6">
        <b-pagination
          v-model="currentPageRef"
          class="b-pagination"
          :tabindex="currentPageRef - 1"
          first-number
          last-number
          :per-page="pagination.pageSize.value"
          :total-rows="pagination.totalItems.value"
        />
      </b-col>
    </b-row>

    <!-- Modals -->
    <modal-reset :reset-type="resetOption" :reset-uri="resetLinkUri" />
    <modal-leds :selected-obj="selectedObj" />
  </b-container>
</template>

<script setup>
import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import Search from '@/components/Global/Search.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import TableFilter from '@/components/Global/TableFilter.vue';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import ModalReset from './ResetLinkModal.vue';
import ModalLeds from './IdentifyLedsModal.vue';
import {
  onBeforeMount,
  onMounted,
  reactive,
  ref,
  computed,
  watch,
  nextTick,
} from 'vue';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import useTableFilter from '../../../components/Composables/useTableFilterComposable';
import usePaginationComposable from '../../../components/Composables/usePaginationComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';
import { BTable } from 'bootstrap-vue-next';
import { usePaginatedData } from '@/api/composables/shared/usePaginatedData';
import { usePcieTopology } from '@/api/composables/usePcieTopology';

const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const { itemsPerPageOptions, perPage } = usePaginationComposable();
const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { getFilteredTableData } = useTableFilter();
const { startLoader, endLoader } = useLoadingBar();
const { dataFormatter } = useDataFormatterGlobal();
const { successToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();

const {
  entries: pcieEntries,
  refreshTopology,
  saveTopology,
} = usePcieTopology();

const isBusy = ref(true);
const resetOption = ref(null);
const resetLinkUri = ref('');
const selectedObj = ref({});
const itemPerPage = ref(perPage);
const fetched = ref(false);
const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    formatter: dataFormatter,
    tdClass: 'table-row-expand',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'id',
    label: i18n.global.t('pagePcieTopology.id'),
    formatter: dataFormatter,
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'parentId',
    label: i18n.global.t('pagePcieTopology.parentId'),
    formatter: dataFormatter,
    sortable: true,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'linkStatus',
    label: i18n.global.t('pagePcieTopology.linkStatus'),
    formatter: dataFormatter,
    sortable: false,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'localPortLocation',
    label: i18n.global.t('pagePcieTopology.localPortLocation'),
    formatter: dataFormatter,
    sortable: false,
    tdClass: 'text-break',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'remotePortLocation',
    label: i18n.global.t('pagePcieTopology.remotePortLocation'),
    formatter: dataFormatter,
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    sortable: false,
    formatter: dataFormatter,
    label: ' ',
    tdClass: 'text-right text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);
const tableFilters = reactive([
  {
    key: 'linkStatus',
    label: i18n.global.t('pagePcieTopology.table.linkStatusType'),
    values: [
      i18n.global.t('pagePcieTopology.table.filter.degraded'),
      i18n.global.t('pagePcieTopology.table.filter.inactive'),
      i18n.global.t('pagePcieTopology.table.filter.open'),
      i18n.global.t('pagePcieTopology.table.filter.operational'),
      i18n.global.t('pagePcieTopology.table.filter.unknown'),
      i18n.global.t('pagePcieTopology.table.filter.failed'),
    ],
  },
]);
const activeFiltersRows = ref([]);
const batchActions = reactive([
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);
const searchTotalFilteredRows = ref(0);
const expandColumn = ref([
  'linkPropertiesSpeed',
  'linkPropertiesWidth',
  'linkPropertiesType',
  'pcieBridge.locationNumber',
  'ioSlots[0].locationNumber',
]);

onBeforeMount(() => {
  globalStore.getBootProgress().then(() => {
    checkIfInPhypStandby();
  });
});

onMounted(() => {
  eventBus.emit('loading-bar-status', true);
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : filteredEntries.value.length;
});

const filteredEntries = computed(() => {
  if (!pcieEntries.value?.length) return [];
  let data = getFilteredTableData(pcieEntries.value, activeFiltersRows.value);
  if (searchFilterInput.value) {
    const search = searchFilterInput.value.toLowerCase();
    const allowedKeys = fields.map((item) => item.key);
    data = data.filter((item) => {
      const searchableFields = [
        ...allowedKeys.filter((key) => key in item).map((key) => item[key]),
        ...expandColumn.value.map((path) => getPath(item, path)),
      ];
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
  data: filteredEntries,
  pageSize: itemPerPage.value,
  initialPage: 1,
});

const currentPageRef = ref(1);

watch(currentPageRef, (val) => {
  pagination.currentPage.value = val;
});

watch(pagination.currentPage, (val) => {
  currentPageRef.value = val;
});

watch(itemPerPage, (val) => {
  pagination.pageSize.value = val;
  currentPageRef.value = 1;
});
const tableIsBusy = computed(() => {
  if (!globalStore.isInPhypStandby) return false;
  if (fetched.value == true && globalStore.isInPhypStandby) return false;
  return true;
});
const isInPhypStandby = computed(() => {
  return globalStore.isInPhypStandby;
});
const isServiceUser = computed(() => {
  return globalStore.isServiceUser;
});

watch(
  () => filteredEntries,
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

function checkIfInPhypStandby(checkCounter = 0) {
  checkCounter++;
  if (checkCounter > 50) return;
  if (isInPhypStandby.value) {
    startLoader();
    refreshTopology().finally(() => {
      isBusy.value = false;
      fetched.value = true;
      endLoader();
    });
    return;
  } else {
    globalStore.getBootProgress();
    setTimeout(() => {
      checkIfInPhypStandby(checkCounter);
    }, 6000);
  }
}
function openResetLinkModal(value) {
  resetOption.value = value.id;
  resetLinkUri.value = value.resetLinkUri;
  eventBus.emit('modal-reset');
}
function openIdentifyLedsModal(value) {
  selectedObj.value = value;
  eventBus.emit('modal-leds');
}
function savePcieTopology() {
  saveTopology()
    .then(() =>
      successToast(
        i18n.global.t('pagePcieTopology.toast.successSavePcieTopology'),
      ),
    )
    .catch(() =>
      errorToast(i18n.global.t('pagePcieTopology.toast.errorSavePcieTopology')),
    );
}
function onFilterChange({ activeFilters }) {
  activeFiltersRows.value = activeFilters;
}
function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}
function getPath(obj, path) {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .reduce((o, k) => (o ? o[k] : undefined), obj);
}
</script>

<style lang="scss" scoped>
.identifyLedStyle {
  color: rgb(1, 80, 230);
  cursor: pointer;
}

.fontStyle {
  font-size: 14px;
}

.headerStyle {
  font-weight: bold;
}

.text-right {
  text-align: right;
}

.pagination-align {
  justify-content: end !important;
}

.dropdwn {
  margin-left: 4rem;
}

.reset-btn {
  margin-left: 8rem;
}

.rotateSvg {
  svg {
    transform: rotate(180deg);
  }
}

.alert-message-link {
  :deep(a) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
