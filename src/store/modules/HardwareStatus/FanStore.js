import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const FanStore = defineStore('fanStore', {
  state: () => ({
    fans: [],
  }),
  getters: {
    fansGetter: (state) => state.fans,
  },
  actions: {
    setFanInfo(data) {
      this.fans = data.map((fan) => {
        const {
          LocationIndicatorActive,
          Location,
          Id,
          Model,
          Name,
          Status = {},
          PartNumber,
          SerialNumber,
          SparePartNumber,
        } = fan;
        return {
          id: Id,
          health: Status.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          sparePartNumber: SparePartNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: fan['@odata.id'],
        };
      });
    },
    async getAllFans(requestBody) {
      this.setFanInfo([]);
      return await api
        .get(`${requestBody.uri}`)
        .then((response) =>
          api.get(response.data.ThermalSubsystem['@odata.id']),
        )
        .then((response) => api.get(response.data.Fans['@odata.id']))
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id']),
        )
        .then((fanIds) => api.all(fanIds.map((fan) => api.get(fan))))
        .then((fans) => {
          const fansData = fans.map((fans) => fans.data);
          this.setFanInfo(fansData);
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
          const chassisUri = uri.split('/ThermalSubsystem').shift();
          this.getAllFans({ uri: chassisUri });
          console.log(error);
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

export default FanStore;
