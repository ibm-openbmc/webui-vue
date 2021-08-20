import api from '@/store/api';
import i18n from '@/i18n';

const PowerSupplyStore = {
  namespaced: true,
  state: {
    powerSupplies: [],
  },
  getters: {
    powerSupplies: (state) => state.powerSupplies,
  },
  mutations: {
    setPowerSupply: (state, data) => {
      state.powerSupplies = data.map((powerSupply) => {
        const {
          EfficiencyRatings,
          FirmwareVersion,
          LocationIndicatorActive,
          Id,
          Location,
          Manufacturer,
          Model,
          Name,
          PartNumber,
          SerialNumber,
          SparePartNumber,
          Status = {},
        } = powerSupply;
        return {
          id: Id,
          health: Status.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          efficiencyPercent: EfficiencyRatings[0].EfficiencyPercent,
          firmwareVersion: FirmwareVersion,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location,
          manufacturer: Manufacturer,
          model: Model,
          name: Name,
          sparePartNumber: SparePartNumber,
          statusState: Status.State,
          uri: powerSupply['@odata.id'],
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
    async getAllPowerSupplies({ dispatch }) {
      const collection = await dispatch('getChassisCollection');
      if (!collection) return;
      return await api
        .all(collection.map((chassis) => dispatch('getPowerSupplies', chassis)))
        .catch((error) => console.log(error));
    },
    async getPowerSupplies({ commit }, id) {
      return await api
        .get(`${id}`)
        .then((response) => api.get(response.data.PowerSubsystem['@odata.id']))
        .then((response) => api.get(response.data.PowerSupplies['@odata.id']))
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id'])
        )
        .then((powerSupplyIds) =>
          api.all(powerSupplyIds.map((powerSupply) => api.get(powerSupply)))
        )
        .then((powerSupplies) => {
          const powerSuppliesData = powerSupplies.map(
            (powerSupplies) => powerSupplies.data
          );
          commit('setPowerSupply', powerSuppliesData);
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

export default PowerSupplyStore;
