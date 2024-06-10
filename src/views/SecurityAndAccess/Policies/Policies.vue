<template>
  <div class="container" fluid="xl">
    <page-title :title="$t('appPageTitle.policies')" />
    <BRow>
      <BCol md="8">
        <p>{{ Policies.sshProtocolEnabled }}</p>
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
              v-model="Policies.sshProtocolEnabled"
              data-test-id="policies-toggle-bmcShell"
              aria-labelledby="ssh-label"
              aria-describedby="ssh-description"
              switch
              @update:modelValue="changeSshProtocolState"
            >
              <span v-if="Policies.sshProtocolEnabled">
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
              v-model="Policies.ipmiProtocolEnabled"
              data-test-id="polices-toggle-networkIpmi"
              aria-labelledby="ipmi-label"
              aria-describedby="ipmi-description"
              switch
              @update:modelValue="changeIpmiProtocolState"
            >
              <span v-if="Policies.ipmiProtocolEnabled">
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
              v-model="Policies.tpmPolicyEnabled"
              aria-labelledby="host-tpm-label"
              aria-describedby="host-tpm-description"
              switch
              @update:modelValue="changeTpmPolicyState"
            >
              <span v-if="Policies.tpmPolicyEnabled">
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
                <span v-b-tooltip="$t('global.status.nextReboot')">
                  <icon-time />
                </span>
              </dt>

              <dd>
                {{ $t('pagePolicies.vtpmDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="vtpmSwitch"
              v-model="Policies.vtpmEnabled"
              data-test-id="policies-toggle-vtpm"
              switch
              @update:modelValue="changeVtpmState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.vtpm') }}
              </span>
              <span v-if="Policies.vtpmEnabled">
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
                <span v-b-tooltip="$t('pagePolicies.rtadInfoIcon')">
                  <icon-time />
                </span>
              </dt>
              <dd>
                {{ $t('pagePolicies.rtadDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="rtadSwitch"
              v-model="Policies.rtadEnabled"
              data-test-id="policies-toggle-rtad"
              switch
              @update:modelValue="changeRtadState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.rtad') }}
              </span>
              <span v-if="Policies.rtadEnabled">
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
              v-model="Policies.usbFirmwareUpdatePolicyEnabled"
              data-test-id="policies-toggle-usbFirmwareUpdatePolicy"
              switch
              @update:modelValue="changeUsbFirmwareUpdatePolicyState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="Policies.usbFirmwareUpdatePolicyEnabled">
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
              v-model="Policies.svleEnabled"
              data-test-id="policies-toggle-svle"
              switch
              @update:modelValue="changeSvleState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.secureVersion') }}
              </span>
              <span v-if="Policies.svleEnabled">
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
                <span v-b-tooltip="$t('global.status.nextReboot')">
                  <icon-time />
                </span>
              </dt>
              <dd>
                {{ $t('pagePolicies.hostUsbDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="hostUsbSwitch"
              v-model="Policies.hostUsbEnabled"
              data-test-id="policies-toggle-hostUsb"
              switch
              @update:modelValue="changeHostUsbState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.hostUsb') }}
              </span>
              <span v-if="Policies.hostUsbEnabled">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.acfUploadEnablement') }}</dt>
              <dd>
                {{ $t('pagePolicies.acfUploadEnablementDescription') }}
              </dd>
            </dl>
            <BFormCheckbox
              id="unauthenticatedACFUploadEnablementSwitch"
              v-model="Policies.unAuthenticatedACFUploadEnablementState"
              data-test-id="policies-toggle-unauthenticatedACFUploadEnablement"
              switch
              @update:modelValue="changeUnauthenticatedACFUploadEnablement"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="Policies.unAuthenticatedACFUploadEnablementState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
    <BModal
      v-model="modal"
      title="Unauthenticated ACF upload enablement"
      cancel-title="cancel"
      ok-title="confirm"
      @cancel="onModalCancel"
      @ok="onModalOk"
    >
      {{ ModalContent }}
    </BModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PoliciesStore } from '@/store/modules/SecurityAndAccess/PoliciesStore';
import { UserManagementStore } from '@/store/modules/SecurityAndAccess/UserManagementStore';
import { GlobalStore } from '@/store/modules/GlobalStore';
import useToastComposable from '@/components/Composables/useToastComposable';

import i18n from '@/i18n';

const Policies = PoliciesStore();
const UserManagement = UserManagementStore();
const Global = GlobalStore();
const Toast = useToastComposable();
const modal = ref(false);
const ModalContent = i18n.global.t('pagePolicies.acfUploadEnablementConfirmText');

onMounted(() => {
  Promise.all([
    Policies.getBiosStatus(),
    setTimeout(() => {
      Policies.getNetworkProtocolStatus();
    }, 30000),
    Policies.getUsbFirmwareUpdatePolicyEnabled(),
    Policies.getUnauthenticatedACFUploadEnablement(),
    Policies.getTpmPolicy(),
    UserManagement.getUsers(),
    checkForUserData(),
  ]).finally(() => {
    Policies.unAuthenticatedACFUploadEnablementState = Policies.acfUploadEnablement;
  });
});

const currentUser = () => {
  return Global.currentUser;
};

const changeSshProtocolState = (state) => {
  console.log('State_ssh: ', state);
  Policies.saveSshProtocolState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeUsbFirmwareUpdatePolicyState = (state) => {
  Policies.saveUsbFirmwareUpdatePolicyEnabled(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeHostUsbState = (state) => {
  Policies.saveHostUsbEnabled(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeIpmiProtocolState = (state) => {
  Policies.saveIpmiProtocolState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeRtadState = (state) => {
  Policies.saveRtadState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};
const changeVtpmState = (state) => {
  Policies.saveVtpmState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};

const changeSvleState = (state) => {
  Policies.saveSvleState(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};

const changeTpmPolicyState = (state) => {
  Policies.saveTpmPolicy(state)
    .then((message) => {
      Toast.successToast(message);
    })
    .catch(({ message }) => {
      Toast.errorToast(message);
    });
};

const changeUnauthenticatedACFUploadEnablement = (state) => {
  if (state) {
    modal.value = true;
  } else {
    Policies.unAuthenticatedACFUploadEnablementState = !state;
    uploadApi(state);
  }
};
const onModalOk = () => {
  const stateOk = modal.value;
  enableUpload(stateOk);
};
const onModalCancel = () => {
  const stateCancel = modal.value;
  Policies.unAuthenticatedACFUploadEnablementState = !stateCancel;
};
const uploadApi = (state) => {
  console.log('state:', state);
  Policies.saveUnauthenticatedACFUploadEnablement(state)
    .then((message) => Toast.successToast(message))
    .then(() => {
      Policies.unAuthenticatedACFUploadEnablementState = state;
    })
    .catch(({ message }) => Toast.errorToast(message));
};

const enableUpload = (state) => {
  state ? uploadApi(state) : (Policies.unAuthenticatedACFUploadEnablementState = !state);
};
const checkForUserData = () => {
  if (!currentUser) {
    UserManagement.getUsers();
    Global.getCurrentUser();
  }
};
</script>
