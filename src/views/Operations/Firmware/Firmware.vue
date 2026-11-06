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

    <!-- Power off confirmation (opened from the context menu) -->
    <BModal
      v-model="isPowerOffModalOpen"
      :title="$t('pageFirmware.contextMenu.powerOffModalTitle')"
      ok-variant="danger"
      :ok-title="$t('pageFirmware.contextMenu.powerOff')"
      :cancel-title="$t('global.action.cancel')"
      @ok="onPowerOffConfirm"
    >
      <p>{{ $t('pageFirmware.contextMenu.powerOffModalMessage') }}</p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContextMenu } from '@/components/ContextMenu';
import useToast from '@/components/Composables/useToastComposable';
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
import { useDelayedPowerOff } from '@/api/composables/useDelayedPowerOff';

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
const { serverStatus, refetch: refetchSystemInfo } = useSystemInfo();

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

// ── Context menu: power off server ──────────────────────────────────────────
const { t } = useI18n();
const { errorToast, warningToast, infoToast, successToast } = useToast();
const { isPowerOffRequested, requestPowerOff } = useDelayedPowerOff();
const isPowerOffModalOpen = ref(false);

// Disabled while the server is off, and from the moment a power off has been
// confirmed. After a confirmed power off it stays disabled until the page is
// loaded again; it is enabled back only if the request or the check fails.
const isPowerOffDisabled = computed(
  () => isServerOff.value || isPowerOffRequested.value,
);

function onPowerOffConfirm() {
  requestPowerOff({
    onPoweredOff: () => {
      successToast(t('pageFirmware.contextMenu.powerOffSuccess'));
      refetchSystemInfo();
    },
    onTimeout: () =>
      warningToast(t('pageFirmware.contextMenu.powerOffTimeout')),
  })
    .then(() => infoToast(t('pageFirmware.contextMenu.powerOffRequested')))
    .catch(() => errorToast(t('pageFirmware.contextMenu.powerOffError')));
}

useContextMenu({
  items: computed(() => [
    {
      key: 'powerOffServer',
      label: t('pageFirmware.contextMenu.powerOff'),
      disabled: isPowerOffDisabled.value,
    },
  ]),
  handlers: {
    powerOffServer: () => {
      if (isPowerOffDisabled.value) return;
      isPowerOffModalOpen.value = true;
    },
  },
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
