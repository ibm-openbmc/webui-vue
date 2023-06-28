<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.pcieTopology')" />
    <b-row>
      <b-col md="8" xl="6">
        <alert v-if="isInPhypStandby" variant="info" class="mb-4">
          <span>
            {{ $t('pagePcieTopology.alert') }}
          </span>
        </alert>
        <alert v-else variant="warning" class="mb-4">
          <span>
            {{ $t('pagePcieTopology.warning') }}
            <b-link href="#/operations/server-power-operations">{{
              $t('pagePower.alert.message3Link')
            }}</b-link>
          </span>
        </alert>
      </b-col>
    </b-row>
    <b-row class="align-items-start">
      <b-col sm="8" xl="6" class="d-sm-flex align-items-end mb-4">
        <search
          :placeholder="$t('pagePcieTopology.table.search')"
          data-test-id="pcie-input-search"
          @change-search="onChangeSearchInput"
          @clear-search="onClearSearchInput"
        />
        <div class="ml-sm-4">
          <table-cell-count
            :filtered-items-count="filteredRows"
            :total-number-of-cells="entries.length"
          ></table-cell-count>
        </div>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="text-right">
        <table-filter :filters="tableFilters" @filter-change="onFilterChange" />
        <b-button
          v-if="isServiceUser"
          variant="primary"
          :disabled="isBusy"
          @click="savePcieTopology"
        >
          {{ $t('pagePcieTopology.savePcieTopology') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-table
          id="table-pcie-topology"
          ref="table"
          responsive="xl"
          no-select-on-click
          sort-icon-left
          hover
          no-sort-reset
          :sort-desc="false"
          show-empty
          sort-by="id"
          :fields="fields"
          :busy="isBusy"
          :filter="searchFilter"
          :empty-text="$t('global.table.emptyMessage')"
          :empty-filtered-text="$t('global.table.emptySearchMessage')"
          :items="filteredEntries"
          :per-page="perPage"
          :current-page="currentPage"
          @filtered="onFiltered"
        >
          <template #cell(localPortLocation)="{ item }">
            <template v-if="item.localPortLocation.length > 0">
              <span
                v-for="(value, index) in item.localPortLocation"
                :key="'localPortLocation ' + index"
              >
                {{ value.locationNumber }}
              </span>
            </template>
            <span v-else>--</span>
          </template>
          <template #cell(remotePortLocation)="{ item }">
            <template v-if="item.remotePortLocation.length > 0">
              <span
                v-for="(value, index) in item.remotePortLocation"
                :key="'remotePortLocation ' + index"
              >
                {{ value.locationNumber }}
              </span>
            </template>
            <span v-else>--</span>
          </template>
          <!-- Expand chevron icon -->
          <template #cell(expandRow)="row">
            <b-button
              variant="link"
              :aria-label="expandRowLabel"
              :title="expandRowLabel"
              class="btn-icon-only"
              @click="toggleRowDetails(row)"
            >
              <icon-chevron />
            </b-button>
          </template>
          <template #row-details="{ item }">
            <b-container fluid>
              <b-row>
                <b-col lg="4" xl="4" md="4" sm="4" xs="4">
                  <dl class="fontStyle">
                    <!-- Link properties -->
                    <dt class="headerStyle">
                      {{ $t('pagePcieTopology.linkProperties') }}:
                    </dt>
                    <dd>
                      {{ $t('pagePcieTopology.speed') }}:
                      {{ dataFormatter(item.linkPropertiesSpeed) }}
                    </dd>
                    <dd>
                      {{ $t('pagePcieTopology.width') }}:
                      {{ dataFormatter(item.linkPropertiesWidth) }}
                    </dd>
                    <dd>
                      {{ $t('pagePcieTopology.type') }}:
                      {{ dataFormatter(item.linkPropertiesType) }}
                    </dd>
                  </dl>
                </b-col>
                <b-col class="section-left-divider">
                  <b-row>
                    <b-col>
                      <dl class="fontStyle">
                        <!-- PCIe Bridge -->
                        <dt class="headerStyle">
                          {{ $t('pagePcieTopology.bridgeOrHost') }}:
                        </dt>
                        <dd>
                          {{ dataFormatter(item.pcieBridge.locationNumber) }}
                        </dd>
                      </dl>
                    </b-col>
                    <b-col class="text-nowrap">
                      <b-button
                        v-if="item.resetLinkAvailable"
                        class="btn btn-secondary float-right"
                        target="_blank"
                        @click="openResetLinkModal(item)"
                      >
                        {{ $t('pagePcieTopology.resetLink') }}
                      </b-button>
                    </b-col>
                  </b-row>
                  <div v-for="(value, i) in item.cablePartNumber" :key="i">
                    <div class="section-divider mb-3 mt-2"></div>
                    <div class="fontStyle headerStyle">
                      {{ dataFormatter('Cable ' + (i + 1)) }}
                    </div>
                    <b-row>
                      <b-col lg="5" xl="5" md="5" sm="5" xs="5">
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.localPort') }}:
                          {{
                            item.localPortLocation.length > 0 &&
                            item.localPortLocation[i]
                              ? item.localPortLocation[i].locationNumber
                              : '--'
                          }}
                        </div>
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.remotePort') }}:
                          {{
                            dataFormatter(
                              item.remotePortLocation.length > 0 &&
                                item.remotePortLocation[i]
                                ? item.remotePortLocation[i].locationNumber
                                : '--'
                            )
                          }}
                        </div>
                      </b-col>
                      <b-col lg="4" xl="4" md="4" sm="4" xs="4">
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.partNumber') }}:
                          {{ dataFormatter(value) }}
                        </div>
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.cableType') }}:
                          {{ dataFormatter(item.cableType[i]) }}
                        </div>
                      </b-col>
                      <b-col lg="3" xl="3" md="3" sm="3" xs="3">
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.cableLength') }}:
                          {{ dataFormatter(item.cableLength[i]) }}m
                        </div>
                        <div class="fontStyle">
                          {{ $t('pagePcieTopology.cableStatus') }}:
                          {{ dataFormatter(item.cableStatus[i]) }}
                        </div>
                      </b-col>
                    </b-row>
                  </div>
                  <div class="section-divider mb-3 mt-2"></div>
                  <div class="fontStyle headerStyle">
                    {{ $t('pagePcieTopology.ioSlots') }}
                  </div>
                  <b-row>
                    <b-col>
                      <template v-if="item.ioSlots.length > 0">
                        <div
                          v-for="(val, i) in item.ioSlots"
                          :key="i"
                          class="fontStyle"
                        >
                          {{ dataFormatter(val.locationNumber) }}
                        </div>
                      </template>
                      <div v-else>--</div>
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>
            </b-container>
          </template>
          <!-- Actions column -->
          <template #cell(actions)="{ item }">
            <span class="identifyLedStyle" @click="openIdentifyLedsModal(item)">
              {{ $t('pagePcieTopology.identifyLed') }}
            </span>
          </template>
        </b-table>
      </b-col>
    </b-row>
    <!-- Table pagination -->
    <b-row>
      <b-col sm="6">
        <b-form-group
          class="table-pagination-select"
          :label="$t('global.table.itemsPerPage')"
          label-for="pagination-items-per-page"
        >
          <b-form-select
            id="pagination-items-per-page"
            v-model="perPage"
            :options="itemsPerPageOptions"
          />
        </b-form-group>
      </b-col>
      <b-col sm="6">
        <b-pagination
          v-model="currentPage"
          first-number
          last-number
          :per-page="perPage"
          :total-rows="getTotalRowCount(filteredRows)"
          aria-controls="table-event-logs"
        />
      </b-col>
    </b-row>
    <!-- Modals -->
    <modal-reset :reset-type="resetOption" :reset-uri="resetLinkUri" />
    <modal-leds :selected-obj="selectedObj" />
  </b-container>
</template>

<script>
import Alert from '@/components/Global/Alert';
import IconChevron from '@carbon/icons-vue/es/chevron--down/20';
import PageTitle from '@/components/Global/PageTitle';
import Search from '@/components/Global/Search';
import TableCellCount from '@/components/Global/TableCellCount';
import TableFilter from '@/components/Global/TableFilter';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import TableFilterMixin from '@/components/Mixins/TableFilterMixin';
import BVPaginationMixin, {
  currentPage,
  perPage,
  itemsPerPageOptions,
} from '@/components/Mixins/BVPaginationMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import TableSortMixin from '@/components/Mixins/TableSortMixin';
import ModalReset from './ResetLinkModal';
import ModalLeds from './IdentifyLedsModal';
import TableRowExpandMixin, {
  expandRowLabel,
} from '@/components/Mixins/TableRowExpandMixin';
import SearchFilterMixin, {
  searchFilter,
} from '@/components/Mixins/SearchFilterMixin';

export default {
  name: 'PcieTopology',
  components: {
    Alert,
    IconChevron,
    PageTitle,
    Search,
    TableCellCount,
    TableFilter,
    ModalReset,
    ModalLeds,
  },
  mixins: [
    BVPaginationMixin,
    BVToastMixin,
    LoadingBarMixin,
    TableFilterMixin,
    DataFormatterMixin,
    TableSortMixin,
    TableRowExpandMixin,
    SearchFilterMixin,
  ],
  data() {
    return {
      isBusy: true,
      resetOption: null,
      resetLinkUri: '',
      selectedObj: {},
      fields: [
        {
          key: 'expandRow',
          label: '',
          formatter: this.dataFormatter,
          tdClass: 'table-row-expand',
        },
        {
          key: 'id',
          label: this.$t('pagePcieTopology.id'),
          formatter: this.dataFormatter,
          sortable: true,
        },
        {
          key: 'parentId',
          label: this.$t('pagePcieTopology.parentId'),
          formatter: this.dataFormatter,
          sortable: true,
          tdClass: 'text-nowrap',
        },
        {
          key: 'linkStatus',
          label: this.$t('pagePcieTopology.linkStatus'),
          formatter: this.dataFormatter,
          sortable: false,
          tdClass: 'text-nowrap',
        },
        {
          key: 'localPortLocation',
          label: this.$t('pagePcieTopology.localPortLocation'),
          formatter: this.dataFormatter,
          sortable: false,
          tdClass: 'text-break',
        },
        {
          key: 'remotePortLocation',
          label: this.$t('pagePcieTopology.remotePortLocation'),
          formatter: this.dataFormatter,
          sortable: false,
        },
        {
          key: 'actions',
          sortable: false,
          formatter: this.dataFormatter,
          label: ' ',
          tdClass: 'text-right text-nowrap',
        },
      ],
      tableFilters: [
        {
          key: 'linkStatus',
          label: this.$t('pagePcieTopology.table.linkStatusType'),
          values: [
            this.$t('pagePcieTopology.table.filter.degraded'),
            this.$t('pagePcieTopology.table.filter.inactive'),
            this.$t('pagePcieTopology.table.filter.open'),
            this.$t('pagePcieTopology.table.filter.operational'),
            this.$t('pagePcieTopology.table.filter.unknown'),
            this.$t('pagePcieTopology.table.filter.failed'),
          ],
        },
      ],
      expandRowLabel,
      activeFilters: [],
      batchActions: [
        {
          value: 'delete',
          label: this.$t('global.action.delete'),
        },
      ],
      currentPage: currentPage,
      itemsPerPageOptions: itemsPerPageOptions,
      perPage: perPage,
      searchFilter: searchFilter,
      searchTotalFilteredRows: 0,
    };
  },
  computed: {
    filteredRows() {
      return this.searchFilter
        ? this.searchTotalFilteredRows
        : this.filteredEntries.length;
    },
    entries() {
      return this.$store.getters['pcieTopology/entries'];
    },
    filteredEntries() {
      return this.getFilteredTableData(this.entries, this.activeFilters);
    },
    isInPhypStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
  },
  created() {
    this.$store.dispatch('global/getBootProgress').then(() => {
      this.checkIfInPhypStandby();
    });
  },
  methods: {
    checkIfInPhypStandby(checkCounter = 0) {
      checkCounter++;
      if (this.isInPhypStandby) {
        this.startLoader();
        this.$store.dispatch('pcieTopology/refreshPage').then(() => {
          this.$store.dispatch('pcieTopology/getTopologyScreen').finally(() => {
            this.isBusy = false;
            this.endLoader();
          });
        });
      } else {
        setTimeout(() => {
          this.checkIfInPhypStandby(checkCounter);
        }, 6000);
      }
    },
    openResetLinkModal(value) {
      this.resetOption = value.id;
      this.resetLinkUri = value.resetLinkUri;
      this.$bvModal.show('modal-reset');
    },
    openIdentifyLedsModal(value) {
      this.selectedObj = value;
      this.$bvModal.show('modal-leds');
    },
    savePcieTopology() {
      this.$store
        .dispatch('pcieTopology/savePcie')
        .then(() =>
          this.successToast(
            this.$t('pagePcieTopology.toast.successSavePcieTopology')
          )
        )
        .catch(() =>
          this.errorToast(
            this.$t('pagePcieTopology.toast.errorSavePcieTopology')
          )
        );
    },
    onFilterChange({ activeFilters }) {
      this.activeFilters = activeFilters;
    },
    onFiltered(filteredItems) {
      this.searchTotalFilteredRows = filteredItems.length;
    },
  },
};
</script>
<style scoped>
.identifyLedStyle {
  color: rgb(1, 80, 230);
  cursor: pointer;
}
.fontStyle {
  font-size: 14px;
}
.headerStyle {
  font-weight: bold;
}
</style>
