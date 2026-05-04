<template>
  <div>
    <BContainer fluid="xl">
      <page-title :title="$t('appPageTitle.serverPowerOperations')">
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

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="serverPowerOperationsSearchContent"
      @action="handleHelpAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import BootSettings from './BootSettings.vue';
import Alert from '@/components/Global/Alert.vue';
import IconHelp from '@carbon/icons-vue/es/help/20';
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';
import NetworkSettingsModal from './NetworkSettingsModal.vue';
import HelpModal from '@/components/Global/HelpModal.vue';
import { serverPowerOperationsSearchContent } from './ServerPowerOperationsSearchContent.js';

import stores from '@/store';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();
const controlStore = stores.ControlStore();
const bmcStore = stores.BmcStore();
const bootSettingsStore = stores.BootSettingsStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

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
const showHelpModal = ref(false);

function handleHelpAction(action) {
  // Handle quick actions from help modal
  switch (action) {
    case 'power-on':
      if (serverStatus.value === 'off') {
        powerOn();
      }
      break;
    case 'reboot-server':
      if (serverStatus.value === 'on') {
        rebootServer();
      }
      break;
    case 'shutdown-server':
      if (serverStatus.value === 'on') {
        shutdownServer();
      }
      break;
    default:
      break;
  }
}

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  const bootSettingsPromise = new Promise((resolve) => {
    eventBus.on('server-power-operations-boot-settings-complete', () =>
      resolve(),
    );
  });
  Promise.all([
    globalStore.getHmcManaged(),
    bootSettingsStore.getOperatingModeSettings(),
    controlStore.fetchLastPowerOperationTime(),
    bmcStore.getBmcInfo(),
    globalStore.getBootProgress(),
    bootSettingsPromise,
  ]).finally(() => endLoader());
});

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

const bmc = computed(() => {
  return bmcStore.bmcGetter;
});

const hmcInfo = computed(() => {
  return globalStore.hmcManagedGetter;
});

const isIBMi = computed(() => {
  if (
    attributeKeys.value?.pvm_default_os_type === 'Default' ||
    attributeKeys.value?.pvm_default_os_type === 'IBM I'
  ) {
    return true;
  } else {
    return false;
  }
});

const attributeKeys = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const isOperationInProgress = computed(() => {
  return controlStore.getIsOperationInProgress;
});

const lastPowerOperationTime = computed(() => {
  return controlStore.getLastPowerOperationTime;
});

const systemDumpActive = computed(() => {
  return bootSettingsStore.getSystemDumpActive;
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
    bootSettingsStore.getOperatingModeSettings(),
    controlStore.fetchLastPowerOperationTime(),
    bmcStore.getBmcInfo(),
    globalStore.getBootProgress(),
    bootSettingsStore.fetchLocationCodes(),
    resourceMemoryStore.getHmcManaged(),
    bootSettingsStore.fetchBiosAttributes(),
    bootSettingsStore.fetchAttributeValues(),
  ]).finally(() => {
    endLoader();
    standbyToRuntime();
  });
}

function powerOn() {
  if (
    bmc.value.powerState === 'On' &&
    bmc.value.statusState === 'Enabled' &&
    bmc.value.health === 'OK'
  ) {
    controlStore
      .serverPowerOn()
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

  bootSettingsStore.fetchBiosAttributes().then(() => {
    modalMessage.value = `${
      systemDumpActive.value
        ? i18n.global.t('pageServerPowerOperations.modal.confirmRebootMessage2')
        : ''
    } ${i18n.global.t('pageServerPowerOperations.modal.confirmRebootMessage')}`;

    modalOptions.value.title = i18n.global.t(
      'pageServerPowerOperations.modal.confirmRebootTitle',
    );
    modalOptions.value.okVariant = systemDumpActive.value
      ? 'danger'
      : 'primary';
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
      controlStore
        .serverSoftReboot()
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
      controlStore
        .serverHardReboot()
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
      controlStore
        .serverSoftPowerOff()
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
      controlStore
        .serverHardPowerOff()
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
  bootSettingsStore
    .standbyToRuntime()
    .then((message) => {
      phypStandby.value = true;
      successToast(message);
    })
    .catch(({ message }) => errorToast(message));
}
</script>
