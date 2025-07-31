<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.overview')"/>
    <overview-quick-links class="mb-4" />
    <page-section
      :section-title="$t('pageOverview.systemInformation')"
      class="mb-1"
    >
      <BCardGroup deck>
        <overview-server />
        <overview-firmware />
      </BCardGroup>
      <BCardGroup deck>
        <overview-network />
        <overview-power />
      </BCardGroup>
    </page-section>
    <page-section :section-title="$t('pageOverview.statusInformation')">
      <BCardGroup deck>
        <overview-events />
        <overview-inventory />
        <overview-dumps v-if="showDumps" />
      </BCardGroup>
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import OverviewQuickLinks from './OverviewQuickLinks.vue';
import OverviewServer from './OverviewServer.vue';
import OverviewFirmware from './OverviewFirmware.vue';
import OverviewNetwork from './OverviewNetwork.vue';
import OverviewPower from './OverviewPower.vue';
import OverviewEvents from './OverviewEvents.vue';
import OverviewInventory from './OverviewInventory.vue';
import OverviewDumps from './OverviewDumps.vue';
import stores from '@/store';
import eventBus from '@/eventBus';

const { startLoader, endLoader } = useLoadingBar();

const userManagementStore = stores.UserManagementStore();

const showDumps = ref(import.meta.env.VITE_APP_ENV_NAME === 'ibm');

onBeforeMount(() => {
    startLoader();
    const dumpsPromise = new Promise((resolve) => {
      eventBus.on('overview-dumps-complete', () => resolve());
    });
    const eventsPromise = new Promise((resolve) => {
      eventBus.on('overview-events-complete', () => resolve());
    });
    const firmwarePromise = new Promise((resolve) => {
      eventBus.on('overview-firmware-complete', () => resolve());
    });
    const inventoryPromise = new Promise((resolve) => {
      eventBus.on('overview-inventory-complete', () => resolve());
    });
    const networkPromise = new Promise((resolve) => {
      eventBus.on('overview-network-complete', () => resolve());
    });
    const powerPromise = new Promise((resolve) => {
      eventBus.on('overview-power-complete', () => resolve());
    });
    const quicklinksPromise = new Promise((resolve) => {
      eventBus.on('overview-quicklinks-complete', () => resolve());
    });
    const serverPromise = new Promise((resolve) => {
      eventBus.on('overview-server-complete', () => resolve());
    });

    Promise.all([
      dumpsPromise,
      eventsPromise,
      firmwarePromise,
      inventoryPromise,
      networkPromise,
      powerPromise,
      quicklinksPromise,
      serverPromise,
      userManagementStore.getUsers(),
    ]).finally(() => endLoader());

  });

</script>
