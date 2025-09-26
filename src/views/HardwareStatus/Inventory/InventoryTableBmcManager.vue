<template>
  <page-section :section-title="$t('pageInventory.bmcManager')">
    <b-table
      responsive="md"
      hover
      sticky-header="75vh"
      :items="items"
      :fields="fields"
      show-empty
      :empty-text="$t('global.table.emptyMessage')"
      :busy="isBusy"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <BButton
          variant="link"
          data-test-id="hardwareStatus-button-expandBmc"
          :title="expandRowLabel"
          :class="
            row.item.toggleDetails ? 'rotateSvg btn-icon-only' : 'btn-icon-only'
          "
          @click="toggleRow(row)"
        >
          <icon-chevron />
        </BButton>
      </template>
      <!-- Name -->
      <template #cell(name)="row">
        {{
          row.item.name === 'OpenBmc Manager'
            ? $t('pageEventLogs.bmcManager')
            : row.item.name
        }}
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
        <info-tooltip :title="getStatusTooltip(row.item.statusState)" />
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
            <b-col class="mt-2">
              <dl>
                <!-- Description -->
                <dt>{{ $t('pageInventory.table.description') }}</dt>
                <dd>
                  {{
                    item.description === 'Baseboard Management Controller'
                      ? $t('pageInventory.baseboardManagementController')
                      : dataFormatter(item.description)
                  }}
                </dd>
                <!-- Part number -->
                <dt>{{ $t('pageInventory.table.partNumber') }}</dt>
                <dd>{{ dataFormatter(item.partNumber) }}</dd>
                <!-- Serial number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
                <!-- Spare part number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
                <!-- Model -->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
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
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import { reactive, ref, computed, onBeforeMount } from 'vue';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';
import { useI18n } from 'vue-i18n';
import useToast from '@/components/Composables/useToastComposable';

const { successToast, errorToast } = useToast();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const { dataFormatter, statusIconValue } = useDataFormatterGlobal();
const { t } = useI18n();

const bmcStore = stores.BmcStore();

const isBusy = ref(true);

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
  },
  {
    key: 'health',
    label: t('pageInventory.table.health'),
    formatter: dataFormatter,
  },
  {
    key: 'status',
    label: t('pageUserManagement.table.status'),
    formatter: dataFormatter,
    tdClass: 'text-nowrap',
  },
  {
    key: 'locationNumber',
    label: t('pageInventory.table.locationNumber'),
    formatter: dataFormatter,
  },
  {
    key: 'identifyLed',
    label: t('pageInventory.table.identifyLed'),
    formatter: dataFormatter,
  },
]);

onBeforeMount(() => {
  bmcStore.getBmcInfo().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-bmc-manager-complete');
    isBusy.value = false;
  });
});

const bmc = computed(() => {
  return bmcStore.bmcGetter;
});

const items = computed(() => {
  if (bmc.value) {
    return [bmc.value];
  } else {
    return [];
  }
});

function toggleIdentifyLedValue(row) {
  bmcStore
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
.info-icon {
  width: 25px !important;
  height: 23px !important;
}
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
</style>
