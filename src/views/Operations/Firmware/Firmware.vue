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
          @loadingStatus="loadingStatus"
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
            <p class="font-weight-bold p2">
              {{ lowestSupportedFirmwareVersion }}
            </p>
          </alert>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="mb-4" sm="8" md="6" xl="4">
          <!-- Update form -->
          <form-update
            :is-page-disabled="isPageDisabled"
            @loadingStatus="loadingStatus"
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
import { ref, computed, onBeforeMount } from 'vue';
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

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const globalStore = stores.GlobalStore();
const firmwareStore = stores.FirmwareStore();
const controlStore = stores.ControlStore();
const licenseStore = stores.LicenseStore();

const isServerPowerOffRequired = ref(
  import.meta.env.VITE_APP_SERVER_OFF_REQUIRED === 'true',
);

const lowestSupportedFirmwareVersion = ref('');

const showAlert = ref(false);

const isLoading = ref(loading.value);

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});

const isSingleFileUploadEnabled = computed(() => {
  return firmwareStore.isSingleFileUploadEnabled;
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

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  Promise.all([
    licenseStore.getLicenses(),
    firmwareStore.getFirmwareInformation(),
    firmwareStore.getFirmwareBootSide(),
    firmwareStore.getLowestSupportedFirmwareVersion().then(() => {
      lowestSupportedFirmwareVersion.value =
        firmwareStore.lowestSupportedFirmwareVersionGetter;
    }),
    firmwareStore.getLowestSupportedFirmwareVersion().then(() => {
      showAlert.value = firmwareStore.showAlertGetter;
    }),
  ]).finally(() => endLoader());
});
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
