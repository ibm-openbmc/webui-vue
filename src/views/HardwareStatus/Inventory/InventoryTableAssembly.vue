<template>
  <page-section :section-title="$t('pageInventory.assemblies')">
    <BRow class="align-items-end">
      <BCol sm="6" md="5" xl="4">
        <search @change-search="onChangeSearch" @clear-search="onClearSearch" />
      </BCol>
      <BCol sm="6" md="3" xl="2" class="mb-4">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="items.length"
        ></table-cell-count>
      </BCol>
    </BRow>
    <BTable
      sort-icon-left
      no-sort-reset
      hover
      sort-by="name"
      sticky-header="75vh"
      :sort-desc="false"
      responsive="xl"
      :items="items"
      :fields="tableHeaders"
      :filter="searchFilterInput"
      show-empty
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
          data-test-id="hardwareStatus-button-expandAssembly"
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
      <template #cell(health)="row">
        <status-icon
          v-if="isIoExpansionChassis && isPoweredOff"
          :status="statusIconValue('')"
        />
        <status-icon v-else :status="statusIconValue(row.item.health)" />
        {{
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : row.item.health === 'OK'
              ? $t('global.status.ok')
              : row.item.health === 'Warning'
                ? $t('global.status.warning')
                : row.item.health === 'Critical'
                  ? $t('global.status.critical')
                  : '--'
        }}
      </template>
      <!-- Status -->
      <template #cell(status)="row">
        {{
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : row.item.status === 'Present'
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
          :disabled="serverStatus"
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
        <BContainer fluid>
          <BRow style="margin-left: 50px">
            <BCol class="mt-10" sm="6" xl="6">
              <dl>
                <!-- Name -->
                <dt>{{ $t('pageInventory.table.name') }}</dt>
                <dd>{{ dataFormatter(item.name) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Serial number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
              </dl>
            </BCol>
            <BCol class="mt-2" sm="6" xl="6">
              <dl v-if="!isIoExpansionChassis">
                <!-- Model-->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Spare Part Number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
              </dl>
            </BCol>
          </BRow>
        </BContainer>
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
</template>

<script setup>
import PageSection from '@/components/Global/PageSection.vue';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import { reactive, ref, computed, watch, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import useToast from '@/components/Composables/useToastComposable';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';

const props = defineProps({
  chassis: {
    type: String,
    default: '',
  },
});

const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { successToast, errorToast } = useToast();
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const { t } = useI18n();

const globalStore = stores.GlobalStore();
const assemblyStore = stores.AssemblyStore();

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
  },
]);

onBeforeMount(() => {
  isBusy.value = true;
  assemblyStore.getAssemblyInfo({ uri: props.chassis }).finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-assembly-complete');
    isBusy.value = false;
  });
});

const assemblies = computed(() => {
  return assemblyStore.assemblies;
});

const items = computed(() => {
  if (assemblies.value) {
    return assemblies.value;
  } else {
    return [];
  }
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : items.value.length;
});

const serverStatus = computed(() => {
  if (props.chassis.endsWith('chassis')) {
    return false;
  } else if (globalStore.serverStatusGetter !== 'on') {
    return true;
  } else {
    return false;
  }
});

const isPoweredOff = computed(() => {
  if (globalStore.serverStatusGetter === 'off') {
    return true;
  } else {
    return false;
  }
});

const isIoExpansionChassis = computed(() => {
  if (props.chassis.endsWith('chassis')) {
    return false;
  } else {
    return true;
  }
});

const tableHeaders = computed(() => {
  let tempFields = [...fields];
  if (!isIoExpansionChassis.value) {
    tempFields.splice(4, 0, {
      key: 'partNumber',
      label: t('pageInventory.table.partNumber'),
      formatter: dataFormatter,
      sortable: true,
    });
  }
  return tempFields;
});

watch(
  () => props.chassis,
  (value) => {
    isBusy.value = true;
    assemblyStore.getAssemblyInfo({ uri: value }).finally(() => {
      // Emit initial data fetch complete to parent component
      eventBus.emit('hardware-status-assembly-complete');
      isBusy.value = false;
    });
  },
);

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}

function toggleIdentifyLedValue(row) {
  assemblyStore
    .updateIdentifyLedValue({
      uri: row.uri,
      memberId: row.id,
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
.rotateSvg {
  svg {
    transform: rotate(180deg);
  }
}
</style>
