<template>
  <div>
    <BContainer fluid="xl">
      <page-title :title="$t('appPageTitle.serverPowerOperations')" />
      <BRow class="mb-4">
        <BCol sm="10">
          <page-section
            class="mb-0"
            :section-title="$t('pageServerPowerOperations.currentStatus')"
          >
            <BRow v-if="isInPhypStandby">
              <BCol>
                <alert variant="info">
                  <h5 class="fw-bold">
                    {{ $t('pageServerPowerOperations.phypStandby') }}
                  </h5>
                  <p class="mt-1">
                    {{ $t('pageServerPowerOperations.osRuntimeMessage') }}
                  </p>
                  <p>
                    {{ $t('pageServerPowerOperations.saveOsRuntimeMessage') }}
                  </p>
                  <p>
                    {{
                      $t('pageServerPowerOperations.discardOsRuntimeMessage')
                    }}
                  </p>
                  <template #action>
                    <BButton
                      variant="link"
                      class="mt-3 d-flex justify-content-between align-items-center"
                      @click="standbyToRuntime"
                    >
                      <span class="pr-1">
                        {{ $t('pageServerPowerOperations.osRuntimeButton') }}
                      </span>
                      <icon-arrow-right />
                    </BButton>
                    <BButton
                      variant="link"
                      class="d-flex justify-content-between align-items-center"
                      @click="saveStandbyToRuntime"
                    >
                      <span class="pr-1">
                        {{
                          $t('pageServerPowerOperations.saveOsRuntimeButton')
                        }}
                      </span>
                      <icon-arrow-right />
                    </BButton>
                    <BButton
                      variant="link"
                      class="d-flex justify-content-between align-items-center"
                      @click="discardStandbyToRuntime"
                    >
                      <span class="pr-1">
                        {{
                          $t('pageServerPowerOperations.discardOsRuntimeButton')
                        }}
                      </span>
                      <icon-arrow-right />
                    </BButton>
                  </template>
                </alert>
              </BCol>
            </BRow>
            <div v-if="!isInPhypStandby" class="form-background pt-3 ps-3">
              <BRow>
                <BCol sm="3">
                  <dl>
                    <dt>{{ $t('pageServerPowerOperations.serverStatus') }}</dt>
                    <dd
                      v-if="serverStatus === 'on'"
                      data-test-id="powerServerOps-text-hostStatus"
                    >
                      {{ $t('global.status.on') }}
                    </dd>
                    <dd
                      v-else-if="serverStatus === 'off'"
                      data-test-id="powerServerOps-text-hostStatus"
                    >
                      {{ $t('global.status.off') }}
                    </dd>
                    <dd v-else>
                      {{ $t('global.status.notAvailable') }}
                    </dd>
                  </dl>
                </BCol>
                <BCol>
                  <dl>
                    <dt>
                      {{ $t('pageServerPowerOperations.lastPowerOperation') }}
                    </dt>
                    <dd
                      v-if="lastPowerOperationTime"
                      data-test-id="powerServerOps-text-lastPowerOp"
                    >
                      {{ $filters.formatDate(lastPowerOperationTime) }}
                      {{ $filters.formatTime(lastPowerOperationTime) }}
                    </dd>
                    <dd v-else>--</dd>
                  </dl>
                </BCol>
              </BRow>
            </div>
          </page-section>
        </BCol>
      </BRow>
      <BRow>
        <BCol>
          <page-section
            :section-title="$t('pageServerPowerOperations.operations')"
          >
            <template v-if="isOperationInProgress">
              <alert variant="info">
                {{ $t('pageServerPowerOperations.operationInProgress') }}
              </alert>
            </template>
            <template v-else-if="serverStatus === 'off'">
              <BButton
                variant="primary"
                data-test-id="serverPowerOperations-button-powerOn"
                @click="powerOn"
              >
                {{ $t('pageServerPowerOperations.powerOn') }}
              </BButton>
            </template>
            <template v-else>
              <BRow>
                <BCol sm="5">
                  <!-- Reboot server -->
                  <BForm
                    novalidate
                    class="mb-5"
                    aria-label="reboot"
                    @submit.prevent="rebootServer"
                  >
                    <BFormGroup class="form-group">
                      <label>{{
                        $t('pageServerPowerOperations.rebootServer')
                      }}</label>
                      <div id="orderly-reboot">
                        {{ $t('pageServerPowerOperations.orderlyReboot') }}
                      </div>
                    </BFormGroup>
                    <BButton
                      variant="primary"
                      type="submit"
                      data-test-id="serverPowerOperations-button-reboot"
                    >
                      {{ $t('pageServerPowerOperations.reboot') }}
                    </BButton>
                  </BForm>
                </BCol>
                <!-- Shutdown server options -->
                <BCol sm="5">
                  <BForm
                    novalidate
                    aria-label="shutdown-server-ops"
                    @submit.prevent="shutdownServer"
                  >
                    <BFormGroup
                      class="form-group"
                      :label="$t('pageServerPowerOperations.shutdownServer')"
                    >
                      <BFormRadio
                        v-model="form.shutdownOption"
                        name="shutdown-option"
                        data-test-id="serverPowerOperations-radio-shutdownOrderly"
                        value="orderly"
                      >
                        {{ $t('pageServerPowerOperations.orderlyShutdown') }}
                      </BFormRadio>
                      <BFormRadio
                        v-model="form.shutdownOption"
                        name="shutdown-option"
                        data-test-id="serverPowerOperations-radio-shutdownImmediate"
                        value="immediate"
                      >
                        {{ $t('pageServerPowerOperations.immediateShutdown') }}
                      </BFormRadio>
                    </BFormGroup>
                    <BButton
                      variant="primary"
                      type="submit"
                      data-test-id="serverPowerOperations-button-shutDown"
                    >
                      {{ $t('pageServerPowerOperations.shutDown') }}
                    </BButton>
                  </BForm>
                </BCol>
              </BRow>
            </template>
          </page-section>
        </BCol>
      </BRow>
      <BRow>
        <BCol sm="8" md="7" lg="7" xl="9">
          <page-section
            :section-title="$t('pageServerPowerOperations.serverBootSettings')"
          >
            <BRow class="mt-3 mb-3">
              <BCol>
                <BButton
                  v-if="isInPhypStandby && hmcInfo !== 'Enabled' && isIBMi"
                  variant="primary"
                  data-test-id="network-settings"
                  @click="openNetworkSettings"
                >
                  {{ 'Network settings' }}
                </BButton>
                <alert v-else variant="info">
                  {{ $t('pageServerPowerOperations.modal.alert.available') }}
                </alert>
              </BCol>
            </BRow>
            <boot-settings
              :is-in-phyp-standby="isInPhypStandby"
              :is-updated="isUpdated"
              :attribute-values="attributeValues"
              :bios-attributes="biosAttributes"
              :ibmi-load-source-value="ibmiLoadSourceValue"
              :ibmi-alt-load-source-value="ibmiAltLoadSourceValue"
              :ibmi-console-value="ibmiConsoleValue"
              :linux-kvm-percentage-value="linuxKvmPercentageValue"
              :linux-kvm-percentage-initial-value="linuxKvmPercentageInitialValue"
              :linux-kvm-percentage-current-value="linuxKvmPercentageCurrentValue"
              :power-restore-policy="powerRestorePolicy"
              :location-codes="locationCodes ?? []"
              :save-bios-settings="saveBiosSettings"
              :save-operating-mode-settings="saveOperatingModeSettings"
              :refetch="refetchBios"
              :is-saving-bios="isSavingBios"
              @update-standby="updateToRuntime()"
            />
          </page-section>
        </BCol>
      </BRow>

      <!-- Modal -->
      <network-settings-modal />
    </BContainer>
    <BModal
      v-model="openModal"
      hide-header-close
      :title="modalOptions.title"
      :ok-title="modalOptions.okTitle"
      :ok-variant="modalOptions.okVariant"
      :cancel-title="modalOptions.cancelTitle"
      @ok="operationConfirm"
    >
      <p>
        {{ modalMessage }}
      </p>
    </BModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
