<template>
  <page-section
    :section-title="$t('pageInventory.systemIndicator.sectionTitle')"
  >
    <div class="form-background">
      <b-row class="pl-4 pt-4 pb-1">
        <b-col sm="6" md="3">
          <dl>
            <dt>{{ $t('pageInventory.systemIndicator.powerStatus') }}</dt>
            <dd>
              {{ $t(powerStatus) }}
            </dd>
            <led-component
              ref="PowerStatusLedRef"
              :led-value="powerStatus"
              :is-service-led="true"
              off-colour="white"
              on-colour="green"
              :is-solid-led="true"
            ></led-component>
          </dl>
        </b-col>
        <b-col sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.identifyLed') }}
            </dt>
            <dd>
              <b-form-checkbox
                id="identifyLedSwitchService"
                v-model="systems.locationIndicatorActive"
                data-test-id="inventoryService-toggle-identifyLed"
                switch
                @change="toggleIdentifyLedSwitch"
              >
                <span v-if="systems.locationIndicatorActive">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </b-form-checkbox>

              <led-component
                ref="LEDStatusidentifyLedRef"
                :issysidentify-led="sysIdentifyLed"
                :is-service-led="true"
                off-colour="white"
                on-colour="blue"
              ></led-component>
            </dd>
          </dl>
        </b-col>
        <b-col sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.attentionLed') }}
              <info-tooltip
                :title="
                  $t('pageInventory.systemIndicator.attentionLedToolTipInfo')
                "
              />
            </dt>
            <dd>
              <b-form-checkbox
                id="attentionLedSwitch"
                v-model="systems.sysAttentionLed"
                data-test-id="hardwareStatus-toggle-attentionLed"
                :disabled="!systems.sysAttentionLed"
                switch
                @change="toggleSystemAttentionLedSwitch"
              >
                <span v-if="systems.sysAttentionLed">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </b-form-checkbox>
              <led-component
                ref="identifyattentionLedRef"
                :is-service-led="true"
                :issys-attention-led="sysAttentionLed"
                off-colour="white"
                on-colour="amber"
              ></led-component>
            </dd>
          </dl>
        </b-col>
        <b-col sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.lampTest') }}
              <info-tooltip
                :title="$t('pageInventory.systemIndicator.tooltipInfo')"
              />
            </dt>
            <dd>
              <b-form-checkbox
                id="lampSwitch"
                v-model="systems.lampTest"
                :disabled="systems.lampTest"
                data-test-id="hardwareStatus-toggle-lampTest"
                switch
                @change="toggleLampTestSwitch"
              >
                <span class="sr-only">
                  {{ $t('pageInventory.systemIndicator.lampTest') }}
                </span>
                <span v-if="systems.lampTest">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
      </b-row>
    </div>
  </page-section>
</template>
<script>
import InfoTooltip from '@/components/Global/InfoTooltip';
import PageSection from '@/components/Global/PageSection';
import LedComponent from '@/components/Global/LedComponent';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  components: { InfoTooltip, PageSection, LedComponent },
  mixins: [BVToastMixin, DataFormatterMixin],
  data() {
    return {
      isLampTestEditable: true,
      intervalId: 0,
    };
  },
  computed: {
    systems() {
      let systemData = this.$store.getters['system/systems'][0];
      return systemData ? systemData : {};
    },
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
    powerStatus() {
      if (this.serverStatus === 'unreachable') {
        return `global.status.off`;
      }
      return `global.status.${this.serverStatus}`;
    },
    sysIdentifyLed() {
      let systemData = this.$store.getters['system/systems'][0];
      return systemData.issysidentifyLed;
    },
    sysAttentionLed() {
      let systemData = this.$store.getters['system/systems'][0];
      return systemData.issysAttentionLed;
    },
  },
  watch: {
    systems: function (value) {
      if (value.lampTest) {
        this.isLampTestEditable = false;
        setTimeout(() => {
          this.isLampTestEditable = true;
        }, 240000);
      }
    },
    isLampTestEditable: function (value) {
      if (value) {
        this.$store.dispatch('system/getSystem');
      }
    },
    powerStatus: function (value) {
      this.updatePowerStatusLedState(value);
    },
  },
  created() {
    this.$store.dispatch('system/getSystem').finally(() => {
      // Emit initial data fetch complete to parent component
      this.$root.$emit('hardware-status-service-complete');
      // this.updatePowerStatusLedState(`global.status.${this.serverStatus}`);
    });
  },
  methods: {
    toggleIdentifyLedSwitch(ledState) {
      this.$store
        .dispatch('system/changeIdentifyLedState', ledState)
        .then(() => {
          //this.successToast(message);
          if (ledState) {
            this.$refs.LEDStatusidentifyLedRef.turnon();
          } else {
            this.$refs.LEDStatusidentifyLedRef.turnoff();
          }
        })
        .catch(({ message }) => {
          this.$refs.LEDStatusidentifyLedRef.turnErrorColor();
          this.errorToast(message);
        });
    },
    toggleSystemAttentionLedSwitch(systemLedState) {
      this.$store
        .dispatch('system/changeSystemAttentionLedState', systemLedState)
        .then(() => {
          if (systemLedState) {
            this.$refs.identifyattentionLedRef.turnon();
          } else {
            this.$refs.identifyattentionLedRef.turnoff();
          }
        })
        .catch(({ message }) => {
          this.$refs.identifyattentionLedRef.turnErrorColor();
          this.errorToast(message);
        });
    },
    updatePowerStatusLedState(powerStatus) {
      try {
        if (powerStatus === `global.status.on`) {
          this.$refs.PowerStatusLedRef.stopBlinking();
          this.$refs.PowerStatusLedRef.turnon();
        } else {
          this.$refs.PowerStatusLedRef.startBlinking();
        }
      } catch (message) {
        this.$refs.PowerStatusLedRef.startBlinking();
        this.errorToast(message);
      }
    },
    toggleLampTestSwitch(lampTestState) {
      this.$store
        .dispatch('system/changeLampTestState', lampTestState)
        .then((message) => {
          this.successToast(message);
          this.isLampTestEditable = false;
          setTimeout(() => {
            this.isLampTestEditable = true;
          }, 240000);
        })
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
