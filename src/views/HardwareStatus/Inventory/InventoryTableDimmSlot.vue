<template>
  <page-section :section-title="$t('pageInventory.dimmSlot')">
    <BRow class="align-items-end">
      <BCol sm="6" md="5" xl="4">
        <search @change-search="onChangeSearch" @clear-search="onClearSearch" />
      </BCol>
      <BCol sm="6" md="3" xl="2" class="mb-4">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="dimms.length"
        ></table-cell-count>
      </BCol>
    </BRow>
    <BTable
      sort-icon-left
      no-sort-reset
      hover
      sort-by="id"
      responsive="md"
      show-empty
      sticky-header="75vh"
      :items="dimms"
      :fields="fields"
      :sort-desc="false"
      :filter="searchFilterInput"
      :empty-text="
        isBusy ? $t('global.table.loading') : $t('global.table.emptyMessage')
      "
      :empty-filtered-text="$t('global.table.emptySearchMessage')"
      @filtered="onFiltered"
    >
      <template #head(identifyLed)="row">
        {{ row.label }}
        <info-tooltip :title="$t('pageInventory.identifyLedInfo')" />
      </template>
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="hardwareStatus-button-expandDimms"
          :title="expandRowLabel"
          :class="
            row.item.toggleDetails ? 'rotateSvg btn-icon-only' : 'btn-icon-only'
          "
          @click="toggleRow(row)"
        >
          <icon-chevron />
        </b-button>
      </template>

      <!-- Health -->
      <template #cell(health)="{ value }">
        <status-icon :status="statusIconValue(value)" />
        {{
          value === 'OK'
            ? $t('global.status.ok')
            : value === 'Warning'
              ? $t('global.status.warning')
              : value === 'Critical'
                ? $t('global.status.critical')
                : '--'
        }}
      </template>
      <!-- Status -->
      <template #cell(status)="row">
        {{
          row.item.status === 'Present'
            ? $t('global.status.present')
            : row.item.status === 'Absent'
              ? $t('global.status.absent')
              : row.item.status === 'Deferring'
                ? $t('global.status.deferring')
                : row.item.status === 'Disabled'
                  ? $t('global.status.disabled')
                  : row.item.status === 'InTest'
                    ? $t('global.status.inTest')
                    : row.item.status === 'Qualified'
                      ? $t('global.status.qualified')
                      : row.item.status === 'Quiesced'
                        ? $t('global.status.quiesced')
                        : row.item.status === 'StandbyOffline'
                          ? $t('global.status.standbyOffline')
                          : row.item.status === 'StandbySpare'
                            ? $t('global.status.standbySpare')
                            : row.item.status === 'Starting'
                              ? $t('global.status.starting')
                              : row.item.status === 'UnavailableOffline'
                                ? $t('global.status.unavailableOffline')
                                : row.item.status === 'Updating'
                                  ? $t('global.status.updating')
                                  : row.item.status
        }}
        <info-tooltip :title="getStatusTooltip(row.item.status)" />
      </template>
      <!-- Toggle identify LED -->
      <template #cell(identifyLed)="row">
        <b-form-checkbox
          v-if="hasIdentifyLed(row.item.identifyLed)"
          v-model="row.item.identifyLed"
          name="switch"
          switch
          @change="toggleIdentifyLedValue(row.item)"
        >
          <span v-if="row.item.identifyLed">
            {{ $t('global.status.on') }}
          </span>
          <span v-else> {{ $t('global.status.off') }} </span>
        </b-form-checkbox>
        <div v-else>--</div>
      </template>
      <template #row-details="{ item }">
        <b-container fluid>
          <BRow style="margin-left: 5px">
            <BCol sm="6" xl="6">
              <dl>
                <!-- Part Number -->
                <dt>{{ $t('pageInventory.table.partNumber') }}</dt>
                <dd>{{ dataFormatter(item.partNumber) }}</dd>
              </dl>
              <dl>
                <!-- Serial Number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
              </dl>
              <dl>
                <!-- Spare Part Number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
              </dl>
              <dl>
                <!-- Model -->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
              </dl>
            </BCol>
            <BCol sm="6" xl="6">
              <dl>
                <!-- Capacity MiB -->
                <dt>{{ $t('pageInventory.table.capacityMiB') }}</dt>
                <dd>{{ dataFormatter(item.capacityMiB) }}</dd>
              </dl>
              <dl>
                <!-- Enabled-->
                <dt>{{ $t('pageInventory.table.enabled') }}</dt>
                <dd>
                  {{
                    item.enabled
                      ? $t('pageInventory.true')
                      : $t('pageInventory.false')
                  }}
                </dd>
              </dl>
            </BCol>
          </BRow>
        </b-container>
      </template>
    </BTable>
  </page-section>