// @ts-ignore - eventBus is a JS module
import eventBus from '@/eventBus';
import stores from '@/store';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
// @ts-ignore - useLoadingBarComposable is a JS module
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
// @ts-ignore - useToastComposable is a JS module
import useToast from '@/components/Composables/useToastComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import BootSettings from './BootSettings.vue';
import Alert from '@/components/Global/Alert.vue';
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';
import NetworkSettingsModal from './NetworkSettingsModal.vue';
import {
  useBootBiosAttributes,
  useServerSystemInfo,
  useServerBmcInfo,
  useLocationCodes,
  useServerPowerControl,
} from '@/api/composables/useServerPowerOperations';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

const {
  biosAttributes,
  attributeValues,
  isLoading: isBiosLoading,
  refetch: refetchBios,
  refetchBios: refetchBiosOnly,
  standbyToRuntime: standbyToRuntimeMutation,
  hmcManaged,
  ibmiLoadSourceValue,
  ibmiAltLoadSourceValue,
  ibmiConsoleValue,
  linuxKvmPercentageValue,
  linuxKvmPercentageInitialValue,
  linuxKvmPercentageCurrentValue,
  saveBiosSettings,
  saveOperatingModeSettings,
  isSavingBios,
} = useBootBiosAttributes();

const {
  serverStatus,
  isSystemLoading,
  refetchSystem,
  powerRestorePolicy,
  lastPowerOperationTime,
} = useServerSystemInfo();

