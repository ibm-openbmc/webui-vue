<template>
  <page-section :section-title="$t('pageInventory.pcieSlots')">
    {{ $t('pageInventory.pcieTopologyLinkDescription') }}
    <b-link href="#/hardware-status/pcie-topology">{{
      $t('pageInventory.pcieTopologyLink')
    }}</b-link>
    <b-row class="align-items-end">
      <b-col sm="6" md="5" xl="4">
        <search
          @change-search="onChangeSearchInput"
          @clear-search="onClearSearchInput"
        />
      </b-col>
      <b-col sm="6" md="3" xl="2">
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
      :items="pcieSlots"
      :fields="fields"
      :sort-desc="false"
      :sort-compare="sortCompare"
      :filter="searchFilter"
      :empty-text="$t('global.table.emptyMessage')"
      :empty-filtered-text="$t('global.table.emptySearchMessage')"
      :busy="isBusy"
      @filtered="onFiltered"
    >
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="inventory-button-expandPcieSlots"
          :title="expandRowLabel"
          class="btn-icon-only"
          @click="toggleRowDetails(row)"
        >
          <icon-chevron />
          <span class="sr-only">{{ expandRowLabel }}</span>
        </b-button>
      </template>

      <!-- Toggle identify LED -->
      <template #cell(identifyLed)="row">
        <b-form-checkbox
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
      </template>
      <template #cell(ledStatus)="row">
        <led-component
          :ref="`identifyPciSlotLedRef${row.item.locationNumber}`"
          :led-value="row.item.identifyLed"
          off-colour="white"
          on-colour="amber"
        ></led-component>
      </template>

      <template #row-details="{ item }">
        <b-container fluid>
          <b-row>
            <b-col sm="6" xl="6">
              <dl>
                <dt>{{ $t('pageInventory.table.slotType') }}</dt>
                <dd>{{ dataFormatter(item.type) }}</dd>
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
import TableCellCount from '@/components/Global/TableCellCount';

import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import TableSortMixin from '@/components/Mixins/TableSortMixin';
import Search from '@/components/Global/Search';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';
import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LedComponent from '@/components/Global/LedComponent';

export default {
  components: {
    IconChevron,
    PageSection,
    Search,
    TableCellCount,
    LedComponent,
  },
  mixins: [
    BVToastMixin,
    TableRowExpandMixin,
    DataFormatterMixin,
    TableSortMixin,
    SearchFilterMixin,
  ],
  props: {
    chassis: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      isBusy: true,
      fields: [
        {
          key: 'expandRow',
          label: '',
          tdClass: 'table-row-expand',
          sortable: false,
        },
        {
          key: 'type',
          label: this.$t('pageInventory.table.slotType'),
          formatter: this.dataFormatter,
          sortable: true,
        },
        {
          key: 'locationNumber',
          label: this.$t('pageInventory.table.locationNumber'),
          formatter: this.dataFormatter,
          sortable: true,
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
      searchFilter: searchFilter,
      searchTotalFilteredRows: 0,
      expandRowLabel: expandRowLabel,
    };
  },
  computed: {
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.pcieSlots.length;
    },
    pcieSlots() {
      let slotsList = [];
      const slots = this.$store.getters['pcieSlots/pcieSlots'];
      slots.map((slot) => {
        if (slot.type !== 'OEM') {
          slotsList.push(slot);
        }
      });
      return slotsList;
    },
    serverStatus() {
      if (this.chassis.endsWith('chassis')) {
        return false;
      } else if (this.$store.getters['global/serverStatus'] !== 'on') {
        return true;
      } else {
        return false;
      }
    },
  },
  watch: {
    chassis: function (value) {
      this.$store
        .dispatch('pcieSlots/getPcieSlotsInfo', { uri: value })
        .finally(() => {
          this.$root.$emit('hardware-status-pcie-slots-complete');
          this.isBusy = false;
        });
    },
  },
  created() {
    this.$store
      .dispatch('pcieSlots/getPcieSlotsInfo', { uri: this.chassis })
      .finally(() => {
        this.$root.$emit('hardware-status-pcie-slots-complete');
        this.isBusy = false;
      });
  },
  methods: {
    sortCompare(a, b, key) {
      if (key === 'health') {
        return this.sortStatus(a, b, key);
      }
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    toggleIdentifyLedValue(row) {
      this.$store
        .dispatch('pcieSlots/updateIdentifyLedValue', {
          locationNumber: row.locationNumber,
          identifyLed: row.identifyLed,
          uri: this.chassis,
        })
        .then(() => {
          if (!(row.health === 'Critical')) {
            if (row.identifyLed) {
              this.$refs[
                'identifyPciSlotLedRef' + `${row.locationNumber}`
              ].startBlinking();
            } else {
              this.$refs[
                'identifyPciSlotLedRef' + `${row.locationNumber}`
              ].stopBlinking();
            }
          } else {
            this.$refs[
              'identifyPciSlotLedRef' + `${row.locationNumber}`
            ].turnon();
          }
        })
        .catch(({ message }) => {
          this.$refs[
            'identifyPciSlotLedRef' + `${row.locationNumber}`
          ].turnErrorColor();
          this.errorToast(message);
        });
    },
  },
};
</script>
