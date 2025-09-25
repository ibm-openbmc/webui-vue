import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const PcieSlotsStore = defineStore('pcieSlotsStore', {
  state: () => ({
    pcieSlots: [],
  }),
  getters: {
    pcieSlotsGetter: (state) => state.pcieSlots,
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
      this.setPcieSlotsInfo([]);
      return await api
        .get(`${requestBody.uri}/PCIeSlots`)
        .then(({ data }) => {
          this.setPcieSlotsInfo(data.Slots);
        })
        .catch((error) => console.log(error));
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
