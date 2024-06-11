<template>
  <div class="container" fluid="xl">
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
              @change="changeSshProtocolState"
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
              @change="changeIpmiProtocolState"
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
              @change="changeTpmPolicyState"
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
              v-model="vtpmEnabled"
              data-test-id="policies-toggle-vtpm"
              switch
              @change="changeVtpmState"
            >
              <span class="sr-only">
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
              v-model="rtadEnabled"
              data-test-id="policies-toggle-rtad"
              switch
              @change="changeRtadState"
            >
              <span class="sr-only">
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
              @change="changeUsbFirmwareUpdatePolicyState"
            >
              <span class="sr-only">
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
              @change="changeSvleState"
            >
              <span class="sr-only">
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
              v-model="hostUsbEnabled"
              data-test-id="policies-toggle-hostUsb"
              switch
              @change="changeHostUsbState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.hostUsb') }}
              </span>
              <span v-if="hostUsbEnabled">
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
              v-model="unauthenticatedACFUploadEnablementState"
              data-test-id="policies-toggle-unauthenticatedACFUploadEnablement"
              switch
              @change="changeUnauthenticatedACFUploadEnablement"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="unauthenticatedACFUploadEnablementState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </div>
</template>

<script>
import { mapActions, mapState, mapWritableState } from 'pinia';
import { PoliciesStore } from '@/store/modules/SecurityAndAccess/PoliciesStore';
import { UserManagementStore } from '@/store/modules/SecurityAndAccess/UserManagementStore';
import { GlobalStore } from '@/store/modules/GlobalStore';

export default {
  name: 'Policies',
  data() {
    return {
      unauthenticatedACFUploadEnablementState: this.acfUploadEnablement,
    };
  },
  computed: {
    ...mapWritableState(PoliciesStore, [
      'sshProtocolEnabled',
      'usbFirmwareUpdatePolicyEnable',
      'ipmiProtocolEnabled',
      'rtadEnabled',
      'vtpmEnabled',
      'svleEnabled',
      'hostUsbEnabled',
      'tpmPolicyEnabled',
      'acfUploadEnablement',
    ]),
    ...mapState(GlobalStore, ['currentUser']),
    ...mapState(GlobalStore, {
      isServiceUser: 'isServiceUser',
    }),
    ...mapState(GlobalStore, {
      isAdminUser: 'isAdminUser',
    }),
  },
  created() {
    Promise.all([
      this.getBiosStatus(),
      setTimeout(() => {
        this.getNetworkProtocolStatus();
      }, 30000),
      this.getUsbFirmwareUpdatePolicyEnabled(),
      this.getUnauthenticatedACFUploadEnablement(),
      this.getTpmPolicy(),
      this.getUsers(),
      // this.checkForUserData(),
    ]).finally(() => {
      this.unauthenticatedACFUploadEnablementState = this.acfUploadEnablement;
      setTimeout(() => {
        this.endLoader();
      }, 30000);
    });
  },
  methods: {
    ...mapActions(PoliciesStore, [
      'getBiosStatus',
      'getNetworkProtocolStatus',
      'getUsbFirmwareUpdatePolicyEnabled',
      'getUnauthenticatedACFUploadEnablement',
      'getTpmPolicy',
      'saveUnauthenticatedACFUploadEnablement',
      'saveUsbFirmwareUpdatePolicyEnabled',
      'saveSshProtocolState',
      'saveRtadState',
      'saveVtpmState',
      'saveIpmiProtocolState',
      'saveHostUsbEnabled',
      'saveUsbFirmwareUpdatePolicyEnabled',
      'saveSvleState',
      'saveTpmPolicy',
    ]),
    ...mapActions(UserManagementStore, ['getUsers']),
    changeUsbFirmwareUpdatePolicyState(state) {
      this.saveUsbFirmwareUpdatePolicyEnabled(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeHostUsbState(state) {
      this.saveHostUsbEnabled(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeIpmiProtocolState(state) {
      this.saveIpmiProtocolState(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeSshProtocolState(state) {
      this.saveSshProtocolState(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeRtadState(state) {
      this.saveRtadState(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeVtpmState(state) {
      this.saveVtpmState(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeSvleState(state) {
      this.saveSvleState(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeTpmPolicyState(state) {
      this.saveTpmPolicy(state)
        .then((message) => {
          this.successToast(message);
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },
    changeUnauthenticatedACFUploadEnablement(state) {
      if (state) {
        this.$bvModal
          .msgBoxConfirm(this.$t('pagePolicies.acfUploadEnablementConfirmText'), {
            title: this.$tc('pagePolicies.acfUploadEnablement'),
            okTitle: this.$tc('global.action.confirm'),
            cancelTitle: this.$t('global.action.cancel'),
          })
          .then((value) => {
            this.enableUpload(value, state);
          });
      } else {
        this.unauthenticatedACFUploadEnablementState = !state;
        this.uploadApi(state);
      }
    },
    uploadApi(state) {
      this.saveUnauthenticatedACFUploadEnablement(state)
        .then((message) => {
          this.successToast(message);
        })
        .then(() => {
          this.unauthenticatedACFUploadEnablementState = state;
        })
        .catch(({ message }) => {
          console.log('message: ', message);
        });
    },

    enableUpload(value, state) {
      value ? this.uploadApi(state) : (this.unauthenticatedACFUploadEnablementState = !state);
    },

    // checkForUserData() {
    //   if (!this.currentUser) {
    //     this.getUsers();
    //   }
    // },
  },
};
</script>
