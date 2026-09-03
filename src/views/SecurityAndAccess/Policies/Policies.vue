<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.policies')" />
    <BRow>
      <BCol md="8">
        <BRow v-if="!modifySSHPolicyDisabled" class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mr-3 w-75">
              <dt id="ssh-label">{{ $t('pagePolicies.ssh') }}</dt>
              <dd id="ssh-description">
                {{ $t('pagePolicies.sshDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="sshSwitch"
              v-model="sshProtocolEnabled"
              data-test-id="policies-toggle-bmcShell"
              aria-labelledby="ssh-label"
              aria-describedby="ssh-description"
              switch
              @update:model-value="changeSshProtocolState"
            >
              <span v-if="sshProtocolEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="ipmi-label">{{ $t('pagePolicies.ipmi') }}</dt>
              <dd id="ipmi-description">
                {{ $t('pagePolicies.ipmiDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="ipmiSwitch"
              v-model="ipmiProtocolEnabled"
              data-test-id="polices-toggle-networkIpmi"
              aria-labelledby="ipmi-label"
              aria-describedby="ipmi-description"
              switch
              @update:model-value="changeIpmiProtocolState"
            >
              <span v-if="ipmiProtocolEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="host-tpm-label">{{ $t('pagePolicies.hostTpm') }}</dt>
              <dd id="host-tpm-description">
                {{ $t('pagePolicies.hostTpmDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="host-tpm-policy"
              v-model="tpmPolicyEnabled"
              aria-labelledby="host-tpm-label"
              aria-describedby="host-tpm-description"
              switch
              @update:model-value="changeTpmPolicyState"
            >
              <span v-if="tpmPolicyEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>
                {{ $t('pagePolicies.vtpm') }}
                <info-tooltip :title="$t('global.status.nextReboot')">
                  <icon-time />
                </info-tooltip>
              </dt>

              <dd>
                {{ $t('pagePolicies.vtpmDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="vtpmSwitch"
              v-model="vtpmEnabled"
              data-test-id="policies-toggle-vtpm"
              switch
              @update:model-value="changeVtpmState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.vtpm') }}
              </span>
              <span v-if="vtpmEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>
                {{ $t('pagePolicies.rtad') }}
                <info-tooltip :title="$t('pagePolicies.rtadInfoIcon')">
                  <icon-time />
                </info-tooltip>
              </dt>
              <dd>
                {{ $t('pagePolicies.rtadDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="rtadSwitch"
              v-model="rtadEnabled"
              data-test-id="policies-toggle-rtad"
              switch
              @update:model-value="changeRtadState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.rtad') }}
              </span>
              <span v-if="rtadEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}</dt>
              <dd>
                {{ $t('pagePolicies.usbFirmwareUpdatePolicyDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="usbFirmwareUpdatePolicySwitch"
              v-model="usbFirmwareUpdatePolicyEnabled"
              data-test-id="policies-toggle-usbFirmwareUpdatePolicy"
              switch
              @update:model-value="changeUsbFirmwareUpdatePolicyState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="usbFirmwareUpdatePolicyEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.secureVersion') }}</dt>
              <dd>
                {{ $t('pagePolicies.secureVersionDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="svleSwitch"
              v-model="svleEnabled"
              data-test-id="policies-toggle-svle"
              switch
              @update:model-value="changeSvleState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.secureVersion') }}
              </span>
              <span v-if="svleEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>
                {{ $t('pagePolicies.hostUsb') }}
                <info-tooltip :title="$t('global.status.nextReboot')">
                  <icon-time />
                </info-tooltip>
              </dt>
              <dd>
                {{ $t('pagePolicies.hostUsbDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="hostUsbSwitch"
              v-model="hostUsbEnabled"
              data-test-id="policies-toggle-hostUsb"
              switch
              @update:model-value="changeHostUsbState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.hostUsb') }}
              </span>
              <span v-if="hostUsbEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow
          v-if="username === 'admin' || username === 'service'"
          class="section-divider"
        >
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.acfUploadEnablement') }}</dt>
              <dd>
                {{ $t('pagePolicies.acfUploadEnablementDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="unauthenticatedACFUploadEnablementSwitch"
              v-model="unAuthenticatedACFUploadEnablementState"
              data-test-id="policies-toggle-unauthenticatedACFUploadEnablement"
              switch
              @update:model-value="changeUnauthenticatedACFUploadEnablement"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="unAuthenticatedACFUploadEnablementState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>
                {{ $t('pagePolicies.basicAuth') }}
              </dt>
              <dd>
                {{ $t('pagePolicies.basicAuthDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="basicAuthSwitch"
              v-model="basicAuthEnabled"
              data-test-id="policies-toggle-basic-auth"
              switch
              @update:model-value="changeBasicAuthState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.basicAuth') }}
              </span>
              <span v-if="basicAuthEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>
                {{ $t('pagePolicies.sendServiceAlerts') }}
              </dt>
              <dd>
                {{ $t('pagePolicies.sendServiceAlertsDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="sendServiceAlertsSwitch"
              v-model="localSendServiceAlertsEnabled"
              data-test-id="policies-toggle-send-service-alerts"
              switch
              @update:model-value="changeSendServiceAlertsState"
            >
              <span class="visually-hidden">
                {{ $t('pagePolicies.sendServiceAlerts') }}
              </span>
              <span v-if="sendServiceAlertsEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
    <BModal
      ref="myModalRef"
      v-model="modal"
      :title="$t('pagePolicies.acfUploadEnablement')"
      :cancel-title="$t('global.action.cancel')"
      :ok-title="$t('global.action.confirm')"
      @cancel="onModalCancel"
      @ok="onModalOk"
      @hide="onModalHide"
    >
      {{ ModalContent }}
    </BModal>
    <BModal
      ref="sendServiceAlertsModalRef"
      v-model="sendServiceAlertsModal"
      :title="$t('pagePolicies.sendServiceAlerts')"
      :cancel-title="$t('global.action.cancel')"
      :ok-title="$t('global.action.confirm')"
      @cancel="onSendServiceAlertsModalCancel"
      @ok="onSendServiceAlertsModalOk"
      @hide="onSendServiceAlertsModalHide"
    >
      <div>
        <p>{{ $t('pagePolicies.modal.message1') }}</p>
        {{ $t('pagePolicies.modal.message2') }}
      </div>
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { usePolicies } from '@/api/composables/usePolicies';
import { UserManagementStore } from '@/store/modules/SecurityAndAccess/UserManagementStore';
import { GlobalStore } from '@/store/modules/GlobalStore';
import useToastComposable from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import IconTime from '@carbon/icons-vue/es/time/16';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';

const Toast = useToastComposable();

const {
  sshProtocolEnabled,
  ipmiProtocolEnabled,
  rtadEnabled,
  vtpmEnabled,
  svleEnabled,
  tpmPolicyEnabled,
  usbFirmwareUpdatePolicyEnabled,
  hostUsbEnabled,
  acfUploadEnablement,
  unAuthenticatedACFUploadEnablementState,
  basicAuthEnabled,
  sendServiceAlertsEnabled,
  loadAllPolicies,
  isLoading: isPoliciesLoading,
  isFetching: isPoliciesFetching,
  saveSshProtocolState,
  saveIpmiProtocolState,
  saveTpmPolicy,
  saveVtpmState,
  saveRtadState,
  saveSvleState,
  saveHostUsbEnabled,
  saveUsbFirmwareUpdatePolicyEnabled,
  saveUnauthenticatedACFUploadEnablement,
  saveBasicAuthEnabled,
  saveSendServiceAlertsEnabled,
} = usePolicies();

const { startLoader, endLoader } = usePageLoadingBar(isPoliciesFetching);

const UserManagement = UserManagementStore();
const Global = GlobalStore();

const username = ref(Global.username);
const modal = ref(false);
const ModalContent = i18n.global.t(
  'pagePolicies.acfUploadEnablementConfirmText',
);
const myModalRef = ref(null);
const sendServiceAlertsModal = ref(false);
const sendServiceAlertsModalRef = ref(null);
const localSendServiceAlertsEnabled = ref(sendServiceAlertsEnabled.value);

// Watch for changes from the API and update local state
watch(sendServiceAlertsEnabled, (newValue) => {
  localSendServiceAlertsEnabled.value = newValue;
});

onMounted(() => {
  Promise.all([
    loadAllPolicies(),
    UserManagement.getUsers(),
    checkForUserData(),
  ]).finally(() => {
    unAuthenticatedACFUploadEnablementState.value = acfUploadEnablement.value;
  });
});

const currentUser = () => {
  return Global.currentUser;
};
const changeSshProtocolState = (state) => {
  saveSshProtocolState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeUsbFirmwareUpdatePolicyState = (state) => {
  saveUsbFirmwareUpdatePolicyEnabled(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeHostUsbState = (state) => {
  saveHostUsbEnabled(state ? 'Enabled' : 'Disabled')
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeBasicAuthState = (state) => {
  saveBasicAuthEnabled(state ? 'Enabled' : 'Disabled')
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeSendServiceAlertsState = (state) => {
  if (!state) {
    sendServiceAlertsModal.value = true;
  } else {
    sendServiceAlertsApi(state);
  }
};
const onSendServiceAlertsModalOk = () => {
  sendServiceAlertsApi(false);
};
const onSendServiceAlertsModalCancel = () => {
  // Revert the local toggle state back to enabled
  localSendServiceAlertsEnabled.value = true;
};
const onSendServiceAlertsModalHide = (event) => {
  if (event.trigger === 'backdrop' || event.trigger === 'close') {
    // Revert the local toggle state back to enabled
    localSendServiceAlertsEnabled.value = true;
  }
};
const sendServiceAlertsApi = (state) => {
  saveSendServiceAlertsEnabled(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeIpmiProtocolState = (state) => {
  saveIpmiProtocolState(state)
    .then((message) => {
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 30000);
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeRtadState = (state) => {
  saveRtadState(state ? 'Enabled' : 'Disabled')
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeVtpmState = (state) => {
  saveVtpmState(state ? 'Enabled' : 'Disabled')
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeSvleState = (state) => {
  saveSvleState(state ? 'Enabled' : 'Disabled')
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeTpmPolicyState = (state) => {
  saveTpmPolicy(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeUnauthenticatedACFUploadEnablement = (state) => {
  if (state) {
    modal.value = state;
  } else {
    unAuthenticatedACFUploadEnablementState.value = !state;
    uploadApi(state);
  }
};
const onModalOk = () => {
  const stateOk = modal.value;
  enableUpload(stateOk);
};
const onModalCancel = () => {
  const stateCancel = modal.value;
  unAuthenticatedACFUploadEnablementState.value = !stateCancel;
};

const onModalHide = (event) => {
  if (event.trigger === 'backdrop' || event.trigger === 'close') {
    const stateCancel = modal.value;
    unAuthenticatedACFUploadEnablementState.value = !stateCancel;
  }
};
const uploadApi = (state) => {
  saveUnauthenticatedACFUploadEnablement(state)
    .then((message) => Toast.successToast(message))
    .then(() => {
      unAuthenticatedACFUploadEnablementState.value = state;
    })
    .catch(({ message }) => Toast.errorToast(message));
};
const enableUpload = (state) => {
  state
    ? uploadApi(state)
    : (unAuthenticatedACFUploadEnablementState.value = !state);
};
const checkForUserData = () => {
  if (!currentUser) {
    UserManagement.getUsers();
    Global.getCurrentUser();
  }
};
</script>

<style lang="scss" scoped>
.mr-3 {
  margin-right: 1rem !important;
}
.align-items-center {
  align-items: center !important;
}
.justify-content-between {
  justify-content: space-between !important;
}
.d-flex {
  display: flex !important;
}
@media (min-width: 1400px) {
  .container {
    max-width: 1140px;
    margin-left: 0;
  }
}
</style>
