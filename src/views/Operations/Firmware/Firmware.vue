<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.firmware')">
      <template #actions>
        <BButton
          variant="link"
          class="btn-icon-only"
          @click="showHelpModal = true"
        >
          <icon-help />
          <span class="sr-only">{{ $t('global.help.title') }}</span>
        </BButton>
      </template>
    </page-title>
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

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="firmwareSearchContent"
      @action="handleHelpAction"
    />
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
import IconHelp from '@carbon/icons-vue/es/help/20';
import HelpModal from '@/components/Global/HelpModal.vue';
import { firmwareSearchContent } from './FirmwareSearchContent.js';
import stores from '@/store';

const showHelpModal = ref(false);

function handleHelpAction(action) {
  // Handle quick actions from help modal
  switch (action) {
    case 'switch-backup':
      // Trigger switch to backup image functionality if available
      break;
    case 'upload-firmware':
      // Focus on firmware upload section
      break;
    case 'manage-key':
      // Trigger manage access key functionality if available
      break;
    default:
      break;
  }
}

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
