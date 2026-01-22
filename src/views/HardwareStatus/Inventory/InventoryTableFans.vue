<template>
  <page-section :section-title="$t('pageInventory.fans')">
    <BRow class="align-items-end">
      <BCol sm="6" md="5" xl="4">
        <search
          label="fans"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
      </BCol>
      <BCol sm="6" md="3" xl="2" class="mb-4">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="fans.length"
        ></table-cell-count>
      </BCol>
    </BRow>
    <b-table
      sort-icon-left
      no-sort-reset
      hover
      responsive="md"
      sort-by="name"
      show-empty
      sticky-header="75vh"
      :items="fans"
      :fields="fields"
      :sort-desc="false"
      :filter="searchFilterInput"
      class="no-scroll-sticky"
      @filtered="onFiltered"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <BButton
          variant="link"
          data-test-id="inventory-button-expandFans"
          :title="expandRowLabel"
          class="btn-icon-only"
          @click="toggleRow(row)"
        >
          <icon-chevron />
        </BButton>
      </template>
      <!-- Name -->
      <template #cell(name)="row">
        {{ row.item.name }}
      </template>
      <!-- Health -->
      <template #cell(health)="{ value }">
        <status-icon
          v-if="isIoExpansionChassis && isPoweredOff"
          :status="statusIconValue('')"
        />
        <status-icon v-else :status="statusIconValue(value)" />
        {{
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : value === 'OK'
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
        <BFormCheckbox
          v-if="hasIdentifyLed(row.item.identifyLed)"
          v-model="row.item.identifyLed"
          :name="'switch-' + row.item.id"
          switch
          :disabled="serverStatus"
          @change="toggleIdentifyLedValue(row.item)"
        >
          <span v-if="row.item.identifyLed">
            {{ $t('global.status.on') }}
          </span>
          <span v-else> {{ $t('global.status.off') }} </span>
        </BFormCheckbox>
        <div v-else>--</div>
      </template>

      <template #row-details="{ item }">
        <b-container fluid>
          <BRow style="margin-left: 50px">
            <BCol sm="6" xl="6">
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
              <dl v-if="!isIoExpansionChassis">
                <!-- Part number -->
                <dt>{{ $t('pageInventory.table.partNumber') }}</dt>
                <dd>{{ dataFormatter(item.partNumber) }}</dd>
              </dl>
            </BCol>
            <BCol sm="6" xl="6">
              <dl v-if="!isIoExpansionChassis">
                <!-- Spare part number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Model -->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
              </dl>
            </BCol>
          </BRow>
        </b-container>
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
    </b-table>
  </page-section>
</template>

<script setup>
import PageSection from '@/components/Global/PageSection.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import TableCellCount from '@/components/Global/TableCellCount.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import Search from '@/components/Global/Search.vue';
import { reactive, ref, computed, watch, onBeforeMount, nextTick } from 'vue';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import { useI18n } from 'vue-i18n';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';

const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { expandRowLabel } = useTableRowExpandComposable();
const { successToast, errorToast } = useToast();
const { toggleRow } = useTableRowExpandComposable();
const { t } = useI18n();
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();

const fanStore = stores.FanStore();
const globalStore = stores.GlobalStore();

const props = defineProps({
  chassis: {
    type: String,
    default: '',
  },
});

const isBusy = ref(false);
const searchTotalFilteredRows = ref(0);

const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'name',
    label: t('pageInventory.table.name'),
    formatter: dataFormatter,
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'health',
    label: t('pageInventory.table.health'),
    formatter: dataFormatter,
    sortable: true,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'status',
    label: t('pageUserManagement.table.status'),
    formatter: dataFormatter,
    sortable: true,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'locationNumber',
    label: t('pageInventory.table.locationNumber'),
    formatter: dataFormatter,
    sortable: true,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'identifyLed',
    label: t('pageInventory.table.identifyLed'),
    formatter: dataFormatter,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

onBeforeMount(() => {
  isBusy.value = true;
  fanStore.getAllFans({ uri: props.chassis }).finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-fans-complete');
    isBusy.value = false;
  });
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : fanStore.fans.length;
});

const fans = computed(() => {
  return fanStore.fansGetter;
});

const serverStatus = computed(() => {
  if (props.chassis.endsWith('chassis')) {
    return false;
  } else if (globalStore.serverStatus !== 'on') {
    return true;
  } else {
    return false;
  }
});

const isPoweredOff = computed(() => {
  if (globalStore.serverStatus === 'off') {
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

watch(
  () => props.chassis,
  (value) => {
    isBusy.value = true;
    fanStore.getAllFans({ uri: value }).finally(() => {
      // Emit initial data fetch complete to parent component
      eventBus.emit('hardware-status-fans-complete');
      isBusy.value = false;
    });
  },
);

watch(
  () => fans,
  (item) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
    });
    if (!item.length) {
      document
        .querySelector('tr.b-table-empty-slot td[scope]')
        .removeAttribute('scope');
    }
  },
  { deep: true },
);

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}
function toggleIdentifyLedValue(row) {
  fanStore
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
