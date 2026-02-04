<template>
  <page-section :section-title="$t('pageInventory.system')">
    <b-table
      responsive="md"
      hover
      show-empty
      sticky-header="75vh"
      :items="systems"
      :fields="fields"
      :empty-text="
        isBusy ? $t('global.table.loading') : $t('global.table.emptyMessage')
      "
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <BButton
          variant="link"
          data-test-id="hardwareStatus-button-expandSystem"
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

      <template #row-details="{ item }">
        <b-container fluid>
          <b-row style="margin-left: 5px">
            <b-col class="mt-2" sm="6">
              <dl>
                <!-- Serial number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
                <!-- Model -->
                <dt>{{ $t('pageInventory.table.model') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
                <!-- Power state -->
                <dt>{{ $t('pageInventory.table.power') }}</dt>
                <dd>{{ dataFormatter(item.powerState) }}</dd>
                <!-- Asset tag -->
                <dt>
                  {{ $t('pageInventory.table.assetTag') }}
                  <info-tooltip
                    class="info-icon"
                    :title="$t('pageInventory.table.assetTagInfo')"
                  />
                </dt>
                <dd class="mb-2">
                  {{ dataFormatter(item.assetTag) }}
                </dd>
              </dl>
            </b-col>
            <b-col class="mt-2" sm="6">
              <dl class="ml-4">
                <!-- Total system memory -->
                <dt>{{ $t('pageInventory.table.totalSystemMemoryGiB') }}</dt>
                <dd>{{ dataFormatter(item.totalSystemMemoryGiB) }}GB</dd>
              </dl>
              <dl class="ml-4">
                <!-- Count -->
                <dt>{{ $t('pageInventory.table.processorCount') }}</dt>
                <dd>{{ dataFormatter(item.processorSummaryCount) }}</dd>
                <!-- Core Count -->
                <dt>{{ $t('pageInventory.table.coreCount') }}</dt>
                <dd>{{ dataFormatter(item.processorSummaryCoreCount) }}</dd>
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
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useTableRowExpandComposable from '../../../components/Composables/useTableRowExpandComposable';
import { computed, onBeforeMount, reactive, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import stores from '../../../store';
import eventBus from '@/eventBus';

const { dataFormatter, statusIconValue } = useDataFormatterGlobal();
const { expandRowLabel, toggleRow } = useTableRowExpandComposable();
const { t } = useI18n();

const systemStore = stores.SystemStore();

const isBusy = ref(false);
const fields = reactive([
  {
    key: 'expandRow',
    label: '',
    tdClass: 'table-row-expand',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'name',
    label: t('pageInventory.table.name'),
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
]);

onBeforeMount(() => {
  isBusy.value = true;
  systemStore.getSystem().finally(() => {
    eventBus.emit('hardware-status-system-complete');
    isBusy.value = false;
  });
});

const systems = computed(() => {
  return systemStore.systems;
});

watch(
  () => systems,
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
