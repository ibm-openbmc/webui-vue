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
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  components: { InfoTooltip, PageSection },
  mixins: [BVToastMixin, DataFormatterMixin],
  data() {
    return {
      isLampTestEditable: true,
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
  },
  created() {
    this.$store.dispatch('system/getSystem').finally(() => {
      // Emit initial data fetch complete to parent component
      this.$root.$emit('hardware-status-service-complete');
    });
  },
  methods: {
    toggleIdentifyLedSwitch(ledState) {
      this.$store
        .dispatch('system/changeIdentifyLedState', ledState)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    toggleSystemAttentionLedSwitch(systemLedState) {
      this.$store
        .dispatch('system/changeSystemAttentionLedState', systemLedState)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
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
