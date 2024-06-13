import api from '@/store/api';
import i18n from '@/i18n';

const FabricAdaptersStore = {
  namespaced: true,
  state: {
    fabricAdapters: [],
  },
  getters: {
    fabricAdapters: (state) => state.fabricAdapters,
  },
  mutations: {
    setFabricAdaptersInfo: (state, data) => {
      state.fabricAdapters = data.map((adapter) => {
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
  },
  actions: {
    async getFabricAdaptersInfo({ commit }, requestBody) {
      let tempFabricAdapters = [];
      commit('setFabricAdaptersInfo', tempFabricAdapters);
      const res = await api.get(requestBody.uri + '/PCIeSlots');
      return await api
        .get(`/redfish/v1/Systems/system/FabricAdapters`)
        .then(({ data }) => {
          data.Members.map((member) => {
            api.get(member['@odata.id']).then((memberResponse) => {
              if (memberResponse.data?.Links?.PCIeDevices.length > 0) {
                res.data.Slots.map((singleSlot) => {
                  if (
                    singleSlot.Links?.PCIeDevice[0]['@odata.id'] ===
                    memberResponse.data?.Links?.PCIeDevices[0]['@odata.id']
                  ) {
                    tempFabricAdapters.push(memberResponse.data);
                    commit('setFabricAdaptersInfo', tempFabricAdapters);
                  }
                });
              } else {
                if (
                  member['@odata.id'].includes('motherboard') &&
                  requestBody.uri.endsWith('chassis')
                ) {
                  tempFabricAdapters.push(memberResponse.data);
                  commit('setFabricAdaptersInfo', tempFabricAdapters);
                }
              }
            });
          });
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
          if (led.identifyLed) {
            return i18n.t('pageInventory.toast.successEnableIdentifyLed');
          } else {
            return i18n.t('pageInventory.toast.successDisableIdentifyLed');
          }
        })
        .catch((error) => {
          dispatch('getFabricAdaptersInfo');
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
  },
};

export default FabricAdaptersStore;
