<template>
  <page-section :section-title="$t('pageInventory.system')">
    <b-table
      responsive="md"
      hover
      show-empty
      :items="systems"
      :fields="fields"
      :empty-text="$t('global.table.emptyMessage')"
      :busy="isBusy"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="hardwareStatus-button-expandSystem"
          :title="expandRowLabel"
          class="btn-icon-only"
          @click="toggleRowDetails(row)"
        >
          <icon-chevron />
          <span class="sr-only">{{ expandRowLabel }}</span>
        </b-button>
      </template>

      <!-- Health -->
      <template #cell(health)="{ value }">
        <status-icon :status="statusIcon(value)" />
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
      </template>

      <template #row-details="{ item }">
        <b-container fluid>
          <b-row>
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
                  <info-tooltip class="info-icon" :title="$t('pageInventory.table.assetTagInfo')" />
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

<script>
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import PageSection from '@/components/Global/PageSection';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import InfoTooltip from '@/components/Global/InfoTooltip';
import StatusIcon from '@/components/Global/StatusIcon';

import TableRowExpandMixin, { expandRowLabel } from '@/components/Mixins/TableRowExpandMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  components: { IconChevron, InfoTooltip, PageSection, StatusIcon },
  mixins: [BVToastMixin, TableRowExpandMixin, DataFormatterMixin],
  data() {
    return {
      isBusy: true,
      fields: [
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
        },
        {
          key: 'name',
          label: this.$t('pageInventory.table.name'),
          formatter: this.dataFormatter,
        },
        {
          key: 'health',
          label: this.$t('pageInventory.table.health'),
          formatter: this.dataFormatter,
          tdClass: 'text-nowrap',
        },
        {
          key: 'status',
          label: this.$t('pageUserManagement.table.status'),
          formatter: this.dataFormatter,
          tdClass: 'text-nowrap',
        },
      ],
      expandRowLabel: expandRowLabel,
    };
  },
  computed: {
    systems() {
      return this.$store.getters['system/systems'];
    },
  },
  created() {
    this.$store.dispatch('system/getSystem').finally(() => {
      // Emit initial data fetch complete to parent component
      this.$root.$emit('hardware-status-system-complete');
      this.isBusy = false;
    });
  },
  methods: {
    toggleIdentifyLedSwitch(state) {
      this.$store
        .dispatch('system/changeIdentifyLedState', state)
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
<style lang="scss" scoped>
.info-icon {
  width: 25px !important;
  height: 23px !important;
}
</style>
