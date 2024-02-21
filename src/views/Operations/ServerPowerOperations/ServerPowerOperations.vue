<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.serverPowerOperations')" />
    <b-row class="mb-4">
      <b-col sm="10">
        <page-section
          class="mb-0"
          :section-title="$t('pageServerPowerOperations.currentStatus')"
        >
          <b-row v-if="isInPhypStandby">
            <b-col>
              <alert variant="info">
                <span class="font-weight-bold">
                  {{ $t('pageServerPowerOperations.phypStandby') }}
                </span>
                <p class="mt-1">
                  {{ $t('pageServerPowerOperations.osRuntimeMessage') }}
                </p>
                <p>
                  {{ $t('pageServerPowerOperations.saveOsRuntimeMessage') }}
                </p>
                <p>
                  {{ $t('pageServerPowerOperations.discardOsRuntimeMessage') }}
                </p>
                <template #action>
                  <b-button
                    variant="link"
                    class="mt-3 d-flex justify-content-between align-items-center"
                    @click="standbyToRuntime"
                  >
                    <span class="pr-1">
                      {{ $t('pageServerPowerOperations.osRuntimeButton') }}
                    </span>
                    <icon-arrow-right />
                  </b-button>
                  <b-button
                    variant="link"
                    class="d-flex justify-content-between align-items-center"
                    @click="saveStandbyToRuntime"
                  >
                    <span class="pr-1">
                      {{ $t('pageServerPowerOperations.saveOsRuntimeButton') }}
                    </span>
                    <icon-arrow-right />
                  </b-button>
                  <b-button
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
                  </b-button>
                </template>
              </alert>
            </b-col>
          </b-row>
          <div v-if="!isInPhypStandby" class="form-background pt-3 pl-3">
            <b-row>
              <b-col sm="3">
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
              </b-col>
              <b-col>
                <dl>
                  <dt>
                    {{ $t('pageServerPowerOperations.lastPowerOperation') }}
                  </dt>
                  <dd
                    v-if="lastPowerOperationTime"
                    data-test-id="powerServerOps-text-lastPowerOp"
                  >
                    {{ lastPowerOperationTime | formatDate }}
                    {{ lastPowerOperationTime | formatTime }}
                  </dd>
                  <dd v-else>--</dd>
                </dl>
              </b-col>
            </b-row>
          </div>
        </page-section>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <page-section
          :section-title="$t('pageServerPowerOperations.operations')"
        >
          <template v-if="isOperationInProgress">
            <alert variant="info">
              {{ $t('pageServerPowerOperations.operationInProgress') }}
            </alert>
          </template>
          <template v-else-if="serverStatus === 'off'">
            <b-button
              variant="primary"
              data-test-id="serverPowerOperations-button-powerOn"
              @click="powerOn"
            >
              {{ $t('pageServerPowerOperations.powerOn') }}
            </b-button>
          </template>
          <template v-else>
            <b-row>
              <b-col sm="5">
                <!-- Reboot server -->
                <b-form novalidate class="mb-5" @submit.prevent="rebootServer">
                  <b-form-group>
                    <label for="orderly-reboot">{{
                      $t('pageServerPowerOperations.rebootServer')
                    }}</label>
                    <div id="orderly-reboot">
                      {{ $t('pageServerPowerOperations.orderlyReboot') }}
                    </div>
                  </b-form-group>
                  <b-button
                    variant="primary"
                    type="submit"
                    data-test-id="serverPowerOperations-button-reboot"
                  >
                    {{ $t('pageServerPowerOperations.reboot') }}
                  </b-button>
                </b-form>
              </b-col>
              <!-- Shutdown server options -->
              <b-col sm="5">
                <b-form novalidate @submit.prevent="shutdownServer">
                  <b-form-group
                    :label="$t('pageServerPowerOperations.shutdownServer')"
                  >
                    <b-form-radio
                      v-model="form.shutdownOption"
                      name="shutdown-option"
                      data-test-id="serverPowerOperations-radio-shutdownOrderly"
                      value="orderly"
                    >
                      {{ $t('pageServerPowerOperations.orderlyShutdown') }}
                    </b-form-radio>
                    <b-form-radio
                      v-model="form.shutdownOption"
                      name="shutdown-option"
                      data-test-id="serverPowerOperations-radio-shutdownImmediate"
                      value="immediate"
                    >
                      {{ $t('pageServerPowerOperations.immediateShutdown') }}
                    </b-form-radio>
                  </b-form-group>
                  <b-button
                    variant="primary"
                    type="submit"
                    data-test-id="serverPowerOperations-button-shutDown"
                  >
                    {{ $t('pageServerPowerOperations.shutDown') }}
                  </b-button>
                </b-form>
              </b-col>
            </b-row>
          </template>
        </page-section>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="8" md="7" lg="7" xl="9">
        <page-section
          :section-title="$t('pageServerPowerOperations.serverBootSettings')"
        >
          <b-row class="mt-3 mb-3">
            <b-col>
              <b-button
                v-if="isInPhypStandby && hmcInfo !== 'Enabled' && isIBMi"
                variant="primary"
                data-test-id="network-settings"
                @click="openNetworkSettings"
              >
                {{ 'Network settings' }}
              </b-button>
              <alert v-else variant="info">
                {{ $t('pageServerPowerOperations.modal.alert.available') }}
              </alert>
            </b-col>
          </b-row>
          <boot-settings
            :is-in-phyp-standby="isInPhypStandby"
            :is-updated="isUpdated"
            @update-standby="updateToRuntime()"
          />
        </page-section>
      </b-col>
    </b-row>
    <!-- Modal -->
    <network-settings-modal />
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import BootSettings from './BootSettings';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import Alert from '@/components/Global/Alert';
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';
import NetworkSettingsModal from './NetworkSettingsModal';

