import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const PowerPolicyStore = defineStore('powerPolicy', {
  namespaced: true,
  state: () => ({
    powerRestoreCurrentPolicy: null,
    powerRestorePolicies: [],
  }),
  getters: {
    getPowerRestoreCurrentPolicies: (state) => state.powerRestoreCurrentPolicy,
    getPowerRestorePolicy: (state) => state.powerRestorePolicies,
  },
  actions: {
    async getPowerRestorePolicies() {
      return await api
        .get('/redfish/v1/JsonSchemas/ComputerSystem/ComputerSystem.json')
        .then(
          ({
            data: {
              definitions: { PowerRestorePolicyTypes = {} },
            },
          }) => {
            let powerPoliciesData = PowerRestorePolicyTypes.enum.map(
              (powerState) => {
                let desc = `${i18n.global.t(
                  `pagePowerRestorePolicy.policies.${powerState}`,
                )} - ${PowerRestorePolicyTypes.enumDescriptions[powerState]}`;
                return {
                  state: powerState,
                  desc,
                };
              },
            );
            this.powerRestorePolicies = powerPoliciesData;
          },
        );
    },
    async getPowerRestoreCurrentPolicy() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then(({ data: { PowerRestorePolicy } }) => {
          this.powerRestoreCurrentPolicy = PowerRestorePolicy;
        })
        .catch((error) => console.log(error));
    },
    async setPowerRestorePolicy(powerPolicy) {
      const data = { PowerRestorePolicy: powerPolicy };
      return await api
        .patch('/redfish/v1/Systems/system', data)
        .then(() => {
          this.getPowerRestoreCurrentPolicy();
          return i18n.global.t(
            'pagePowerRestorePolicy.toast.successSaveSettings',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pagePowerRestorePolicy.toast.errorSaveSettings'),
          );
        });
    },
  },
});

export default PowerPolicyStore;
