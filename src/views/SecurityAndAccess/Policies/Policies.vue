<template>
  <b-container fluid="xl">
    <page-title />
    <b-row>
      <b-col md="8">
        <b-row v-if="!modifySSHPolicyDisabled" class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mr-3 w-75">
              <dt id="ssh-label">{{ $t('pagePolicies.ssh') }}</dt>
              <dd id="ssh-description">
                {{ $t('pagePolicies.sshDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
              id="sshSwitch"
              v-model="sshProtocolState"
              data-test-id="policies-toggle-bmcShell"
              aria-labelledby="ssh-label"
              aria-describedby="ssh-description"
              switch
              @change="changeSshProtocolState"
            >
              <span v-if="sshProtocolState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="ipmi-label">{{ $t('pagePolicies.ipmi') }}</dt>
              <dd id="ipmi-description">
                {{ $t('pagePolicies.ipmiDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
              id="ipmiSwitch"
              v-model="ipmiProtocolState"
              data-test-id="polices-toggle-networkIpmi"
              aria-labelledby="ipmi-label"
              aria-describedby="ipmi-description"
              switch
              @change="changeIpmiProtocolState"
            >
              <span v-if="ipmiProtocolState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="host-tpm-label">{{ $t('pagePolicies.hostTpm') }}</dt>
              <dd id="host-tpm-description">
                {{ $t('pagePolicies.hostTpmDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
              id="host-tpm-policy"
              v-model="tpmPolicyState"
              aria-labelledby="host-tpm-label"
              aria-describedby="host-tpm-description"
              switch
              @change="changeTpmPolicyState"
            >
              <span v-if="tpmPolicyState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
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
            <b-form-checkbox
              id="vtpmSwitch"
              v-model="vtpmState"
              data-test-id="policies-toggle-vtpm"
              switch
              @change="changeVtpmState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.vtpm') }}
              </span>
              <span v-if="vtpmState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
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
            <b-form-checkbox
              id="rtadSwitch"
              v-model="rtadState"
              data-test-id="policies-toggle-rtad"
              switch
              @change="changeRtadState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.rtad') }}
              </span>
              <span v-if="rtadState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}</dt>
              <dd>
                {{ $t('pagePolicies.usbFirmwareUpdatePolicyDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
              id="usbFirmwareUpdatePolicySwitch"
              v-model="usbFirmwareUpdatePolicyState"
              :disabled="!(isAdminUser || isServiceUser)"
              data-test-id="policies-toggle-usbFirmwareUpdatePolicy"
              switch
              @change="changeUsbFirmwareUpdatePolicyState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.usbFirmwareUpdatePolicy') }}
              </span>
              <span v-if="usbFirmwareUpdatePolicyState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.secureVersion') }}</dt>
              <dd>
                {{ $t('pagePolicies.secureVersionDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
              id="svleSwitch"
              v-model="svleState"
              data-test-id="policies-toggle-svle"
              switch
              @change="changeSvleState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.secureVersion') }}
              </span>
              <span v-if="svleState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
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
            <b-form-checkbox
              id="hostUsbSwitch"
              v-model="hostUsbState"
              data-test-id="policies-toggle-hostUsb"
              switch
              @change="changeHostUsbState"
            >
              <span class="sr-only">
                {{ $t('pagePolicies.hostUsb') }}
              </span>
              <span v-if="hostUsbState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </b-form-checkbox>
          </b-col>
        </b-row>
        <b-row v-if="isAdminUser || isServiceUser" class="section-divider">
          <b-col class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt>{{ $t('pagePolicies.acfUploadEnablement') }}</dt>
              <dd>
                {{ $t('pagePolicies.acfUploadEnablementDescription') }}
              </dd>
            </dl>
            <b-form-checkbox
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
            </b-form-checkbox>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import InfoTooltip from '@/components/Global/InfoTooltip';
import IconTime from '@carbon/icons-vue/es/time/16';

export default {
  name: 'Policies',
  components: { IconTime, InfoTooltip, PageTitle },
  mixins: [LoadingBarMixin, BVToastMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      modifySSHPolicyDisabled:
        process.env.VUE_APP_MODIFY_SSH_POLICY_DISABLED === 'true',
    };
  },
  computed: {
    usbFirmwareUpdatePolicyState: {
      get() {
        return this.$store.getters['policies/usbFirmwareUpdatePolicyEnabled'];
      },
      set(newValue) {
        return newValue;
      },
    },
    currentUser() {
      return this.$store.getters['global/currentUser'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
    isAdminUser() {
      return this.$store.getters['global/isAdminUser'];
    },
    sshProtocolState: {
      get() {
        return this.$store.getters['policies/sshProtocolEnabled'];
      },
      set(newValue) {
        return newValue;
      },
    },
    ipmiProtocolState: {
      get() {
        return this.$store.getters['policies/ipmiProtocolEnabled'];
      },
      set(newValue) {
        return newValue;
      },
    },
    rtadState: {
      get() {
        return this.$store.getters['policies/rtadEnabled'] === 'Enabled';
      },
      set(newValue) {
        return newValue;
      },
    },
    vtpmState: {
      get() {
        return this.$store.getters['policies/vtpmEnabled'] === 'Enabled';
      },
      set(newValue) {
        return newValue;
      },
    },
    svleState: {
      get() {
        return this.$store.getters['policies/svleEnabled'] === 'Enabled';
      },
      set(newValue) {
        return newValue;
      },
    },
    tpmPolicyState: {
      get() {
        return this.$store.getters['policies/tpmPolicyEnabled'];
      },
      set(newValue) {
        return newValue;
      },
    },
    hostUsbState: {
      get() {
        return this.$store.getters['policies/hostUsbEnabled'] === 'Enabled';
      },
      set(newValue) {
        return newValue;
      },
    },
    unauthenticatedACFUploadEnablementState: {
      get() {
        return this.$store.getters['policies/acfUploadEnablement'];
      },
      set(newValue) {
        return newValue;
      },
    },
  },

  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('policies/getBiosStatus'),
      this.$store.dispatch('policies/getNetworkProtocolStatus'),
      this.$store.dispatch('policies/getUsbFirmwareUpdatePolicyEnabled'),
      this.$store.dispatch('policies/getUnauthenticatedACFUploadEnablement'),
      this.$store.dispatch('policies/getTpmPolicy'),
      this.$store.dispatch('userManagement/getUsers'),
      this.checkForUserData(),
    ]).finally(() => {
      this.endLoader();
    });
  },
  methods: {
    changeUsbFirmwareUpdatePolicyState(state) {
      this.$store
        .dispatch('policies/saveUsbFirmwareUpdatePolicyEnabled', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeHostUsbState(state) {
      this.$store
        .dispatch('policies/saveHostUsbEnabled', state ? 'Enabled' : 'Disabled')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeIpmiProtocolState(state) {
      this.$store
        .dispatch('policies/saveIpmiProtocolState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeSshProtocolState(state) {
      this.$store
        .dispatch('policies/saveSshProtocolState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeRtadState(state) {
      this.$store
        .dispatch('policies/saveRtadState', state ? 'Enabled' : 'Disabled')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeVtpmState(state) {
      this.$store
        .dispatch('policies/saveVtpmState', state ? 'Enabled' : 'Disabled')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeSvleState(state) {
      this.$store
        .dispatch('policies/saveSvleState', state ? 'Enabled' : 'Disabled')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeTpmPolicyState(state) {
      this.$store
        .dispatch('policies/saveTpmPolicy', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeUnauthenticatedACFUploadEnablement(state) {
      this.$store
        .dispatch('policies/saveUnauthenticatedACFUploadEnablement', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    checkForUserData() {
      if (!this.currentUser) {
        this.$store.dispatch('userManagement/getUsers');
        this.$store.dispatch('global/getCurrentUser');
      }
    },
  },
};
</script>
