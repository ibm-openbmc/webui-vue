import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { PcieSlotsStore } from './PcieSlotsStore';

export const FabricAdaptersStore = defineStore('fabricStore', {
  state: () => ({
    fabricAdapters: [],
  }),
  getters: {
    fabricAdaptersGetter: (state) => state.fabricAdapters,
  },
  actions: {
    setFabricAdaptersInfo(data) {
      this.fabricAdapters = data.map((adapter) => {
        const {
          Id,
          Location,
          LocationIndicatorActive,
          Status,
          Model,
          Name,
          PartNumber,
          SerialNumber,
          SparePartNumber,
        } = adapter;
        return {
          health: Status?.Health,
          id: Id,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          sparePartNumber: SparePartNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: adapter['@odata.id'],
        };
      });
    },
    async getFabricAdaptersInfo(requestBody) {
      this.setFabricAdaptersInfo([]);
      // PcieSlotsStore (mounts before this component) already fetched PCIeSlots.
      // Reuse its data — either await the in-flight request or use the already-
      // populated rawSlots — to avoid a duplicate GET to /PCIeSlots.
      const pcieSlotsStore = PcieSlotsStore();
      const pciePromise =
        pcieSlotsStore.rawSlots.length > 0
          ? Promise.resolve(pcieSlotsStore.rawSlots)
          : pcieSlotsStore
              .getPcieSlotsInfo(requestBody)
              .then(() => pcieSlotsStore.rawSlots);
      return await api
        .all([
          pciePromise,
          api.get(
            `/redfish/v1/Systems/system/FabricAdapters?$expand=.($levels=1)`,
          ),
        ])
        .then(([slots, fabricRes]) => {
          const tempFabricAdapters = [];
          fabricRes.data.Members.forEach((member) => {
            if (member?.Links?.PCIeDevices?.length > 0) {
              slots.forEach((singleSlot) => {
                if (
                  singleSlot.Links?.PCIeDevice?.[0]?.['@odata.id'] ===
                  member?.Links?.PCIeDevices?.[0]?.['@odata.id']
                ) {
                  tempFabricAdapters.push(member);
                }
              });
            } else {
              if (
                member['@odata.id'].includes('motherboard') &&
                requestBody.uri.endsWith('chassis')
              ) {
                tempFabricAdapters.push(member);
              }
            }
          });
          this.setFabricAdaptersInfo(tempFabricAdapters);
        })
        .catch((error) => console.log(error));
    },
    async updateIdentifyLedValue(led) {
      const uri = led.uri;
      const updatedIdentifyLedValue = {
        LocationIndicatorActive: led.identifyLed,
      };
      return await api
        .patch(uri, updatedIdentifyLedValue)
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
          this.getFabricAdaptersInfo({
            uri: led.chassisUri,
          });
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

export default FabricAdaptersStore;
