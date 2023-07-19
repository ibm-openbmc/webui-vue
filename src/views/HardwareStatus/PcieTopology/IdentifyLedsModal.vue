<template>
  <b-modal
    id="modal-leds"
    ref="modal"
    hide-footer
    title="Identify LEDs"
    title-tag="h2"
  >
    <b-row>
      <b-col>
        <dt>{{ $t('pagePcieTopology.id') }}</dt>
        <dd>{{ dataFormatter(selectedObj.id) }}</dd>
      </b-col>
      <b-col>
        <dt>{{ $t('pagePcieTopology.parentId') }}</dt>
        <dd>{{ dataFormatter(selectedObj.parentId) }}</dd>
      </b-col>
    </b-row>

    <div v-if="pcieBridgeLed.length > 0" class="headerStyle mb-2 mt-1">
      {{ $t('pagePcieTopology.bridgeOrHost') }}
    </div>
    <b-row v-if="pcieBridgeLed.length > 0">
      <b-col cols="8">{{
        dataFormatter(pcieBridgeLed[0].locationNumber)
      }}</b-col>
      <b-col cols="4">
        <b-form-checkbox
          id="switch"
          v-model="pcieBridgeLed[0].led"
          data-test-id="pcie-toggle-pcieBridge"
          switch
          @change="changeLedValue(pcieBridgeLed[0], 'pcieBridge')"
        >
        </b-form-checkbox>
      </b-col>
    </b-row>

    <div v-if="localPortLed.length > 0" class="headerStyle mb-2 mt-1">
      {{ $t('pagePcieTopology.localPort') }}
    </div>
    <b-row v-for="(value, i) in localPortLed" :key="'local-port-' + i">
      <b-col cols="8">{{ dataFormatter(value.locationNumber) }}</b-col>
      <b-col cols="4">
        <b-form-checkbox
          :id="'local-port-index-' + i"
          v-model="value.led"
          data-test-id="pcie-toggle-localPort"
          switch
          @change="changeLedValue(value, 'localPort')"
        >
        </b-form-checkbox>
      </b-col>
    </b-row>

    <div v-if="remotePortLed.length > 0" class="headerStyle mb-2 mt-1">
      {{ $t('pagePcieTopology.remotePort') }}s
    </div>
    <b-row v-for="(value, i) in remotePortLed" :key="'remote-port-' + i">
      <b-col cols="8">{{ dataFormatter(value.locationNumber) }}</b-col>
      <b-col cols="4">
        <b-form-checkbox
          :id="'remote-port-index-' + i"
          v-model="value.led"
          data-test-id="pcie-toggle-remotePort"
          switch
          @change="changeLedValue(value, 'remotePort')"
        >
        </b-form-checkbox>
      </b-col>
    </b-row>

    <div v-if="ioSlotsLed.length > 0" class="headerStyle mb-2 mt-1">
      {{ $t('pagePcieTopology.ioSlots') }}
    </div>
    <b-row v-for="(value, i) in ioSlotsLed" :key="'io-slot-i' + i">
      <b-col cols="8">{{ dataFormatter(value.locationNumber) }}</b-col>
      <b-col cols="4">
        <b-form-checkbox
          :id="'io-slot-index-' + i"
          v-model="value.led"
          data-test-id="pcie-toggle-ioSlots"
          switch
          @change="changeLedValue(value, 'ioSlots')"
        >
        </b-form-checkbox>
      </b-col>
    </b-row>
  </b-modal>
</template>
<script>
import VuelidateMixin from '@/components/Mixins/VuelidateMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  mixins: [VuelidateMixin, DataFormatterMixin, BVToastMixin],
  props: {
    selectedObj: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      pcieBridgeLed: [],
      ioSlotsLed: [],
      localPortLed: [],
      remotePortLed: [],
    };
  },
  watch: {
    selectedObj() {
      this.pcieBridgeLed = [];
      this.ioSlotsLed = [];
      this.localPortLed = [];
      this.remotePortLed = [];
      this.getAllLeds();
    },
  },
  methods: {
    async getAllLeds() {
      await this.$store
        .dispatch('pcieTopology/getAllLedValues', this.selectedObj)
        .then((returnedObj) => {
          this.pcieBridgeLed = returnedObj.pcieBridge;
          this.localPortLed = [];
          this.selectedObj.localPortLocation.map((selectedPort) => {
            returnedObj.localPortLocation.map((returnedPort) => {
              if (selectedPort.locationNumber === returnedPort.locationNumber) {
                this.localPortLed.push(returnedPort);
              }
            });
          });
          this.remotePortLed = [];
          this.selectedObj.remotePortLocation.map((selectedPort) => {
            returnedObj.remotePortLocation.map((returnedPort) => {
              if (selectedPort.locationNumber === returnedPort.locationNumber) {
                this.remotePortLed.push(returnedPort);
              }
            });
          });
          this.ioSlotsLed = returnedObj.ioSlots;
        });
    },
    async changeLedValue(value, type) {
      this.$store
        .dispatch('pcieTopology/updateLedValue', { value: value, type: type })
        .then(() => {
          this.getAllLeds();
          if (value.led) {
            this.successToast(
              this.$t('pagePcieTopology.toast.successEnableIdentifyLed')
            );
          } else {
            this.successToast(
              this.$t('pagePcieTopology.toast.successDisableIdentifyLed')
            );
          }
        })
        .catch(() => {
          this.getAllLeds();
          if (value.led) {
            this.errorToast(
              this.$t('pagePcieTopology.toast.errorEnableIdentifyLed')
            );
          } else {
            this.errorToast(
              this.$t('pagePcieTopology.toast.errorDisableIdentifyLed')
            );
          }
        });
    },
  },
};
</script>
<style scoped>
.headerStyle {
  font-weight: bold;
}
</style>