</template>

<script setup>
import PageSection from '@/components/Global/PageSection.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import Search from '@/components/Global/Search.vue';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import { useI18n } from 'vue-i18n';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import { ref, reactive, computed, onBeforeMount } from 'vue';
import stores from '../../../store';

const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const { t } = useI18n();
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();
const { successToast, errorToast } = useToast();

const memoryStore = stores.MemoryStore();

const isBusy = ref(false);
const searchTotalFilteredRows = ref(0);

const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
  },
  {
    key: 'name',
    label: t('pageInventory.table.name'),
    formatter: dataFormatter,
    sortable: true,
  },
  {
    key: 'health',
    label: t('pageInventory.table.health'),
    formatter: dataFormatter,
    tdClass: 'text-nowrap',
    sortable: true,
  },
  {
    key: 'status',
    label: t('pageUserManagement.table.status'),
    formatter: dataFormatter,
    sortable: true,
    tdClass: 'text-nowrap',
  },
  {
    key: 'locationNumber',
    label: t('pageInventory.table.locationNumber'),
    formatter: dataFormatter,
    sortable: true,
  },
  {
    key: 'identifyLed',
    label: t('pageInventory.table.identifyLed'),
    formatter: dataFormatter,
    sortable: false,
  },
]);

onBeforeMount(() => {
  isBusy.value = true;
  memoryStore.getDimms().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-dimm-slot-complete');
    isBusy.value = false;
  });
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : memoryStore.dimms.length;
});

const dimms = computed(() => {
  return memoryStore.dimmsGetter;
});

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}

function toggleIdentifyLedValue(row) {
  memoryStore
    .updateIdentifyLedValue({ uri: row.uri, identifyLed: row.identifyLed })
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}
function hasIdentifyLed(identifyLed) {
  return typeof identifyLed === 'boolean';
}
function getStatusTooltip(status) {
  switch (status) {
    case 'Present':
      return t('pageInventory.enumDescriptionIndicator.enabled');
    case 'Absent':
      return t('pageInventory.enumDescriptionIndicator.absent');
    case 'Deferring':
      return t('pageInventory.enumDescriptionIndicator.deferring');
    case 'Disabled':
      return t('pageInventory.enumDescriptionIndicator.disabled');
    case 'InTest':
      return t('pageInventory.enumDescriptionIndicator.inTest');
    case 'Qualified':
      return t('pageInventory.enumDescriptionIndicator.qualified');
    case 'Quiesced':
      return t('pageInventory.enumDescriptionIndicator.quiesced');
    case 'StandbyOffline':
      return t('pageInventory.enumDescriptionIndicator.standbyOffline');
    case 'StandbySpare':
      return t('pageInventory.enumDescriptionIndicator.standbySpare');
    case 'Starting':
      return t('pageInventory.enumDescriptionIndicator.starting');
    case 'UnavailableOffline':
      return t('pageInventory.enumDescriptionIndicator.unavailableOffline');
    case 'Updating':
      return t('pageInventory.enumDescriptionIndicator.updating');
    default:
      return '';
  }
}
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
.total-fixed-header :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
