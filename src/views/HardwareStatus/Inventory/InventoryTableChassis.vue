<template>
  <page-section :section-title="$t('pageInventory.chassis')">
    <b-table
      responsive="md"
      hover
      :items="chassis"
      :fields="fields"
      show-empty
      :empty-text="$t('global.table.emptyMessage')"
      :busy="isBusy"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="hardwareStatus-button-expandChassis"
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
          row.item.statusState === 'Absent'
            ? $t('global.status.absent')
            : $t('global.status.present')
        }}
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
      </template>

      <template #cell(ledStatus)="row">
        <led-component
          ref="identifyChassisLedRef"
          :led-value="row.item.identifyLed"
          off-colour="white"
          on-colour="amber"
          class="align-middle"
        ></led-component>
      </template>

      <template #row-details="{ item }">
        <b-container fluid>
          <b-row>
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
    </b-table>
  </page-section>
</template>

<script>
import PageSection from '@/components/Global/PageSection';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import StatusIcon from '@/components/Global/StatusIcon';
import LedComponent from '@/components/Global/LedComponent';

import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  components: { IconChevron, PageSection, StatusIcon, LedComponent },
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
          key: 'id',
          label: this.$t('pageInventory.table.id'),
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
        {
          key: 'locationNumber',
          label: this.$t('pageInventory.table.locationNumber'),
          formatter: this.dataFormatter,
        },
        {
          key: 'identifyLed',
          label: this.$t('pageInventory.table.identifyLed'),
          formatter: this.dataFormatter,
        },
        {
          key: 'ledStatus',
          label: 'Physical LED State',
          formatter: this.dataFormatter,
        },
      ],
      expandRowLabel: expandRowLabel,
    };
  },
  computed: {
    chassis() {
      return this.$store.getters['chassis/chassis'];
    },
  },
  created() {
    this.$store.dispatch('chassis/getChassisInfo').finally(() => {
      // Emit initial data fetch complete to parent component
      this.$root.$emit('hardware-status-chassis-complete');
      this.isBusy = false;
    });
  },
  methods: {
    toggleIdentifyLedValue(row) {
      this.$store
        .dispatch('chassis/updateIdentifyLedValue', {
          uri: row.uri,
          identifyLed: row.identifyLed,
        })
        .then(() => {
          if (!(row.health === 'Critical')) {
            if (row.identifyLed) {
              this.$refs.identifyChassisLedRef.startBlinking();
            } else {
              this.$refs.identifyChassisLedRef.stopBlinking();
            }
          } else {
            this.$refs.identifyChassisLedRef.turnon();
          }
        })
        .catch(({ message }) => {
          this.$refs.identifyChassisLedRef.turnErrorColor();
          this.errorToast(message);
        });
    },
    // TO DO: Remove this method when the LocationIndicatorActive is added from backend.
    hasIdentifyLed(identifyLed) {
      return typeof identifyLed === 'boolean';
    },
  },
};
</script>
