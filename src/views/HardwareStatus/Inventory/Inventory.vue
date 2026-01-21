<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.inventory')" />

    <!-- Service indicators -->
    <service-indicator />

    <!-- Chassis table -->
    <table-chassis />
    <b-row>
      <b-col>
        <b-card no-body>
          <b-tabs content-class="mt-3" active-nav-item-class="text-dark" fill>
            <b-tab
              v-for="(value, index) in chassis"
              :key="index"
              :title="
                index === 0
                  ? $t('pageInventory.systemChassis')
                  : $t('pageInventory.ioExpansionChassis') + `${index}`
              "
              :disabled="index !== currentTab && isBusy"
              @click="currentTabUpdate(index)"
            >
              <b-container fluid="xl">
                <!-- Quicklinks section -->
                <page-section
                  v-if="currentTab === 0"
                  :section-title="$t('pageInventory.quicklinkTitle')"
                >
                  <b-row class="w-75">
                    <b-col
                      v-for="column in quicklinkColumns"
                      :key="column.id"
                      xl="4"
                    >
                      <div v-for="item in column" :key="item.id">
                        <b-link
                          :href="item.href"
                          :data-ref="item.dataRef"
                          @click.prevent="
                            scrollToOffsetInventory($event, currentTab)
                          "
                        >
                          <jump-link /> {{ item.linkText }}
                        </b-link>
                      </div>
                    </b-col>
                  </b-row>
                </page-section>
                <page-section
                  v-else
                  :section-title="$t('pageInventory.quicklinkTitle')"
                >
                  <b-row class="w-75">
                    <b-col
                      v-for="column in quicklinkMexColumns"
                      :key="column.id"
                      xl="4"
                    >
                      <div v-for="item in column" :key="item.id">
                        <b-link
                          :href="item.href"
                          :data-ref="item.dataRef"
                          @click.prevent="
                            scrollToOffsetInventory($event, currentTab)
                          "
                        >
                          <jump-link /> {{ item.linkText }}
                        </b-link>
                      </div>
                    </b-col>
                  </b-row>
                </page-section>
                <!-- System table -->
                <table-system v-if="currentTab === 0" ref="system" />

                <!-- BMC manager table -->
                <table-bmc-manager v-if="currentTab === 0" ref="bmc" />

                <!-- DIMM slot table -->
                <table-dimm-slot v-if="currentTab === 0" ref="dimms" />

                <!-- Fans table -->
                <table-fans
                  v-if="currentTab === 0"
                  ref="fans"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Power supplies table -->
                <table-power-supplies
                  v-if="currentTab === 0"
                  ref="powerSupply"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Processors table -->
                <table-processors v-if="currentTab === 0" ref="processors" />

                <!-- Assembly table -->
                <table-assembly
                  v-if="currentTab === 0"
                  ref="assembly"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- PCIe slots table -->
                <table-pcie-slots
                  v-if="currentTab === 0"
                  ref="pcieSlots"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Fabric Adapters -->
                <table-fabric-adapters
                  v-if="currentTab === 0"
                  ref="fabricAdapters"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Mex Chassis -->
                <alert
                  v-if="currentTab > 0 && isPoweredOff"
                  variant="info"
                  class="mb-4"
                >
                  <span>
                    {{ $t('pageInventory.alert.powerOffExpansionChassis') }}
                  </span>
                </alert>
                <!-- Fans table -->
                <table-fans
                  v-if="currentTab > 0"
                  ref="fans"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Power supplies table -->
                <table-power-supplies
                  v-if="currentTab > 0"
                  ref="powerSupply"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Assembly table -->
                <table-assembly
                  v-if="currentTab > 0"
                  ref="assembly"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- PCIe slots table -->
                <table-pcie-slots
                  v-if="currentTab > 0"
                  ref="pcieSlots"
                  :chassis="chassis[currentTab].uri"
                />

                <!-- Fabric Adapters -->
                <table-fabric-adapters
                  v-if="currentTab > 0"
                  ref="fabricAdapters"
                  :chassis="chassis[currentTab].uri"
                />
              </b-container>
            </b-tab>
          </b-tabs>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import Alert from '@/components/Global/Alert';
import PageTitle from '@/components/Global/PageTitle';
import TableSystem from './InventoryTableSystem';
import TablePowerSupplies from './InventoryTablePowerSupplies';
import TableDimmSlot from './InventoryTableDimmSlot';
import TableFans from './InventoryTableFans';
import TableBmcManager from './InventoryTableBmcManager';
import TableChassis from './InventoryTableChassis';
import TableProcessors from './InventoryTableProcessors';
import TableAssembly from './InventoryTableAssembly';
import TableFabricAdapters from './InventoryFabricAdapters';
import TablePcieSlots from './InventoryTablePcieSlots';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import PageSection from '@/components/Global/PageSection';
import ServiceIndicator from './InventoryServiceIndicator';
import JumpLink16 from '@carbon/icons-vue/es/jump-link/16';
import JumpLinkMixin from '@/components/Mixins/JumpLinkMixin';
import { chunk } from 'lodash';

