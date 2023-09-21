import api from '@/store/api';
import i18n from '@/i18n';
const BootSettingsStore = {
  namespaced: true,
  state: {
    attributeKeys: [
      'pvm_system_operating_mode',
      'pvm_system_power_off_policy',
      'pvm_stop_at_standby',
      'pvm_default_os_type',
      'pvm_rpa_boot_mode',
      'pvm_os_boot_type',
      'pvm_sys_dump_active',
    ],
    disabled: false,
    attributeValues: null,
    automaticRetryConfigValue: '',
    biosAttributes: null,
    bootFault: '',
    powerRestorePolicyValue: '',
  },
  getters: {
    attributeValues: (state) => state.attributeValues,
    automaticRetryConfigValue: (state) => state.automaticRetryConfigValue,
    biosAttributes: (state) => state.biosAttributes,
    bootFaultValue: (state) => state.bootFault,
    powerRestorePolicyValue: (state) => state.powerRestorePolicyValue,
    systemDumpActive: (state) =>
      state.biosAttributes?.pvm_sys_dump_active === 'Enabled',
    disabled: (state) => state.disabled,
  },
  mutations: {
    setDisabled: (state, disabled) => (state.disabled = disabled),
    setAttributeValues: (state, attributeValues) =>
      (state.attributeValues = attributeValues),
    setBiosAttributes: (state, biosAttributes) =>
      (state.biosAttributes = biosAttributes),
    setStopBootOnFaultValue: (state, bootFault) =>
      (state.bootFault = bootFault),
    setPowerRestorePolicyValue: (state, powerRestorePolicyValue) =>
      (state.powerRestorePolicyValue = powerRestorePolicyValue),
    setAutomaticRetryConfigValue: (state, automaticRetryConfigValue) =>
      (state.automaticRetryConfigValue = automaticRetryConfigValue),
  },
  actions: {
    async getOperatingModeSettings({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system')
        .then(({ data: { PowerRestorePolicy, Boot } }) => {
          commit('setPowerRestorePolicyValue', PowerRestorePolicy);
          commit('setAutomaticRetryConfigValue', Boot.AutomaticRetryConfig);
          commit('setStopBootOnFaultValue', Boot.StopBootOnFault);
        })
        .catch((error) => console.log(error));
    },
    async saveSettings({ dispatch, commit }, { biosSettings }) {
      const promises = [];
      commit('setDisabled', true);
      if (biosSettings) {
        promises.push(dispatch('saveBiosSettings', biosSettings));
      }
      return await api.all(promises).then(
        api.spread((...responses) => {
          let message = i18n.t(
            'pageServerPowerOperations.toast.successSaveSettings'
          );
          responses.forEach((response) => {
            if (response instanceof Error) {
              throw new Error(
                i18n.t('pageServerPowerOperations.toast.errorSaveSettings')
              );
            }
          });
          return message;
        })
      );
    },
    async getBiosAttributes({ commit, state }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const filteredAttributes = state.attributeKeys
            .filter((key) => Object.keys(Attributes).includes(key))
            .reduce((obj, key) => {
              return {
                ...obj,
                [key]: Attributes[key],
              };
            }, {});
          commit('setBiosAttributes', filteredAttributes);
          commit('setDisabled', false);
        })
        .catch((error) => {
          console.log(error);
          commit('setDisabled', false);
        });
    },
    async getAttributeValues({ commit, state }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(
          ({
            data: {
              RegistryEntries: { Attributes },
            },
          }) => {
            // Array for state BIOS attributes is created
            const filteredAttributeValues = state.attributeKeys
              .reduce((arr, attriValue) => {
                return [
                  ...arr,
                  ...Attributes.filter((value) => {
                    return (
                      attriValue !== 'pvm_sys_dump_active' &&
                      attriValue === value.AttributeName
                    );
                  }),
                ];
              }, [])
              // Array of objects with the key as value and text is created
              .reduce((obj, attributeObj) => {
                return {
                  ...obj,
                  [attributeObj?.AttributeName]: attributeObj.Value.map(
                    (item) => {
                      return {
                        value: item.ValueName,
                        text:
                          [
                            'pvm_default_os_type',
                            'pvm_os_boot_type',
                            'pvm_rpa_boot_mode',
                            'pvm_stop_at_standby',
                            'pvm_system_operating_mode',
                          ].indexOf(attributeObj.AttributeName) >= 0
                            ? i18n.t(
                                `pageServerPowerOperations.biosSettings.attributeValues.${attributeObj.AttributeName}.${item.ValueName}`
                              )
                            : item.ValueName,
                      };
                    }
                  ),
                };
              }, {});
            commit('setAttributeValues', filteredAttributeValues);
          }
        )
        .catch((error) => console.log(error));
    },
    saveBiosSettings({ dispatch, commit }, biosSettings) {
      return api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: biosSettings,
        })
        .then((response) => {
          dispatch('saveOperatingModeSettings');
          return response;
        })
        .catch((error) => {
          console.log(error);
          commit('setDisabled', false);
          return error;
        });
    },
    async standbyToRuntime() {
      return await api
        .post('redfish/v1/Systems/hypervisor/Actions/ComputerSystem.Reset', {
          ResetType: 'On',
        })
        .then(() => {
          return i18n.tc('pageServerPowerOperations.toast.successSaveSettings');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.tc('pageServerPowerOperations.toast.errorSaveSettings')
          );
        });
    },
    saveOperatingModeSettings({ dispatch, commit }) {
      return api
        .patch('/redfish/v1/Systems/system', {
          PowerRestorePolicy: this.state.serverBootSettings
            .powerRestorePolicyValue,
          Boot: {
            AutomaticRetryConfig: this.state.serverBootSettings
              .automaticRetryConfigValue,
            StopBootOnFault: this.state.serverBootSettings.bootFault,
          },
        })
        .then((response) => {
          dispatch('getBiosAttributes');
          return response;
        })
        .catch((error) => {
          console.log(error);
          commit('setDisabled', false);
          return error;
        });
    },
  },
};
export default BootSettingsStore;
