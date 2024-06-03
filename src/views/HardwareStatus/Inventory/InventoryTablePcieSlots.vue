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

<script>
import PageSection from '@/components/Global/PageSection';
import TableCellCount from '@/components/Global/TableCellCount';

import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import TableSortMixin from '@/components/Mixins/TableSortMixin';
import Search from '@/components/Global/Search';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  components: { PageSection, Search, TableCellCount },
  mixins: [BVToastMixin, DataFormatterMixin, TableSortMixin, SearchFilterMixin],
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
          key: 'type',
          label: 'Slot type',
          formatter: this.dataFormatter,
          sortable: true,
          class: 'text-center',
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
      ],
      searchFilter: searchFilter,
      searchTotalFilteredRows: 0,
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
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
