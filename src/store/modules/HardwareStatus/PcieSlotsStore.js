import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

// Module-level in-flight cache — avoids wrapping a Promise in Pinia's reactive state.
let _pcieSlotsFetchPromise = null;

export const PcieSlotsStore = defineStore('pcieSlotsStore', {
  state: () => ({
    pcieSlots: [],
    rawSlots: [],
  }),
  getters: {
    pcieSlotsGetter: (state) => state.pcieSlots,
    rawSlotsGetter: (state) => state.rawSlots,
  },
  actions: {
    setPcieSlotsInfo(data) {
      this.pcieSlots = data.map((slot) => {
        const { LocationIndicatorActive, Location, SlotType } = slot;
        return {
          type: SlotType,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
        };
      });
    },
    async getPcieSlotsInfo(requestBody) {
      // Deduplicate concurrent calls — share the in-flight promise so
      // FabricAdaptersStore can also await it without a second HTTP request.
      if (_pcieSlotsFetchPromise) return _pcieSlotsFetchPromise;
      this.setPcieSlotsInfo([]);
      this.rawSlots = [];
      _pcieSlotsFetchPromise = api
        .get(`${requestBody.uri}/PCIeSlots`)
        .then(({ data }) => {
          this.rawSlots = data.Slots ?? [];
          this.setPcieSlotsInfo(this.rawSlots);
        })
        .catch((error) => console.log(error))
        .finally(() => {
          _pcieSlotsFetchPromise = null;
        });
      return _pcieSlotsFetchPromise;
    },
    async updateIdentifyLedValue(led) {
      const tempPcieSlots = [];
      this.pcieSlots.map((slot) => {
        if (slot.locationNumber === led.locationNumber) {
          tempPcieSlots.push({ LocationIndicatorActive: led.identifyLed });
        } else {
          tempPcieSlots.push({});
        }
      });
      const updatedIdentifyLedValue = {
        Slots: tempPcieSlots,
      };
      return await api
        .patch(`${led.uri}/PCIeSlots`, updatedIdentifyLedValue)
        .then(() => {
          if (led.identifyLed) {
            return i18n.global.t(
              'pageInventory.toast.successEnableIdentifyLed',
            );
          } else {
            return i18n.global.t(
              'pageInventory.toast.successDisableIdentifyLed',
            );
          }
        })
        .catch((error) => {
          this.getPcieSlotsInfo({ uri: led.uri });
          console.log('error', error);
          if (led.identifyLed) {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorEnableIdentifyLed'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
            );
          }
        });
    },
  },
});

export default PcieSlotsStore;
