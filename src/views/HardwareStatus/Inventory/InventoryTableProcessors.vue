<template>
  <page-section :section-title="$t('pageInventory.processors')">
    <!-- Search -->
    <b-row class="align-items-end">
      <b-col sm="6" md="5" xl="4">
        <search @change-search="onChangeSearch" @clear-search="onClearSearch" />
      </b-col>
      <b-col sm="6" md="7" xl="4" class="mb-4">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="processors.length"
        ></table-cell-count>
      </b-col>
    </b-row>
    <b-table
      sort-icon-left
      no-sort-reset
      hover
      responsive="md"
      show-empty
      sticky-header="75vh"
      sort-by="id"
      :items="processors"
      :fields="fields"
      :sort-desc="false"
      :filter="searchFilterInput"
      :empty-text="$t('global.table.emptyMessage')"
      :empty-filtered-text="$t('global.table.emptySearchMessage')"
      :busy="isBusy"
      @filtered="onFiltered"
    >
      <template #head(identifyLed)="row">
        {{ row.label }}
        <info-tooltip :title="$t('pageInventory.identifyLedInfo')" />
      </template>
      <!-- Expand button -->
      <template #cell(expandRow)="row">
        <BButton
          variant="link"
          :aria-label="expandRowLabel"
          data-test-id="hardwareStatus-button-expandProcessors"
          :title="expandRowLabel"
          :class="
            row.item.toggleDetails ? 'rotateSvg btn-icon-only' : 'btn-icon-only'
          "
          @click="toggleRow(row)"
        >
          <icon-chevron />
        </BButton>
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
          <b-row style="margin-left: 5px">
            <b-col class="mt-2" sm="6" xl="6">
              <dl>
                <!-- Name -->
                <dt>{{ $t('pageInventory.table.name') }}</dt>
                <dd>
                  {{
                    item.name === 'Processor Module'
                      ? $t('pageInventory.processorModule')
                      : dataFormatter(item.name)
                  }}
                </dd>
                <!-- Part Number -->
                <dt>{{ $t('pageInventory.table.partNumber') }}</dt>
                <dd>{{ dataFormatter(item.partNumber) }}</dd>
                <!-- Serial Number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
                <!-- Spare Part Number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
              </dl>
            </b-col>
            <b-col class="mt-2" sm="6" xl="6">
              <dl>
                <!-- Model -->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
                <!-- Processor Type -->
                <dt>{{ $t('pageInventory.table.processorType') }}</dt>
                <dd>{{ dataFormatter(item.processorType) }}</dd>
                <!-- Total Cores -->
                <dt>{{ $t('pageInventory.table.totalCores') }}</dt>
                <dd>{{ dataFormatter(item.totalCores) }}</dd>
              </dl>
            </b-col>
          </b-row>
        </b-container>
      </template>
    </b-table>
  </page-section>
</template>

<script setup>
import PageSection from '@/components/Global/PageSection.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import Search from '@/components/Global/Search.vue';
import ProcessorStore from '../../../store/modules/HardwareStatus/ProcessorStore';
import { computed, onBeforeMount, reactive, ref } from 'vue';
import useToast from '@/components/Composables/useToastComposable';
import eventBus from '@/eventBus';
import { useI18n } from 'vue-i18n';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';

const { t } = useI18n();
const isBusy = ref(true);
const searchTotalFilteredRows = ref(0);

const { toggleRow } = useTableRowExpandComposable();
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();

const processorStore = ProcessorStore();
const { successToast, errorToast } = useToast();

const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();

const { expandRowLabel } = useTableRowExpandComposable();
const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
    sortable: false,
  },
  {
    key: 'id',
    label: t('pageInventory.table.name'),
    formatter: dataFormatter,
    sortable: true,
  },
  {
    key: 'health',
    label: t('pageInventory.table.health'),
    formatter: dataFormatter,
    sortable: true,
    tdClass: 'text-nowrap',
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
const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : processorStore.processorsGetter.length;
});

onBeforeMount(() => {
  processorStore.getProcessorsInfo().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-processors-complete');
    isBusy.value = false;
  });
});

const processors = computed(() => {
  return processorStore.processors;
});

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}

function toggleIdentifyLedValue(row) {
  processorStore
    .updateIdentifyLedValue({
      uri: row.uri,
      identifyLed: row.identifyLed,
    })
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
  margin-left: 10px;
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
