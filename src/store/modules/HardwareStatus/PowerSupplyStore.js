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
          FirmwareVersion,
          Location,
          LocationIndicatorActive,
          Id,
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
          firmwareVersion: FirmwareVersion,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          sparePartNumber: SparePartNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: powerSupply['@odata.id'],
        };
      });
    },
  },
  actions: {
    async getAllPowerSupplies({ commit }, requestBody) {
      commit('setPowerSupply', []);
      return await api
        .get(`${requestBody.uri}`)
        .then((response) => api.get(response.data.PowerSubsystem['@odata.id']))
        .then((response) => api.get(response.data.PowerSupplies['@odata.id']))
        .then(({ data: { Members } }) => Members.map((member) => member['@odata.id']))
        .then((powerSupplyIds) =>
          api.all(powerSupplyIds.map((powerSupply) => api.get(powerSupply))),
        )
        .then((powerSupplies) => {
          const powerSuppliesData = powerSupplies.map((powerSupplies) => powerSupplies.data);
          commit('setPowerSupply', powerSuppliesData);
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
            throw new Error(i18n.t('pageInventory.toast.errorEnableIdentifyLed'));
          } else {
            throw new Error(i18n.t('pageInventory.toast.errorDisableIdentifyLed'));
          }
        });
    },
  },
};

export default PowerSupplyStore;
