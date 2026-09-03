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
import { ref, watch } from 'vue';
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

const { startLoader, endLoader } = useLoadingBar();

const showDumps = ref(import.meta.env.VITE_APP_ENV_NAME === 'ibm');

// Use VueQuery composables for all Overview data
const { isLoading: isSystemInfoLoading, isError: isSystemInfoError } =
  useSystemInfo();
const { isUpdating: isAssetTagUpdating } = useUpdateAssetTag();
const { isPowerControlFetching, isPowerControlError } = usePowerControl();
const { isPowerPerformanceFetching, isPowerPerformanceError } =
  usePowerPerformanceMode();
const { isIdlePowerSaverFetching, isIdlePowerSaverError } = useIdlePowerSaver();
const { isLoading: isFirmwareLoading, isError: isFirmwareError } =
  useOverviewFirmware();
const { isLoading: isLicenseLoading, isError: isLicenseError } =
  useOverviewLicense();
const { isLoading: isNetworkLoading, isError: isNetworkError } =
  useOverviewNetwork();
const { isLoading: isEventsLoading, isError: isEventsError } =
  useOverviewEvents();
const { isLoading: isInventoryLoading, isError: isInventoryError } =
  useOverviewInventory();
const { isLoading: isQuickLinksLoading, isError: isQuickLinksError } =
  useOverviewQuickLinks();

// Track overall loading state
const isAnyLoading = ref(false);

// Watch all loading states
watch(
  [
    isSystemInfoLoading,
    isPowerControlFetching,
    isPowerPerformanceFetching,
    isIdlePowerSaverFetching,
    isFirmwareLoading,
    isLicenseLoading,
    isNetworkLoading,
    isEventsLoading,
    isInventoryLoading,
    isQuickLinksLoading,
  ],
  (loadingStates) => {
    const loading = loadingStates.some((state) => state);

    if (loading && !isAnyLoading.value) {
      isAnyLoading.value = true;
      startLoader();
    } else if (!loading && isAnyLoading.value) {
      isAnyLoading.value = false;
      endLoader();
    }
  },
  { immediate: true },
);

// Watch mutation state separately
watch(isAssetTagUpdating, (updating) => {
  if (updating) {
    startLoader();
  } else {
    endLoader();
  }
});

// Stop the loading bar when any fetch fails
watch(
  [
    isSystemInfoError,
    isPowerControlError,
    isPowerPerformanceError,
    isIdlePowerSaverError,
    isFirmwareError,
    isLicenseError,
    isNetworkError,
    isEventsError,
    isInventoryError,
    isQuickLinksError,
  ],
  (errorStates) => {
    if (errorStates.some((state) => state)) {
      endLoader();
    }
  },
);
</script>