<template>
  <page-section :section-title="$t('pageInventory.chassis')">
    <b-table
      responsive="md"
      hover
      show-empty
      sticky-header="75vh"
      :items="chassis"
      :fields="fields"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="hardwareStatus-button-expandChassis"
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
          row.item.statusState === 'Enabled'
            ? $t('global.status.present')
            : row.item.statusState === 'Absent'
              ? $t('global.status.absent')
              : row.item.statusState === 'Deferring'
                ? $t('global.status.deferring')
                : row.item.statusState === 'Disabled'
                  ? $t('global.status.disabled')
                  : row.item.statusState === 'InTest'
                    ? $t('global.status.inTest')
                    : row.item.statusState === 'Qualified'
                      ? $t('global.status.qualified')
                      : row.item.statusState === 'Quiesced'
                        ? $t('global.status.quiesced')
                        : row.item.statusState === 'StandbyOffline'
                          ? $t('global.status.standbyOffline')
                          : row.item.statusState === 'StandbySpare'
                            ? $t('global.status.standbySpare')
                            : row.item.statusState === 'Starting'
                              ? $t('global.status.starting')
                              : row.item.statusState === 'UnavailableOffline'
                                ? $t('global.status.unavailableOffline')
                                : row.item.statusState === 'Updating'
                                  ? $t('global.status.updating')
                                  : row.item.statusState
        }}
        <info-tooltip
          :title="getStatusTooltip(row.item.statusState)"
          style="overflow: visible !important"
        />
      </template>
      <!-- Toggle identify LED -->
      <template #cell(identifyLed)="row">
        <b-form-checkbox
          v-if="hasIdentifyLed(row.item.identifyLed)"
          v-model="row.item.identifyLed"
          :name="'switch-' + row.item.id"
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
          <b-row style="margin-left: 50px">
            <b-col class="mt-2" sm="6" xl="6">
              <dl>
                <!-- Name -->
                <dt>{{ $t('pageInventory.table.name') }}</dt>
                <dd>{{ dataFormatter(item.name) }}</dd>
              </dl>
            </b-col>
            <b-col class="mt-2" sm="6" xl="6">
              <dl>
                <!-- Firmware version -->
                <dt>{{ $t('pageInventory.table.firmwareVersion') }}</dt>
                <dd>{{ dataFormatter(item.firmwareVersion) }}</dd>
              </dl>
            </b-col>
          </b-row>
        </b-container>
      </template>
      <template #empty>
        <span v-if="isBusy">
          {{ $t('global.table.loading') }}
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
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import { reactive, ref, computed, onBeforeMount, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import stores from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';

const { successToast, errorToast } = useToast();
const { t } = useI18n();
const isBusy = ref(false);
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();

const chassisStore = stores.ChassisStore();

const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'id',
    label: t('pageInventory.table.id'),
    formatter: dataFormatter,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'health',
    label: t('pageInventory.table.health'),
    formatter: dataFormatter,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'status',
    label: t('pageUserManagement.table.status'),
    formatter: dataFormatter,
    tdClass: 'text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'locationNumber',
    label: t('pageInventory.table.locationNumber'),
    formatter: dataFormatter,
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
  chassisStore.fetchGetChassisInfo().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-chassis-complete');
    isBusy.value = false;
  });
});

const chassis = computed(() => {
  return chassisStore.chassis;
});

watch(
  () => chassis,
  () => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
    });
  },
  { deep: true },
);

function toggleIdentifyLedValue(row) {
  chassisStore
    .updateIdentifyLedValue({ uri: row.uri, identifyLed: row.identifyLed })
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}
function hasIdentifyLed(identifyLed) {
  return typeof identifyLed === 'boolean';
}
function getStatusTooltip(status) {
  switch (status) {
    case 'Enabled':
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
.b-table-sticky-header {
  overflow: visible !important;
}
</style>
