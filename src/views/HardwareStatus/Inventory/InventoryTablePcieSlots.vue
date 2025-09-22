<template>
  <page-section
    class="no-underline-link"
    :section-title="$t('pageInventory.pcieSlots')"
  >
    {{ $t('pageInventory.pcieTopologyLinkDescription') }}
    <b-link to="/hardware-status/pcie-topology">{{
      $t('pageInventory.pcieTopologyLink')
    }}</b-link>
    <b-row class="align-items-end">
      <b-col sm="6" md="5" xl="4">
        <search @change-search="onChangeSearch" @clear-search="onClearSearch" />
      </b-col>
      <b-col sm="6" md="3" xl="2" class="mb-4">
        <table-cell-count
          :filtered-items-count="filteredRows"
          :total-number-of-cells="pcieSlots.length"
        ></table-cell-count>
      </b-col>
    </b-row>
    <b-table
      sort-icon-left
      no-sort-reset
      hover
      responsive="md"
      sort-by="name"
      show-empty
      sticky-header="75vh"
      :items="pcieSlots"
      :fields="fields"
      :sort-desc="false"
      :filter="searchFilterInput"
      :empty-text="$t('global.table.emptyMessage')"
      :empty-filtered-text="$t('global.table.emptySearchMessage')"
      :busy="isBusy"
      class="no-scroll-sticky"
      @filtered="onFiltered"
    >
      <template #head(identifyLed)="row">
        {{ row.label }}
        <info-tooltip :title="$t('pageInventory.identifyLedInfo')" />
      </template>
      <!-- Toggle identify LED -->
      <template #cell(identifyLed)="row">
        <b-form-checkbox
          v-if="hasIdentifyLed(row.item.identifyLed)"
          v-model="row.item.identifyLed"
          name="switch"
          switch
          :disabled="serverStatus"
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
          <b-row>
            <b-col sm="6" xl="6">
              <dl>
                <dt>
                  {{ $t('pageInventory.table.slotType') }}
                </dt>
                <dd>{{ dataFormatter(item.type) }}</dd>
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
import TableCellCount from '@/components/Global/TableCellCount.vue';
import {
  defineProps,
  reactive,
  ref,
  computed,
  watch,
  onBeforeMount,
} from 'vue';

import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import { useI18n } from 'vue-i18n';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import { BLink } from 'bootstrap-vue-next';

const props = defineProps({
  chassis: {
    type: String,
    default: '',
  },
});
const { t } = useI18n();
const pcieSlotsStore = stores.PcieSlotsStore();
const globalStore = stores.GlobalStore();
const isBusy = ref(true);
const searchTotalFilteredRows = ref(0);
const { successToast, errorToast } = useToast();

const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { dataFormatter } = useDataFormatterGlobal();

const fields = reactive([
  {
    key: 'type',
    label: t('pageInventory.table.slotType'),
    formatter: dataFormatter,
    sortable: true,
    class: 'text-center',
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

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : slotListLength.value;
});
const slotListLength = ref(0);

const pcieSlots = computed(() => {
  let slotsList = [];
  const slots = pcieSlotsStore.pcieSlots;
  slots.map((slot) => {
    if (slot.type !== 'OEM') {
      slotsList.push(slot);
    }
  });
  setSlotListLength(slotsList.length);
  return slotsList;
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

watch(
  () => props.chassis,
  (value) => {
    pcieSlotsStore.getPcieSlotsInfo({ uri: value }).finally(() => {
      eventBus.emit('hardware-status-pcie-slots-complete');
      isBusy.value = false;
    });
  },
);

onBeforeMount(() => {
  pcieSlotsStore.getPcieSlotsInfo({ uri: props.chassis }).finally(() => {
    eventBus.emit('hardware-status-pcie-slots-complete');
    isBusy.value = false;
  });
});

const setSlotListLength = (value) => {
  slotListLength.value = value;
  return;
};

function onFiltered(filteredItems) {
  searchTotalFilteredRows.value = filteredItems.length;
}

function toggleIdentifyLedValue(row) {
  pcieSlotsStore
    .updateIdentifyLedValue({
      locationNumber: row.locationNumber,
      identifyLed: row.identifyLed,
      uri: props.chassis,
    })
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function hasIdentifyLed(identifyLed) {
  return typeof identifyLed === 'boolean';
}
</script>
<style lang="scss" scoped>
.no-underline-link {
  ::v-deep a {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
