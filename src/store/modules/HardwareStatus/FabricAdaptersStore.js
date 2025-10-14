import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

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
      let tempFabricAdapters = [];
      this.setFabricAdaptersInfo(tempFabricAdapters);
      const res = await api.get(requestBody.uri + '/PCIeSlots');
      return await api
        .get(`/redfish/v1/Systems/system/FabricAdapters`)
        .then(({ data }) => {
          data.Members.map((member) => {
            api.get(member['@odata.id']).then((memberResponse) => {
              if (memberResponse.data?.Links?.PCIeDevices.length > 0) {
                res.data.Slots.map((singleSlot) => {
                  if (
                    singleSlot.Links?.PCIeDevice?.[0]?.['@odata.id'] ===
                    memberResponse.data?.Links?.PCIeDevices?.[0]?.['@odata.id']
                  ) {
                    tempFabricAdapters.push(memberResponse.data);
                    this.setFabricAdaptersInfo(tempFabricAdapters);
                  }
                });
              } else {
                if (
                  member['@odata.id'].includes('motherboard') &&
                  requestBody.uri.endsWith('chassis')
                ) {
                  tempFabricAdapters.push(memberResponse.data);
                  this.setFabricAdaptersInfo(tempFabricAdapters);
                }
              }
            });
          });
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