const globalStore = stores.GlobalStore();

const { bmc, isLoading: isBmcLoading, refetch: refetchBmc } = useServerBmcInfo();

const { locationCodes, refetch: refetchLocationCodes } = useLocationCodes();

const {
  isOperationInProgress,
  serverPowerOn,
  serverSoftReboot,
  serverHardReboot,
  serverSoftPowerOff,
  serverHardPowerOff,
} = useServerPowerControl();

const openModal = ref(false);
const phypStandby = ref(false);
const isUpdated = ref(false);
const form = ref({
  rebootOption: 'orderly',
  shutdownOption: 'orderly',
});
const modalMessage = ref('');
const modalOptions = ref({
  title: '',
  okVariant: '',
  okTitle: '',
  cancelTitle: '',
});
const modalOption = ref('');

onBeforeRouteLeave(() => {
  hideLoader();
});

const isPageLoading = ref(false);

watch(
  [isBiosLoading, isSystemLoading, isBmcLoading],
  (states) => {
    const loading = states.some(Boolean);
    if (loading && !isPageLoading.value) {
      isPageLoading.value = true;
      startLoader();
    } else if (!loading && isPageLoading.value) {
      isPageLoading.value = false;
      endLoader();
    }
  },
  { immediate: true },
);

const isInPhypStandby = computed(() => {
  if (!phypStandby.value) {
    const bootProgress = globalStore.bootProgressGetter;
    if (bootProgress === 'SystemHardwareInitializationComplete') {
      return true;
    } else {
      return false;
    }
  } else return false;
});

const hmcInfo = computed(() => {
  return hmcManaged.value;
});

const isIBMi = computed(() => {
  if (
    biosAttributes.value?.pvm_default_os_type === 'Default' ||
    biosAttributes.value?.pvm_default_os_type === 'IBM I'
  ) {
    return true;
  } else {
    return false;
  }
});

const systemDumpActive = computed(() => {
  return biosAttributes.value?.pvm_sys_dump_active === 'Enabled';
});

function openNetworkSettings() {
  eventBus.emit('modal-network-settings');
}

function discardStandbyToRuntime() {
  getRequiredResponses();
}

function saveStandbyToRuntime() {
  isUpdated.value = true;
}

