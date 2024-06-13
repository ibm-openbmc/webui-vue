import api from '@/store/api';
import i18n from '@/i18n';

const ChassisStore = {
  namespaced: true,
  state: {
    chassis: [],
    powerState: null,
  },
  getters: {
    chassis: (state) => state.chassis,
    powerState: (state) => state.powerState,
  },
  mutations: {
    setChassisInfo: (state, data) => {
      state.chassis = data.map((chassis) => {
        const {
          Id,
          Status = {},
          LocationIndicatorActive,
          Name,
          Location,
          Oem,
        } = chassis;

        return {
          id: Id,
          health: Status.Health,
          statusState: Status.State,
          name: Name,
          identifyLed: LocationIndicatorActive,
          uri: chassis['@odata.id'],
          locationNumber: Location?.PartLocation?.ServiceLabel,
          firmwareVersion: Oem?.OpenBMC?.FirmwareVersion,
        };
      });
    },
    setPowerState: (state, powerState) => (state.powerState = powerState),
  },
  actions: {
    async getChassisInfo({ commit }) {
      return await api
        .get('/redfish/v1/Chassis')
        .then(({ data: { Members = [] } }) =>
          Members.map((member) => api.get(member['@odata.id'])),
        )
        .then((promises) => api.all(promises))
        .then((response) => {
          const data = response.map(({ data }) => data);
          commit('setChassisInfo', data);
        })
        .catch((error) => console.log(error));
    },
    async updateIdentifyLedValue({ dispatch }, led) {
      const uri = led.uri;
      const updatedIdentifyLedValue = {
        LocationIndicatorActive: led.identifyLed,
      };
      return await api
        .patch(uri, updatedIdentifyLedValue)
        .then(() => {
          dispatch('getChassisInfo');
          if (led.identifyLed) {
            return i18n.t('pageInventory.toast.successEnableIdentifyLed');
          } else {
            return i18n.t('pageInventory.toast.successDisableIdentifyLed');
          }
        })
        .catch((error) => {
          dispatch('getChassisInfo');
          console.log('error', error);
          if (led.identifyLed) {
            throw new Error(
              i18n.t('pageInventory.toast.errorEnableIdentifyLed'),
            );
          } else {
            throw new Error(
              i18n.t('pageInventory.toast.errorDisableIdentifyLed'),
            );
          }
        });
    },
    async getPowerState({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis')
        .then(({ data: { PowerState = null } }) => {
          commit('setPowerState', PowerState);
        })
        .catch((error) => console.log(error));
    },
  },
};

export default ChassisStore;
