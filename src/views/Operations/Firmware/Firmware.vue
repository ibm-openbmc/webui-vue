<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.firmware')" />
    <alerts-server-power
      v-if="isServerPowerOffRequired"
      :is-server-off="isServerOff"
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
import { ref, computed, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
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

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const globalStore = stores.GlobalStore();
const controlStore = stores.ControlStore();

// Use the new VueQuery composables
const {
  isSingleFileUploadEnabled,
  lowestSupportedFirmwareVersion: lowestSupportedData,
  isFetching,
  isError,
} = useFirmware();

// Also fetch license data for access key
useCapacityOnDemand();

const isServerPowerOffRequired = ref('true');
const isLoading = ref(loading.value);

// Manage loading bar for query fetching state
watch(
  isFetching,
  (fetching) => {
    if (fetching) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

// Stop the loading bar when the fetch fails
watch(isError, (hasError) => {
  if (hasError) {
    endLoader();
  }
});

onBeforeRouteLeave(() => {
  hideLoader();
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
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
  if (isServerPowerOffRequired.value) {
    return !isServerOff.value || loading.value || isOperationInProgress.value;
  }
  return isLoading.value || isOperationInProgress.value;
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
