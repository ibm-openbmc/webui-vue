import api from '@/store/api';
import i18n from '@/i18n';

const IBMiServiceFunctionsStore = {
  namespaced: true,
  state: {
    serviceFunctions: [],
  },
  getters: {
    serviceFunctions: (state) => state.serviceFunctions,
  },
  mutations: {
    setServiceFunctions: (state, serviceFunctions) =>
      (state.serviceFunctions = serviceFunctions),
  },
  actions: {
    async getAvailableServiceFunctions({ commit }) {
      return await api.get('/redfish/v1/Systems/system').then(({ data }) => {
        let availableFunctions = data?.Oem?.IBM?.EnabledPanelFunctions;
        commit('setServiceFunctions', availableFunctions);
      });
    },
    async executeServiceFunction({ dispatch }, value) {
      return await api
        .post(
          '/redfish/v1/Systems/system/Actions/Oem/OemComputerSystem.ExecutePanelFunction',
          { FuncNo: value }
        )
        .then(() => {
          dispatch('getAvailableServiceFunctions');
          i18n.tc('pageIbmiServiceFunctions.toast.successExecuteFunction');
        })
        .catch((error) => {
          console.log(error);
          dispatch('getAvailableServiceFunctions');
          throw new Error(
            i18n.tc('pageIbmiServiceFunctions.toast.errorExecuteFunction')
          );
        });
    },
  },
};

export default IBMiServiceFunctionsStore;
