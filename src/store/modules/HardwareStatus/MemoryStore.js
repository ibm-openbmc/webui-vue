import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const MemoryStore = defineStore('memoryStore', {
  state: () => ({
    dimms: [],
  }),
  getters: {
    dimmsGetter: (state) => state.dimms,
  },
  actions: {
    setMemoryInfo(data) {
      this.dimms = data.map(({ data }) => {
        const {
          Id,
          Status = {},
          CapacityMiB,
          Enabled,
          Name,
          PartNumber,
          SerialNumber,
          SparePartNumber,
          Model,
          LocationIndicatorActive,
          Location,
        } = data;
        return {
          id: Id,
          health: Status.Health,
          capacityMiB: CapacityMiB,
          enabled: Enabled,
          name: Name,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          sparePartNumber: SparePartNumber,
          model: Model,
          identifyLed: LocationIndicatorActive,
          uri: data['@odata.id'],
          locationNumber: Location?.PartLocation?.ServiceLabel,
        };
      });
    },
    async getDimms() {
      this.setMemoryInfo([]);
      return await api
        .get('/redfish/v1/Systems/system/Memory')
        .then(({ data: { Members } }) => {
          const promises = Members.map((item) => api.get(item['@odata.id']));
          return api.all(promises);
        })
        .then((response) => this.setMemoryInfo(response))
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
          this.getDimms();
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

export default MemoryStore;
