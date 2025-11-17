import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const ChassisStore = defineStore('chassisStore', {
  state: () => ({
    chassis: [],
    powerState: null,
  }),
  getters: {
    chassisGetter: (state) => state.chassis,
    powerStateGetter: (state) => state.powerState,
  },
  actions: {
    setChassisInfo(data) {
      this.chassis = data.map((chassis) => {
        const {
          Id,
          Status = {},
          LocationIndicatorActive,
          Name,
          Location,
          Version,
        } = chassis;

        return {
          id: Id,
          health: Status.Health,
          statusState: Status.State,
          name: Name,
          identifyLed: LocationIndicatorActive,
          uri: chassis['@odata.id'],
          locationNumber: Location?.PartLocation?.ServiceLabel,
          firmwareVersion: Version,
        };
      });
    },
    setPowerState: (state, powerState) => (state.powerState = powerState),
    async fetchGetChassisInfo() {
      return await api
        .get('/redfish/v1/Chassis')
        .then(({ data: { Members = [] } }) =>
          Members.map((member) => api.get(member['@odata.id'])),
        )
        .then((promises) => api.all(promises))
        .then((response) => {
          const data = response.map(({ data }) => data);
          this.setChassisInfo(data);
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
          this.fetchGetChassisInfo();
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
          this.fetchGetChassisInfo();
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
    async getPowerState() {
      return await api
        .get('/redfish/v1/Chassis/chassis')
        .then(({ data: { PowerState = null } }) => {
          this.powerState = PowerState;
        })
        .catch((error) => console.log(error));
    },
  },
});

export default ChassisStore;