function updateToRuntime() {
  isUpdated.value = false;
  standbyToRuntime();
}

function getRequiredResponses() {
  startLoader();
  Promise.all([
    refetchBios(),
    refetchSystem(),
    refetchBmc(),
    refetchLocationCodes(),
  ]).finally(() => {
    endLoader();
    standbyToRuntime();
  });
}

function powerOn() {
  if (
    bmc.value?.powerState === 'On' &&
    bmc.value?.statusState === 'Enabled' &&
    bmc.value?.health === 'OK'
  ) {
    serverPowerOn()
      .then((response) => {
        if (response === true) {
          infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
        }
      })
      .catch((error) => {
        console.log(error);
        errorToast(
          i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
        );
      });
  } else {
    errorToast(i18n.global.t('pageServerPowerOperations.toast.errorPowerOn'));
  }
}

function rebootServer() {
  modalOption.value = 'reboot';

  refetchBiosOnly().then(() => {
    modalMessage.value = `${
      systemDumpActive.value
        ? i18n.global.t('pageServerPowerOperations.modal.confirmRebootMessage2')
        : ''
    } ${i18n.global.t('pageServerPowerOperations.modal.confirmRebootMessage')}`;

    modalOptions.value.title = i18n.global.t(
      'pageServerPowerOperations.modal.confirmRebootTitle',
    );
    modalOptions.value.okVariant = systemDumpActive.value ? 'danger' : 'primary';
    modalOptions.value.okTitle = systemDumpActive.value
      ? i18n.global.t('pageServerPowerOperations.reboot')
      : i18n.global.t('global.action.confirm');
    modalOptions.value.cancelTitle = i18n.global.t('global.action.cancel');

    openModal.value = true;
  });
}

function shutdownServer() {
  modalOption.value = 'shutdown';

  modalMessage.value = `${
    systemDumpActive.value
      ? i18n.global.t('pageServerPowerOperations.modal.confirmShutdownMessage2')
      : ''
  } ${i18n.global.t('pageServerPowerOperations.modal.confirmShutdownMessage')}`;

  modalOptions.value.title = i18n.global.t(
    'pageServerPowerOperations.modal.confirmShutdownTitle',
  );
  modalOptions.value.okVariant = systemDumpActive.value ? 'danger' : 'primary';
  modalOptions.value.okTitle = systemDumpActive.value
    ? i18n.global.t('pageServerPowerOperations.shutDown')
    : i18n.global.t('global.action.confirm');
  modalOptions.value.cancelTitle = i18n.global.t('global.action.cancel');

  openModal.value = true;
}

function operationConfirm() {
  if (modalOption.value === 'reboot') {
    if (form.value.rebootOption === 'orderly') {
      serverSoftReboot()
        .then((response) => {
          if (response === true) {
            infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
          }
        })
        .catch((error) => {
          errorToast(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
          console.log(error);
        });
    } else if (form.value.rebootOption === 'immediate') {
      serverHardReboot()
        .then((response) => {
          if (response === true) {
            infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
          }
        })
        .catch((error) => {
          errorToast(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
          console.log(error);
        });
    }
  } else if (modalOption.value === 'shutdown') {
    if (form.value.shutdownOption === 'orderly') {
      serverSoftPowerOff()
        .then((response) => {
          if (response === true) {
            infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
          }
        })
        .catch((error) => {
          errorToast(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
          console.log(error);
        });
    } else if (form.value.shutdownOption === 'immediate') {
      serverHardPowerOff()
        .then((response) => {
          if (response === true) {
            infoToast(i18n.global.t('pageServerPowerOperations.userRefresh'));
          }
        })
        .catch((error) => {
          errorToast(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
          console.log(error);
        });
    }
  }
}

function standbyToRuntime() {
  standbyToRuntimeMutation()
    .then((message) => {
      phypStandby.value = true;
      successToast(message);
    })
    .catch(({ message }) => errorToast(message));
}
</script>
