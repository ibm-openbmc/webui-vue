<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.overview')" />
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
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
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
import {
  useSystemInfo,
  useUpdateAssetTag,
} from '@/api/composables/useSystemInfo';
import {
  usePowerControl,
  usePowerPerformanceMode,
  useIdlePowerSaver,
} from '@/api/composables/usePowerControl';
import {
  useOverviewFirmware,
  useOverviewLicense,
  useOverviewNetwork,
  useOverviewEvents,
  useOverviewInventory,
  useOverviewQuickLinks,
} from '@/api/composables/useOverview';

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const showDumps = ref(import.meta.env.VITE_APP_ENV_NAME === 'ibm');

// Use VueQuery composables for all Overview data
const { isFetching: isSystemInfoFetching, isError: isSystemInfoError } =
  useSystemInfo();
const { isUpdating: isAssetTagUpdating } = useUpdateAssetTag();
const { isPowerControlFetching, isPowerControlError } = usePowerControl();
const { isPowerPerformanceFetching, isPowerPerformanceError } =
  usePowerPerformanceMode();
const { isIdlePowerSaverFetching, isIdlePowerSaverError } = useIdlePowerSaver();
const { isFetching: isFirmwareFetching, isError: isFirmwareError } =
  useOverviewFirmware();
const { isFetching: isLicenseFetching, isError: isLicenseError } =
  useOverviewLicense();
const { isFetching: isNetworkFetching, isError: isNetworkError } =
  useOverviewNetwork();
const { isFetching: isEventsFetching, isError: isEventsError } =
  useOverviewEvents();
const { isFetching: isInventoryFetching, isError: isInventoryError } =
  useOverviewInventory();
const { isFetching: isQuickLinksFetching, isError: isQuickLinksError } =
  useOverviewQuickLinks();

// Child components (OverviewServer, OverviewFirmware, OverviewPower, etc.) share
// the same queries — watch from script-setup time so we catch the fetch before
// onMounted fires.
const isPageFetching = computed(
  () =>
    isSystemInfoFetching.value ||
    isPowerControlFetching.value ||
    isPowerPerformanceFetching.value ||
    isIdlePowerSaverFetching.value ||
    isFirmwareFetching.value ||
    isLicenseFetching.value ||
    isNetworkFetching.value ||
    isEventsFetching.value ||
    isInventoryFetching.value ||
    isQuickLinksFetching.value,
);

let mountFetchDone = false;
let awaitingFetch = false;

watch(
  isPageFetching,
  (fetching) => {
    if (mountFetchDone) return;
    if (fetching) {
      if (!awaitingFetch) {
        awaitingFetch = true;
        startLoader();
      }
    } else if (awaitingFetch) {
      awaitingFetch = false;
      mountFetchDone = true;
      endLoader();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (!awaitingFetch) mountFetchDone = true;
});

onBeforeUnmount(() => {
  hideLoader();
});

// User-triggered asset tag mutation — always shows the bar
watch(isAssetTagUpdating, (updating) => {
  if (updating) {
    startLoader();
  } else {
    endLoader();
  }
});
</script>
