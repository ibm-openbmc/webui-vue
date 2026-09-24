<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.firmware')" />
    <alerts-server-power
      :is-server-off="isServerOff"
      :server-status="serverStatus"
    />

    <!-- Firmware cards -->
    <BRow>
      <BCol xl="10">
        <!-- BMC Firmware -->
        <bmc-cards
          :is-page-disabled="isPageDisabled"
          :is-server-off="isServerOff"
          @loading-status="loadingStatus"
        />

        <!-- Host Firmware -->
        <host-cards v-if="!isSingleFileUploadEnabled" />
      </BCol>
    </BRow>

    <!-- Update firmware-->
    <page-section :section-title="$t('pageFirmware.sectionTitleUpdateFirmware')"
      ><BRow>
        <BCol sm="14" md="10" xl="6">
          <alert :show="showAlert" variant="info" class="mb-5">
            <p class="mb-0 p1">{{ $t('global.toast.minMifMessage') }}:</p>
            <h5 class="fw-bold p2">
              {{ lowestSupportedFirmwareVersion }}
            </h5>
          </alert>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="mb-4" sm="8" md="6" xl="4">
          <!-- Update form -->
          <form-update
            :is-page-disabled="isPageDisabled"
            @loading-status="loadingStatus"
          />
        </BCol>
        <BCol sm="8" md="6" xl="4">
          <!-- Access key expiration -->
          <firmware-access-key :is-page-disabled="isPageDisabled" />
        </BCol>
      </BRow>
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref, computed } from 'vue';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import Alert from '@/components/Global/Alert.vue';
import AlertsServerPower from './FirmwareAlertServerPower.vue';
import BmcCards from './FirmwareCardsBmc.vue';
import HostCards from './FirmwareCardsHost.vue';
import FormUpdate from './FirmwareFormUpdate.vue';
import FirmwareAccessKey from './FirmwareAccessKey.vue';
import stores from '@/store';
import { useFirmware } from '@/api/composables/useFirmware';
import { useCapacityOnDemand } from '@/api/composables/useCapacityOnDemand';
import { useSystemInfo } from '@/api/composables/useSystemInfo';

const controlStore = stores.ControlStore();

// Use the new VueQuery composables
const {
  isSingleFileUploadEnabled,
  lowestSupportedFirmwareVersion: lowestSupportedData,
  isFetching: isFirmwareFetching,
  isError,
} = useFirmware();

// Also fetch license data for access key
useCapacityOnDemand();

// Live server status from VueQuery (polls every 60 s via systemInfo preset)
const { serverStatus } = useSystemInfo();

const isServerPowerOffRequired = ref('true');
const isLoading = ref(loading.value);

usePageLoadingBar(isFirmwareFetching, isError);

const isServerOff = computed(() => {
  return serverStatus.value === 'off';
});

const lowestSupportedFirmwareVersion = computed(() => {
  return lowestSupportedData.value?.version || '';
});

const showAlert = computed(() => {
  return lowestSupportedData.value?.showAlert || false;
});

const isOperationInProgress = computed(() => {
  return controlStore.getIsOperationInProgress;
});

const isPageDisabled = computed(() => {
  // Disable when server is powered on (not off and not unreachable).
  const isPoweredOn =
    serverStatus.value !== 'off' && serverStatus.value !== 'unreachable';
  return isPoweredOn || loading.value || isOperationInProgress.value;
});

function loadingStatus(value) {
  isLoading.value = value;
}
</script>

<style lang="scss" scoped>
.p1 {
  display: inline-block;
}
.p2 {
  margin-left: 5px;
  display: inline-block;
}
</style>
