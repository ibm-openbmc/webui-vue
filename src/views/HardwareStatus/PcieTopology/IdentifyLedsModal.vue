<template>
  <b-modal
    id="modal-leds"
    ref="modal"
    v-model="props.openIdentifyLedModal"
    hide-footer
    title="Identify LEDs"
    title-tag="h2"
    @hidden="onModalHidden"
  >
    <b-row>
      <b-col>
        <dt>{{ i18n.global.t('pagePcieTopology.id') }}</dt>
        <dd>{{ dataFormatter(props.selectedObj.id) }}</dd>
      </b-col>
      <b-col>
        <dt>{{ i18n.global.t('pagePcieTopology.parentId') }}</dt>
        <dd>{{ dataFormatter(props.selectedObj.parentId) }}</dd>
      </b-col>
    </b-row>

    <div v-if="pcieBridgeLed.length > 0" class="headerStyle mb-2 mt-1">
      {{ i18n.global.t('pagePcieTopology.bridgeOrHost') }}
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
      {{ i18n.global.t('pagePcieTopology.localPort') }}
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
      {{ i18n.global.t('pagePcieTopology.remotePort') }}s
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
      {{ i18n.global.t('pagePcieTopology.ioSlots') }}
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
<script setup>
import { ref, defineProps, watch, computed } from 'vue';
import stores from '../../../store';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import useToast from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';

const pcieTopologyStore = stores.PcieTopologyStore();
const { dataFormatter } = useDataFormatterGlobal();
const props = defineProps({
  selectedObj: {
    type: Object,
    default: null,
  },
  openIdentifyLedModal: {
    type: Boolean,
    default: false,
  },
});
const { successToast, errorToast } = useToast();
const pcieBridgeLed = ref([]);
const ioSlotsLed = ref([]);
const localPortLed = ref([]);
const remotePortLed = ref([]);

watch(
  () => props.selectedObj,
  () => {
    pcieBridgeLed.value = [];
    ioSlotsLed.value = [];
    localPortLed.value = [];
    remotePortLed.value = [];
    getAllLeds();
  },
);

const emitUpdate = defineEmits(['update:openIdentifyLedModal']);
function onModalHidden() {
  emitUpdate('update:openIdentifyLedModal', false);
}

const getAllLeds = async () => {
  await pcieTopologyStore
    .getAllLedValues(props.selectedObj)
    .then((returnedObj) => {
      pcieBridgeLed.value = returnedObj.pcieBridge;
      localPortLed.value = [];
      props.selectedObj.localPortLocation.map((selectedPort) => {
        returnedObj.localPortLocation.map((returnedPort) => {
          if (selectedPort.locationNumber === returnedPort.locationNumber) {
            localPortLed.value.push(returnedPort);
          }
        });
      });
      remotePortLed.value = [];
      props.selectedObj.remotePortLocation.map((selectedPort) => {
        returnedObj.remotePortLocation.map((returnedPort) => {
          if (selectedPort.locationNumber === returnedPort.locationNumber) {
            remotePortLed.value.push(returnedPort);
          }
        });
      });
      ioSlotsLed.value = [];
      if (props.selectedObj.ioSlots.length > 0) {
        props.selectedObj.ioSlots.map((selectedSlot) => {
          returnedObj.ioSlots.map((returnedSlot) => {
            if (selectedSlot.locationNumber === returnedSlot.locationNumber) {
              ioSlotsLed.value.push(returnedSlot);
            }
          });
        });
      }
    });
};

const changeLedValue = async (value, type) => {
  pcieTopologyStore
    .updateLedValue({ value: value, type: type })
    .then(() => {
      getAllLeds();
      if (value.led) {
        successToast(
          i18n.global.t('pagePcieTopology.toast.successEnableIdentifyLed'),
        );
      } else {
        successToast(
          i18n.global.t('pagePcieTopology.toast.successDisableIdentifyLed'),
        );
      }
    })
    .catch(() => {
      getAllLeds();
      if (value.led) {
        errorToast(
          i18n.global.t('pagePcieTopology.toast.errorEnableIdentifyLed'),
        );
      } else {
        errorToast(
          i18n.global.t('pagePcieTopology.toast.errorDisableIdentifyLed'),
        );
      }
    });
};
</script>
<style scoped>
.headerStyle {
  font-weight: bold;
}
</style>
