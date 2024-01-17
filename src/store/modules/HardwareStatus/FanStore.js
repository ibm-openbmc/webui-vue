import api from '@/store/api';
import i18n from '@/i18n';

const FanStore = {
  namespaced: true,
  state: {
    fans: [],
  },
  getters: {
    fans: (state) => state.fans,
  },
  mutations: {
    setFanInfo: (state, data) => {
      state.fans = data.map((fan) => {
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
          ledStatus: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          sparePartNumber: SparePartNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: fan['@odata.id'],
        };
      });
    },
  },
  actions: {
    async getAllFans({ commit }, requestBody) {
      commit('setFanInfo', []);
      return await api
        .get(`${requestBody.uri}`)
        .then((response) =>
          api.get(response.data.ThermalSubsystem['@odata.id'])
        )
        .then((response) => api.get(response.data.Fans['@odata.id']))
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id'])
        )
        .then((fanIds) => api.all(fanIds.map((fan) => api.get(fan))))
        .then((fans) => {
          const fansData = fans.map((fans) => fans.data);
          commit('setFanInfo', fansData);
        })
        .catch((error) => console.log(error));
    },
    async updateIdentifyLedValue(_, led) {
      const uri = led.uri;
      const updatedIdentifyLedValue = {
        LocationIndicatorActive: led.identifyLed,
      };
      return await api
        .patch(uri, updatedIdentifyLedValue)
        .then(() => {
          if (led.identifyLed) {
            return i18n.t('pageInventory.toast.successEnableIdentifyLed');
          } else {
            return i18n.t('pageInventory.toast.successDisableIdentifyLed');
          }
        })
        .catch((error) => {
          console.log(error);
          if (led.identifyLed) {
            throw new Error(
              i18n.t('pageInventory.toast.errorEnableIdentifyLed')
            );
          } else {
            throw new Error(
              i18n.t('pageInventory.toast.errorDisableIdentifyLed')
            );
          }
        });
    },
  },
};

export default FanStore;