export default {
  name: 'ServerPowerOperations',
  components: {
    PageTitle,
    PageSection,
    BootSettings,
    Alert,
    IconArrowRight: ArrowRight16,
    NetworkSettingsModal,
  },
  mixins: [BVToastMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      phypStandby: false,
      isUpdated: false,
      form: {
        rebootOption: 'orderly',
        shutdownOption: 'orderly',
      },
    };
  },
  computed: {
    isInPhypStandby() {
      if (!this.phypStandby) {
        const bootProgress = this.$store.getters['global/bootProgress'];
        if (bootProgress === 'SystemHardwareInitializationComplete') {
          return true;
        } else {
          return false;
        }
      } else return false;
    },
    bmc() {
      return this.$store.getters['bmc/bmc'];
    },
    hmcInfo() {
      return this.$store?.getters['global/hmcManaged'];
    },
    isIBMi() {
      if (
        this.attributeKeys?.pvm_default_os_type === 'Default' ||
        this.attributeKeys?.pvm_default_os_type === 'IBM I'
      ) {
        return true;
      } else {
        return false;
      }
    },
    attributeKeys() {
      return this.$store.getters['serverBootSettings/biosAttributes'];
    },
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
    isOperationInProgress() {
      return this.$store.getters['controls/isOperationInProgress'];
    },
    lastPowerOperationTime() {
      return this.$store.getters['controls/lastPowerOperationTime'];
    },
    oneTimeBootEnabled() {
      return this.$store.getters['serverBootSettings/overrideEnabled'];
    },
    systemDumpActive() {
      return this.$store?.getters['serverBootSettings/systemDumpActive'];
    },
  },
  created() {
    this.startLoader();
    const bootSettingsPromise = new Promise((resolve) => {
      this.$root.$on('server-power-operations-boot-settings-complete', () =>
        resolve()
      );
    });
    Promise.all([
      this.$store.dispatch('serverBootSettings/getOperatingModeSettings'),
      this.$store.dispatch('controls/getLastPowerOperationTime'),
      this.$store.dispatch('bmc/getBmcInfo'),
      this.$store.dispatch('global/getBootProgress'),
      bootSettingsPromise,
    ]).finally(() => this.endLoader());
  },
  methods: {
    openNetworkSettings() {
      this.$bvModal.show('modal-network-settings');
    },
    discardStandbyToRuntime() {
      this.getRequiredResponses();
    },
    saveStandbyToRuntime() {
      this.isUpdated = true;
    },
    updateToRuntime() {
      this.isUpdated = false;
      this.standbyToRuntime();
    },
    getRequiredResponses() {
      this.startLoader();
      Promise.all([
        this.$store.dispatch('serverBootSettings/getOperatingModeSettings'),
        this.$store.dispatch('controls/getLastPowerOperationTime'),
        this.$store.dispatch('bmc/getBmcInfo'),
        this.$store.dispatch('global/getBootProgress'),
        this.$store.dispatch('serverBootSettings/getLocationCodes'),
        this.$store.dispatch('resourceMemory/getHmcManaged'),
        this.$store.dispatch('serverBootSettings/getBiosAttributes'),
        this.$store.dispatch('serverBootSettings/getAttributeValues'),
      ]).finally(() => {
        this.endLoader();
        this.standbyToRuntime();
      });
    },
    powerOn() {
      if (
        this.bmc.powerState === 'On' &&
        this.bmc.statusState === 'Enabled' &&
        this.bmc.health === 'OK'
      ) {
        this.$store.dispatch('controls/serverPowerOn');
      } else {
        this.errorToast(
          this.$t('pageServerPowerOperations.toast.errorPowerOn')
        );
      }
    },
    rebootServer() {
      this.$store.dispatch('serverBootSettings/getBiosAttributes').then(() => {
        const modalMessage = `${
          this.systemDumpActive
            ? this.$t('pageServerPowerOperations.modal.confirmRebootMessage2')
            : ''
        } ${this.$t('pageServerPowerOperations.modal.confirmRebootMessage')}`;
        const modalOptions = {
          title: this.$t('pageServerPowerOperations.modal.confirmRebootTitle'),
          okVariant: this.systemDumpActive ? 'danger' : 'primary',
          okTitle: this.systemDumpActive
            ? this.$t('pageServerPowerOperations.reboot')
            : this.$t('global.action.confirm'),
          cancelTitle: this.$t('global.action.cancel'),
        };

        if (this.form.rebootOption === 'orderly') {
          this.$bvModal
            .msgBoxConfirm(modalMessage, modalOptions)
            .then((confirmed) => {
              if (confirmed) this.$store.dispatch('controls/serverSoftReboot');
            });
        } else if (this.form.rebootOption === 'immediate') {
          this.$bvModal
            .msgBoxConfirm(modalMessage, modalOptions)
            .then((confirmed) => {
              if (confirmed) this.$store.dispatch('controls/serverHardReboot');
            });
        }
      });
    },
    shutdownServer() {
      const modalMessage = `${
        this.systemDumpActive
          ? this.$t('pageServerPowerOperations.modal.confirmShutdownMessage2')
          : ''
      } ${this.$t('pageServerPowerOperations.modal.confirmShutdownMessage')}`;
      const modalOptions = {
        title: this.$t('pageServerPowerOperations.modal.confirmShutdownTitle'),
        okTitle: this.systemDumpActive
          ? this.$t('pageServerPowerOperations.shutDown')
          : this.$t('global.action.confirm'),
        okVariant: this.systemDumpActive ? 'danger' : 'primary',
        cancelTitle: this.$t('global.action.cancel'),
      };

      if (this.form.shutdownOption === 'orderly') {
        this.$bvModal
          .msgBoxConfirm(modalMessage, modalOptions)
          .then((confirmed) => {
            if (confirmed) this.$store.dispatch('controls/serverSoftPowerOff');
          });
      }
      if (this.form.shutdownOption === 'immediate') {
        this.$bvModal
          .msgBoxConfirm(modalMessage, modalOptions)
          .then((confirmed) => {
            if (confirmed) this.$store.dispatch('controls/serverHardPowerOff');
          });
      }
    },
    standbyToRuntime() {
      this.$store
        .dispatch('serverBootSettings/standbyToRuntime')
        .then((message) => {
          this.phypStandby = true;
          this.isInPhypStandby;
          this.successToast(message);
        })
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