export default {
  components: {
    Alert,
    PageTitle,
    ServiceIndicator,
    TableDimmSlot,
    TablePowerSupplies,
    TableSystem,
    TableFans,
    TableBmcManager,
    TableChassis,
    TableProcessors,
    TableAssembly,
    TablePcieSlots,
    TableFabricAdapters,
    PageSection,
    JumpLink: JumpLink16,
  },
  mixins: [LoadingBarMixin, JumpLinkMixin],
  beforeRouteLeave(to, from, next) {
    // Hide loader if user navigates away from page
    // before requests complete
    this.hideLoader();
    next();
  },
  data() {
    return {
      isBusy: false,
      currentTab: 0,
      links: [
        {
          id: 'system',
          dataRef: 'system',
          href: '#system',
          linkText: this.$t('pageInventory.system'),
        },
        {
          id: 'bmc',
          dataRef: 'bmc',
          href: '#bmc',
          linkText: this.$t('pageInventory.bmcManager'),
        },
        {
          id: 'dimms',
          dataRef: 'dimms',
          href: '#dimms',
          linkText: this.$t('pageInventory.dimmSlot'),
        },
        {
          id: 'fans',
          dataRef: 'fans',
          href: '#fans',
          linkText: this.$t('pageInventory.fans'),
        },
        {
          id: 'powerSupply',
          dataRef: 'powerSupply',
          href: '#powerSupply',
          linkText: this.$t('pageInventory.powerSupplies'),
        },
        {
          id: 'processors',
          dataRef: 'processors',
          href: '#processors',
          linkText: this.$t('pageInventory.processors'),
        },
        {
          id: 'assembly',
          dataRef: 'assembly',
          href: '#assembly',
          linkText: this.$t('pageInventory.assemblies'),
        },
        {
          id: 'pcieSlots',
          dataRef: 'pcieSlots',
          href: '#pcieSlots',
          linkText: this.$t('pageInventory.pcieSlots'),
        },
        {
          id: 'fabricAdapters',
          dataRef: 'fabricAdapters',
          href: '#fabricAdapters',
          linkText: this.$t('pageInventory.fabricAdapters'),
        },
      ],
      mexLinks: [
        {
          id: 'fans',
          dataRef: 'fans',
          href: '#fans',
          linkText: this.$t('pageInventory.fans'),
        },
        {
          id: 'powerSupply',
          dataRef: 'powerSupply',
          href: '#powerSupply',
          linkText: this.$t('pageInventory.powerSupplies'),
        },
        {
          id: 'assembly',
          dataRef: 'assembly',
          href: '#assembly',
          linkText: this.$t('pageInventory.assemblies'),
        },
        {
          id: 'pcieSlots',
          dataRef: 'pcieSlots',
          href: '#pcieSlots',
          linkText: this.$t('pageInventory.pcieSlots'),
        },
        {
          id: 'fabricAdapters',
          dataRef: 'fabricAdapters',
          href: '#fabricAdapters',
          linkText: this.$t('pageInventory.fabricAdapters'),
        },
      ],
    };
  },
  computed: {
    quicklinkColumns() {
      // Chunk links array to 3 array's to display 3 items per column
      return chunk(this.links, 3);
    },
    quicklinkMexColumns() {
      // Chunk links array to 2 array's to display 2 items per column
      return chunk(this.mexLinks, 2);
    },
    chassis() {
      return this.$store.getters['chassis/chassis'];
    },
    isPoweredOff() {
      if (this.$store.getters['global/serverStatus'] === 'off') {
        return true;
      } else {
        return false;
      }
    },
  },
  watch: {
    currentTab: function () {
      this.getAllInfo('watched');
    },
  },
  created() {
    this.getAllInfo('created');
  },
  methods: {
    currentTabUpdate(index) {
      this.currentTab = index;
    },
    getAllInfo(value) {
      this.startLoader();
      this.isBusy = true;
      this.$store.dispatch('chassis/getChassisInfo');
      const bmcManagerTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-bmc-manager-complete', () => resolve());
      });
      const chassisTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-chassis-complete', () => resolve());
      });
      const dimmSlotTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-dimm-slot-complete', () => resolve());
      });
      const fansTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-fans-complete', () => resolve());
      });
      const powerSuppliesTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-power-supplies-complete', () =>
          resolve()
        );
      });
      const processorsTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-processors-complete', () => resolve());
      });
      const serviceIndicatorPromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-service-complete', () => resolve());
      });
      const systemTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-system-complete', () => resolve());
      });
      const assemblyTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-assembly-complete', () => resolve());
      });
      const pcieSlotsTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-pcie-slots-complete', () => resolve());
      });
      const fabricAdaptersTablePromise = new Promise((resolve) => {
        this.$root.$on('hardware-status-fabric-adapters-complete', () =>
          resolve()
        );
      });
      if (this.currentTab === 0 && value === 'created') {
        // Combine all child component Promises to indicate
        // when page data load complete
        Promise.all([
          bmcManagerTablePromise,
          chassisTablePromise,
          dimmSlotTablePromise,
          fansTablePromise,
          powerSuppliesTablePromise,
          processorsTablePromise,
          serviceIndicatorPromise,
          systemTablePromise,
          assemblyTablePromise,
          pcieSlotsTablePromise,
          fabricAdaptersTablePromise,
        ]).finally(() => {
          this.endLoader();
          this.isBusy = false;
        });
      } else if (this.currentTab === 0 && value === 'watched') {
        // Combine all child component Promises to indicate
        // when page data load complete
        Promise.all([
          bmcManagerTablePromise,
          dimmSlotTablePromise,
          fansTablePromise,
          powerSuppliesTablePromise,
          processorsTablePromise,
          systemTablePromise,
          assemblyTablePromise,
          pcieSlotsTablePromise,
          fabricAdaptersTablePromise,
        ]).finally(() => {
          this.endLoader();
          this.isBusy = false;
        });
      } else {
        Promise.all([
          fansTablePromise,
          powerSuppliesTablePromise,
          assemblyTablePromise,
          pcieSlotsTablePromise,
          fabricAdaptersTablePromise,
        ]).finally(() => {
          this.endLoader();
          this.isBusy = false;
        });
      }
    },
  },
};
</script>
