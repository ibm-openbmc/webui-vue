<template>
  <page-section :section-title="$t('pageInventory.assemblies')">
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
          :total-number-of-cells="items.length"
        ></table-cell-count>
      </b-col>
    </b-row>
    <b-table
      sort-icon-left
      no-sort-reset
      hover
      sort-by="name"
      :sort-desc="false"
      responsive="xl"
      :items="items"
      :fields="tableHeaders"
      :filter="searchFilter"
      show-empty
      :empty-text="$t('global.table.emptyMessage')"
      :empty-filtered-text="$t('global.table.emptySearchMessage')"
      :busy="isBusy"
      @filtered="onFiltered"
    >
      <template #head(identifyLed)="row">
        {{ row.label }}
        <info-tooltip :title="$t('pageInventory.identifyLedInfo')" />
      </template>
      <!-- Expand chevron icon -->
      <template #cell(expandRow)="row">
        <b-button
          variant="link"
          data-test-id="hardwareStatus-button-expandAssembly"
          :title="expandRowLabel"
          class="btn-icon-only"
          @click="toggleRowDetails(row)"
        >
          <icon-chevron />
          <span class="sr-only">{{ expandRowLabel }}</span>
        </b-button>
      </template>
      <!-- Health -->
      <template #cell(health)="row">
        <status-icon
          v-if="isIoExpansionChassis && isPoweredOff"
          :status="statusIcon('')"
        />
        <status-icon v-else :status="statusIcon(row.item.health)" />
        {{
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : row.item.health === 'OK'
            ? $t('global.status.ok')
            : row.item.health === 'Warning'
            ? $t('global.status.warning')
            : row.item.health === 'Critical'
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
            : $t('global.status.absent')
        }}
      </template>
      <!-- Toggle identify LED -->
      <template #cell(identifyLed)="row">
        <b-form-checkbox
          v-if="hasIdentifyLed(row.item.identifyLed)"
          v-model="row.item.identifyLed"
          name="switch"
          :disabled="serverStatus"
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
          <b-row>
            <b-col class="mt-2" sm="6" xl="6">
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
            </b-col>
            <b-col class="mt-2" sm="6" xl="6">
              <dl v-if="!isIoExpansionChassis">
                <!-- Model-->
                <dt>{{ $t('pageInventory.table.bmcManagerModel') }}</dt>
                <dd>{{ dataFormatter(item.model) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Spare Part Number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
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
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';
import InfoTooltip from '@/components/Global/InfoTooltip';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  components: { IconChevron, Search, InfoTooltip, PageSection, TableCellCount },
  mixins: [
    BVToastMixin,
    SearchFilterMixin,
    TableRowExpandMixin,
    DataFormatterMixin,
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
        },
        {
          key: 'name',
          label: this.$t('pageInventory.table.name'),
          formatter: this.dataFormatter,
          sortable: true,
        },
        {
          key: 'health',
          label: this.$t('pageInventory.table.health'),
          formatter: this.dataFormatter,
          sortable: true,
          tdClass: 'text-nowrap',
        },
        {
          key: 'status',
          label: this.$t('pageUserManagement.table.status'),
          formatter: this.dataFormatter,
          sortable: true,
          tdClass: 'text-nowrap',
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
      expandRowLabel: expandRowLabel,
    };
  },
  computed: {
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.items.length;
    },
    assemblies() {
      return this.$store.getters['assemblies/assemblies'];
    },
    items() {
      if (this.assemblies) {
        return this.assemblies;
      } else {
        return [];
      }
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
    isPoweredOff() {
      if (this.$store.getters['global/serverStatus'] === 'off') {
        return true;
      } else {
        return false;
      }
    },
    isIoExpansionChassis() {
      if (this.chassis.endsWith('chassis')) {
        return false;
      } else {
        return true;
      }
    },
    tableHeaders() {
      let tempFields = [...this.fields];
      if (!this.isIoExpansionChassis) {
        tempFields.splice(4, 0, {
          key: 'partNumber',
          label: this.$t('pageInventory.table.partNumber'),
          formatter: this.dataFormatter,
          sortable: true,
        });
      }
      return tempFields;
    },
  },
  watch: {
    chassis: function (value) {
      this.$store
        .dispatch('assemblies/getAssemblyInfo', { uri: value })
        .finally(() => {
          // Emit initial data fetch complete to parent component
          this.$root.$emit('hardware-status-assembly-complete');
          this.isBusy = false;
        });
    },
  },
  created() {
    this.$store
      .dispatch('assemblies/getAssemblyInfo', { uri: this.chassis })
      .finally(() => {
        // Emit initial data fetch complete to parent component
        this.$root.$emit('hardware-status-assembly-complete');
        this.isBusy = false;
      });
  },
  methods: {
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
    toggleIdentifyLedValue(row) {
      this.$store
        .dispatch('assemblies/updateIdentifyLedValue', {
          uri: row.uri,
          memberId: row.id,
          identifyLed: row.identifyLed,
        })
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    hasIdentifyLed(identifyLed) {
      return typeof identifyLed === 'boolean';
    },
  },
};
</script>
