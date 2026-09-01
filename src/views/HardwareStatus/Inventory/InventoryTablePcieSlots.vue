<template>
  <page-section
    class="no-underline-link"
    :section-title="$t('pageInventory.pcieSlots')"
  >
    {{ $t('pageInventory.pcieTopologyLinkDescription') }}
    <router-link to="/hardware-status/pcie-topology" target="_blank">{{
      $t('pageInventory.pcieTopologyLink')
    }}</router-link>
    <b-row class="align-items-end">
      <b-col sm="6" md="5" xl="4">
        <search
          label="PCIeSlots"
          @change-search="onChangeSearch"
          @clear-search="onClearSearch"
        />
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
          :name="'switch-' + row.item.id"
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
import TableCellCount from '@/components/Global/TableCellCount.vue';
import { reactive, ref, computed, watch, onBeforeMount, nextTick } from 'vue';

import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useSearchFilterComposable from '../../../components/Composables/useSearchFilterComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import { useI18n } from 'vue-i18n';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import { BLink } from 'bootstrap-vue-next';

const { t } = useI18n();
const { successToast, errorToast } = useToast();
const { searchFilterInput, onChangeSearch, onClearSearch } =
  useSearchFilterComposable();
const { dataFormatter } = useDataFormatterGlobal();

const pcieSlotsStore = stores.PcieSlotsStore();
const globalStore = stores.GlobalStore();

const props = defineProps({
  chassis: {
    type: String,
    default: '',
  },
});

const searchTotalFilteredRows = ref(0);
const isBusy = ref(false);
const slotListLength = ref(0);

const fields = reactive([
  {
    key: 'type',
    label: t('pageInventory.table.slotType'),
    formatter: dataFormatter,
    sortable: true,
    class: 'text-center',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'locationNumber',
    label: t('pageInventory.table.locationNumber'),
    formatter: dataFormatter,
    sortable: true,
    thAttr: { scope: null },
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
  pcieSlotsStore.getPcieSlotsInfo({ uri: props.chassis }).finally(() => {
    eventBus.emit('hardware-status-pcie-slots-complete');
    isBusy.value = false;
  });
});

const filteredRows = computed(() => {
  return searchFilterInput.value
    ? searchTotalFilteredRows.value
    : slotListLength.value;
});

const pcieSlots = computed(() => {
  let slotsList = [];
  const slots = pcieSlotsStore.pcieSlotsGetter;
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
  } else if (globalStore.serverStatusGetter !== 'on') {
    return true;
  } else {
    return false;
  }
});

watch(
  () => props.chassis,
  (value) => {
    isBusy.value = true;
    pcieSlotsStore.getPcieSlotsInfo({ uri: value }).finally(() => {
      eventBus.emit('hardware-status-pcie-slots-complete');
      isBusy.value = false;
    });
  },
);

const setSlotListLength = (value) => {
  slotListLength.value = value;
  return;
};

watch(
  () => pcieSlots,
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
  :deep(a) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
