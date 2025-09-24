<template>
  <b-container fluid="xl" class="inventory-container">
    <page-title :title="$t('appPageTitle.inventory')" />

    <!-- Service indicators -->
    <service-indicator />

    <!-- Chassis table -->
    <table-chassis />
    <b-row>
      <b-col>
        <b-card no-body>
          <b-tabs content-class="mt-3" fill>
            <b-tab
              v-for="(val, index) in chassis"
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
                      <div
                        v-for="item in column"
                        :key="item.id"
                        class="no-underline-link"
                      >
                        <BLink
                          :href="item.href"
                          :data-ref="item.dataRef"
                          @click.prevent="
                            scrollToOffsetInventory($refs, $event, index)
                          "
                        >
                          <icon-jump-link /> {{ item.linkText }}
                        </BLink>
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
                        <BLink
                          :href="item.href"
                          :data-ref="item.dataRef"
                          @click.prevent="
                            scrollToOffsetInventory($refs, $event, index)
                          "
                        >
                          <jump-link /> {{ item.linkText }}
                        </BLink>
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

<script setup>
import Alert from '@/components/Global/Alert.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableSystem from './InventoryTableSystem.vue';
import TablePowerSupplies from './InventoryTablePowerSupplies.vue';
import TableDimmSlot from './InventoryTableDimmSlot.vue';
import TableFans from './InventoryTableFans.vue';
import TableBmcManager from './InventoryTableBmcManager.vue';
import TableChassis from './InventoryTableChassis.vue';
import TableProcessors from './InventoryTableProcessors.vue';
import TableAssembly from './InventoryTableAssembly.vue';
import TableFabricAdapters from './InventoryFabricAdapters.vue';
import TablePcieSlots from './InventoryTablePcieSlots.vue';
import PageSection from '@/components/Global/PageSection.vue';
import ServiceIndicator from './InventoryServiceIndicator.vue';
import { default as IconJumpLink } from '@carbon/icons-vue/es/jump-link/16';
import { chunk } from 'lodash';
import { computed, watch, onBeforeMount, ref, reactive } from 'vue';
import ChassisStore from '../../../store/modules/HardwareStatus/ChassisStore';
import stores from '@/store';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import eventBus from '@/eventBus';
import { useI18n } from 'vue-i18n';
import useJumpLinkComposable from '../../../components/Composables/useJumpLinkComposable';
import { BLink } from 'bootstrap-vue-next';

const { startLoader, endLoader } = useLoadingBar();
const { t } = useI18n();
const { scrollToOffsetInventory } = useJumpLinkComposable();

const chassisStore = ChassisStore();
const global = stores.GlobalStore();

const isBusy = ref(false);
const currentTab = ref(0);

const links = reactive([
  {
    id: 'system',
    dataRef: 'system',
    href: '#system',
    linkText: t('pageInventory.system'),
  },
  {
    id: 'bmc',
    dataRef: 'bmc',
    href: '#bmc',
    linkText: t('pageInventory.bmcManager'),
  },
  {
    id: 'dimms',
    dataRef: 'dimms',
    href: '#dimms',
    linkText: t('pageInventory.dimmSlot'),
  },
  {
    id: 'fans',
    dataRef: 'fans',
    href: '#fans',
    linkText: t('pageInventory.fans'),
  },
  {
    id: 'powerSupply',
    dataRef: 'powerSupply',
    href: '#powerSupply',
    linkText: t('pageInventory.powerSupplies'),
  },
  {
    id: 'processors',
    dataRef: 'processors',
    href: '#processors',
    linkText: t('pageInventory.processors'),
  },
  {
    id: 'assembly',
    dataRef: 'assembly',
    href: '#assembly',
    linkText: t('pageInventory.assemblies'),
  },
  {
    id: 'pcieSlots',
    dataRef: 'pcieSlots',
    href: '#pcieSlots',
    linkText: t('pageInventory.pcieSlots'),
  },
  {
    id: 'fabricAdapters',
    dataRef: 'fabricAdapters',
    href: '#fabricAdapters',
    linkText: t('pageInventory.fabricAdapters'),
  },
]);
const mexLinks = reactive([
  {
    id: 'fans',
    dataRef: 'fans',
    href: '#fans',
    linkText: t('pageInventory.fans'),
  },
  {
    id: 'powerSupply',
    dataRef: 'powerSupply',
    href: '#powerSupply',
    linkText: t('pageInventory.powerSupplies'),
  },
  {
    id: 'assembly',
    dataRef: 'assembly',
    href: '#assembly',
    linkText: t('pageInventory.assemblies'),
  },
  {
    id: 'pcieSlots',
    dataRef: 'pcieSlots',
    href: '#pcieSlots',
    linkText: t('pageInventory.pcieSlots'),
  },
  {
    id: 'fabricAdapters',
    dataRef: 'fabricAdapters',
    href: '#fabricAdapters',
    linkText: t('pageInventory.fabricAdapters'),
  },
]);

onBeforeMount(() => {
  getAllInfo('created');
});

const quicklinkColumns = computed(() => {
  return chunk(links, 3);
});
const quicklinkMexColumns = computed(() => {
  return chunk(mexLinks, 2);
});
const chassis = computed(() => {
  return chassisStore.chassis;
});
const serverStatus = computed(() => global.serverStatus);
const isPoweredOff = computed(() =>
  serverStatus.value === 'off' ? true : false,
);

watch(
  () => currentTab,
  () => {
    getAllInfo('watched');
  },
);

function getAllInfo(val) {
  startLoader();
  isBusy.value = true;
  chassisStore.fetchGetChassisInfo();
  const bmcManagerTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-bmc-manager-complete', () => resolve());
  });
  const chassisTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-chassis-complete', () => resolve());
  });
  const dimmSlotTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-dimm-slot-complete', () => resolve());
  });
  const fansTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-fans-complete', () => resolve());
  });
  const powerSuppliesTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-power-supplies-complete', () => resolve());
  });
  const processorsTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-processors-complete', () => resolve());
  });
  const serviceIndicatorPromise = new Promise((resolve) => {
    eventBus.on('hardware-status-service-complete', () => resolve());
  });
  const systemTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-system-complete', () => resolve());
  });
  const assemblyTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-assembly-complete', () => resolve());
  });
  const pcieSlotsTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-pcie-slots-complete', () => resolve());
  });
  const fabricAdaptersTablePromise = new Promise((resolve) => {
    eventBus.on('hardware-status-fabric-adapters-complete', () => resolve());
  });
  if (currentTab.value === 0 && val === 'created') {
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
      endLoader();
      isBusy.value = false;
    });
  } else if (currentTab.value === 0 && val === 'watched') {
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
      endLoader();
      isBusy.value = false;
    });
  } else {
    Promise.all([
      fansTablePromise,
      powerSuppliesTablePromise,
      assemblyTablePromise,
      pcieSlotsTablePromise,
      fabricAdaptersTablePromise,
    ]).finally(() => {
      endLoader();
      isBusy.value = false;
    });
  }
}
function currentTabUpdate(index) {
  currentTab.value = index;
}
</script>

<style lang="scss" scoped>
.inventory-container {
  min-width: 90%;
}
.no-underline-link {
  ::v-deep a {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
