import api from '@/store/api';

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
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          sparePartNumber: SparePartNumber,
          state: Status?.State,
          uri: adapter['@odata.id'],
        };
      });
    },
  },
  actions: {
    async getFabricAdaptersInfo({ commit }, requestBody) {
      let tempFabricAdapters = [];
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
  },
};

export default FabricAdaptersStore;
