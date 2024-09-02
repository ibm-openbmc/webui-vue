import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const IBMiServiceFunctionsStore = defineStore('ibmiServiceFunctions', {
  state: () => {
    return {
      serviceFunctions: [],
    };
  },
  getters: {
    serviceFunctionsGetter: (state) => state.serviceFunctions,
  },
  actions: {
    async getAvailableServiceFunctions() {
      return await api.get('/redfish/v1/Systems/system').then(({ data }) => {
        let availableFunctions = data?.Oem?.IBM?.EnabledPanelFunctions;
        this.serviceFunctions = availableFunctions;
      });
    },
    async executeServiceFunction(value) {
      return await api
        .post(
          '/redfish/v1/Systems/system/Actions/Oem/OemComputerSystem.ExecutePanelFunction',
          {
            FuncNo: value,
          },
        )
        .then(() => {
          this.getAvailableServiceFunctions();
          return i18n.global.t(
            'pageIbmiServiceFunctions.toast.successExecuteFunction',
          );
        })
        .catch((error) => {
          console.log(error);
          this.getAvailableServiceFunctions();
          throw new Error(
            i18n.global.t(
              'pageIbmiServiceFunctions.toast.errorExecuteFunction',
            ),
          );
        });
    },
  },
});

export default IBMiServiceFunctionsStore;
