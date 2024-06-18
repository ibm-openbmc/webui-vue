<template>
  <page-section :section-title="$t('pageInventory.fans')">
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
          :total-number-of-cells="fans.length"
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
      :items="fans"
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
          data-test-id="inventory-button-expandFans"
          :title="expandRowLabel"
          class="btn-icon-only"
          @click="toggleRowDetails(row)"
        >
          <icon-chevron />
          <span class="sr-only">{{ expandRowLabel }}</span>
        </b-button>
      </template>
      <!-- Name -->
      <template #cell(name)="row">
        {{ row.item.name }}
      </template>
      <!-- Health -->
      <template #cell(health)="{ value }">
        <status-icon
          v-if="isIoExpansionChassis && isPoweredOff"
          :status="statusIcon('')"
        />
        <status-icon v-else :status="statusIcon(value)" />
        {{
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : value === 'OK'
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
          isIoExpansionChassis && isPoweredOff
            ? $t('global.status.unavailable')
            : row.item.status === 'Present'
              ? $t('global.status.present')
              : row.item.status === 'Absent'
                ? $t('global.status.absent')
                : row.item.status === 'Deferring'
                  ? $t('global.status.deferring')
                  : row.item.status === 'Disabled'
                    ? $t('global.status.disabled')
                    : row.item.status === 'InTest'
                      ? $t('global.status.inTest')
                      : row.item.status === 'Qualified'
                        ? $t('global.status.qualified')
                        : row.item.status === 'Quiesced'
                          ? $t('global.status.quiesced')
                          : row.item.status === 'StandbyOffline'
                            ? $t('global.status.standbyOffline')
                            : row.item.status === 'StandbySpare'
                              ? $t('global.status.standbySpare')
                              : row.item.status === 'Starting'
                                ? $t('global.status.starting')
                                : row.item.status === 'UnavailableOffline'
                                  ? $t('global.status.unavailableOffline')
                                  : row.item.status === 'Updating'
                                    ? $t('global.status.updating')
                                    : row.item.status
        }}
        <info-tooltip :title="getStatusTooltip(row.item.status)" />
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
                <!-- Name -->
                <dt>{{ $t('pageInventory.table.name') }}</dt>
                <dd>{{ dataFormatter(item.name) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Serial number -->
                <dt>{{ $t('pageInventory.table.serialNumber') }}</dt>
                <dd>{{ dataFormatter(item.serialNumber) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
                <!-- Part number -->
                <dt>{{ $t('pageInventory.table.partNumber') }}</dt>
                <dd>{{ dataFormatter(item.partNumber) }}</dd>
              </dl>
            </b-col>
            <b-col sm="6" xl="6">
              <dl v-if="!isIoExpansionChassis">
                <!-- Spare part number -->
                <dt>{{ $t('pageInventory.table.sparePartNumber') }}</dt>
                <dd>{{ dataFormatter(item.sparePartNumber) }}</dd>
              </dl>
              <dl v-if="!isIoExpansionChassis">
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

<script>
import PageSection from '@/components/Global/PageSection';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import TableCellCount from '@/components/Global/TableCellCount';
import InfoTooltip from '@/components/Global/InfoTooltip';

import StatusIcon from '@/components/Global/StatusIcon';
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

export default {
  components: {
    IconChevron,
    PageSection,
    StatusIcon,
    Search,
    TableCellCount,
    InfoTooltip,
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
        : this.fans.length;
    },
    fans() {
      return this.$store.getters['fan/fans'];
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
  },
  watch: {
    chassis: function (value) {
      this.$store.dispatch('fan/getAllFans', { uri: value }).finally(() => {
        // Emit initial data fetch complete to parent component
        this.$root.$emit('hardware-status-fans-complete');
        this.isBusy = false;
      });
    },
  },
  created() {
    this.$store
      .dispatch('fan/getAllFans', { uri: this.chassis })
      .finally(() => {
        // Emit initial data fetch complete to parent component
        this.$root.$emit('hardware-status-fans-complete');
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
        .dispatch('fan/updateIdentifyLedValue', {
          uri: row.uri,
          identifyLed: row.identifyLed,
        })
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    hasIdentifyLed(identifyLed) {
      return typeof identifyLed === 'boolean';
    },
    getStatusTooltip(status) {
      switch (status) {
        case 'Present':
          return this.$t('pageInventory.enumDescriptionIndicator.enabled');
        case 'Absent':
          return this.$t('pageInventory.enumDescriptionIndicator.absent');
        case 'Deferring':
          return this.$t('pageInventory.enumDescriptionIndicator.deferring');
        case 'Disabled':
          return this.$t('pageInventory.enumDescriptionIndicator.disabled');
        case 'InTest':
          return this.$t('pageInventory.enumDescriptionIndicator.inTest');
        case 'Qualified':
          return this.$t('pageInventory.enumDescriptionIndicator.qualified');
        case 'Quiesced':
          return this.$t('pageInventory.enumDescriptionIndicator.quiesced');
        case 'StandbyOffline':
          return this.$t(
            'pageInventory.enumDescriptionIndicator.standbyOffline',
          );
        case 'StandbySpare':
          return this.$t('pageInventory.enumDescriptionIndicator.standbySpare');
        case 'Starting':
          return this.$t('pageInventory.enumDescriptionIndicator.starting');
        case 'UnavailableOffline':
          return this.$t(
            'pageInventory.enumDescriptionIndicator.unavailableOffline',
          );
        case 'Updating':
          return this.$t('pageInventory.enumDescriptionIndicator.updating');
        default:
          return '';
      }
    },
  },
};
</script>
