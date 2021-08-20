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
          Name,
          SpeedPercent,
          Status = {},
          PartNumber,
          SerialNumber,
        } = fan;
        return {
          id: Id,
          health: Status.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          healthRollup: Status.HealthRollup,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location,
          name: Name,
          speedPercent: SpeedPercent.Reading,
          statusState: Status.State,
          uri: fan['@odata.id'],
        };
      });
    },
  },
  actions: {
    async getChassisCollection() {
      return await api
        .get('/redfish/v1/')
        .then((response) => api.get(response.data.Chassis['@odata.id']))
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id'])
        )
        .catch((error) => console.log(error));
    },
    async getAllFans({ dispatch }) {
      const collection = await dispatch('getChassisCollection');
      if (!collection) return;
      return await api
        .all(collection.map((chassis) => dispatch('getFanData', chassis)))
        .catch((error) => console.log(error));
    },
    async getFanData({ commit }, id) {
      return await api
        .get(`${id}`)
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
      return await api.patch(uri, updatedIdentifyLedValue).catch((error) => {
        console.log(error);
        if (led.identifyLed) {
          throw new Error(
            i18n.t('pageHardwareStatus.toast.errorEnableIdentifyLed')
          );
        } else {
          throw new Error(
            i18n.t('pageHardwareStatus.toast.errorDisableIdentifyLed')
          );
        }
      });
    },
  },
};

export default FanStore;
