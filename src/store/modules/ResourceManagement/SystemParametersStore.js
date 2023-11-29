import api from '@/store/api';
import i18n from '@/i18n';

const systemParametersStore = {
  namespaced: true,
  state: {
    rpdPolicyOptions: [],
    rpdFeatureOptions: [],
    aggressivePrefetch: false,
    frequencyCap: null,
    frequencyRequestCurrentToggle: false,
    lateralCastOutMode: null,
    immediateTestRequested: false,
    guardOnError: false,
    rpdPolicy: null,
    pvmRpdPolicy: null,
    rpdPolicyCurrent: null,
    rpdFeature: null,
    rpdScheduledRun: null,
    rpdScheduledRunDuration: null,
  },
  getters: {
    aggressivePrefetch: (state) => state.aggressivePrefetch,
    frequencyMax: (state) => state.frequencyCap?.frequencyMax,
    frequencyMin: (state) => state.frequencyCap?.frequencyMin,
    frequencyRequest: (state) => state.frequencyCap?.frequencyRequest,
    frequencyRequestCurrent: (state) =>
      state.frequencyCap?.frequencyRequestCurrent,
    frequencyRequestCurrentToggle: (state) =>
      state.frequencyRequestCurrentToggle,
    lateralCastOutMode: (state) => state.lateralCastOutMode,
    immediateTestRequested: (state) => state.immediateTestRequested,
    guardOnError: (state) => state.guardOnError,
    rpdPolicy: (state) => state.rpdPolicy,
    pvmRpdPolicy: (state) => state.pvmRpdPolicy,
    rpdPolicyCurrent: (state) => state.rpdPolicyCurrent,
    rpdFeature: (state) => state.rpdFeature,
    rpdPolicyOptions: (state) => state.rpdPolicyOptions,
    rpdFeatureOptions: (state) => state.rpdFeatureOptions,
    rpdScheduledRun: (state) => state.rpdScheduledRun,
    rpdScheduledRunDuration: (state) => state.rpdScheduledRunDuration,
  },
  mutations: {
    setFrequencyRequestCurrentToggle: (state, frequencyRequestCurrentToggle) =>
      (state.frequencyRequestCurrentToggle = frequencyRequestCurrentToggle),
    setAggressivePrefetch: (state, aggressivePrefetch) =>
      (state.aggressivePrefetch = aggressivePrefetch),
    setFrequencyCap: (state, frequencyCap) =>
      (state.frequencyCap = frequencyCap),
    setLateralCastOutMode: (state, lateralCastOutMode) =>
      (state.lateralCastOutMode = lateralCastOutMode),
    setImmediateTestRequested: (state, immediateTestRequested) =>
      (state.immediateTestRequested = immediateTestRequested),
    setGuardOnError: (state, guardOnError) =>
      (state.guardOnError = guardOnError),
    setRpdPolicy: (state, rpdPolicy) => (state.rpdPolicy = rpdPolicy),
    setPvmRpdPolicy: (state, pvmRpdPolicy) =>
      (state.pvmRpdPolicy = pvmRpdPolicy),
    setRpdPolicyCurrent: (state, rpdPolicyCurrent) =>
      (state.rpdPolicyCurrent = rpdPolicyCurrent),
    setRpdFeature: (state, rpdFeature) => (state.rpdFeature = rpdFeature),
    setRpdPolicyOptions: (state, rpdPolicyOptions) =>
      (state.rpdPolicyOptions = rpdPolicyOptions),
    setRpdFeatureOptions: (state, rpdFeatureOptions) =>
      (state.rpdFeatureOptions = rpdFeatureOptions),
    setRpdScheduledRun: (state, rpdScheduledRun) =>
      (state.rpdScheduledRun = rpdScheduledRun),
    setRpdScheduledRunDuration: (state, rpdScheduledRunDuration) =>
      (state.rpdScheduledRunDuration = rpdScheduledRunDuration),
  },
  actions: {
    async getAggressivePrefetch({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const aggressivePrefetch = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'hb_proc_favor_aggressive_prefetch'
          );
          let aggressivePrefetchValue = aggressivePrefetch[0].CurrentValue;
          let modeValue = aggressivePrefetchValue == 'Enabled' ? true : false;
          commit('setAggressivePrefetch', modeValue);
        })
        .catch((error) => console.log(error));
    },
    async getRpdPolicy({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdPolicy = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_policy'
          );
          let rpdPolicyValue = rpdPolicy[0].CurrentValue;
          commit('setRpdPolicy', rpdPolicyValue);
          commit('setPvmRpdPolicy', rpdPolicyValue);
        })
        .catch((error) => console.log(error));
    },
    async getRpdPolicyCurrent({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdPolicyCurr = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_feature_current'
          );
          let rpdPolicyCurrValue = rpdPolicyCurr[0].CurrentValue;
          commit('setRpdPolicyCurrent', rpdPolicyCurrValue);
        })
        .catch((error) => console.log(error));
    },
    async getRpdFeature({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdFeature = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_feature'
          );
          let rpdFeatureValue = rpdFeature[0].CurrentValue;
          commit('setRpdFeature', rpdFeatureValue);
        })
        .catch((error) => console.log(error));
    },
    async getImmediateTestRequested({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const immediateTestRequested = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_immediate_test'
          );
          let immediateTestRequestedValue =
            immediateTestRequested[0].CurrentValue;
          let modeValue =
            immediateTestRequestedValue == 'Enabled' ? true : false;
          commit('setImmediateTestRequested', modeValue);
        })
        .catch((error) => console.log(error));
    },
    async getGuardOnError({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const immediateTestRequested = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_guard_policy'
          );
          let immediateTestRequestedValue =
            immediateTestRequested[0].CurrentValue;
          let modeValue =
            immediateTestRequestedValue == 'Enabled' ? true : false;
          commit('setGuardOnError', modeValue);
        })
        .catch((error) => console.log(error));
    },
    async getRpdPolicyOptions({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdPolicy = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_policy'
          );
          let rpdPolicyOptions = rpdPolicy[0].Value.map(
            ({ ValueName }) => ValueName
          );
          commit('setRpdPolicyOptions', rpdPolicyOptions);
        })
        .catch((error) => console.log(error));
    },
    async getRpdFeatureOptions({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdPolicy = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_feature'
          );
          let rpdFeatureOptions = rpdPolicy[0].Value.map(
            ({ ValueName }) => ValueName
          );
          commit('setRpdFeatureOptions', rpdFeatureOptions);
        })
        .catch((error) => console.log(error));
    },
    async getRpdScheduledRun({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdScheduledRun = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_rpd_scheduled_tod'
          );
          let RpdScheduledRunValue = rpdScheduledRun[0].CurrentValue;
          const hours = Math.floor(RpdScheduledRunValue / 3600);
          const minutes = Math.floor((RpdScheduledRunValue % 3600) / 60);
          const hourString = hours.toString().padStart(2, '0');
          const minuteString = minutes.toString().padStart(2, '0');
          commit('setRpdScheduledRun', `${hourString}:${minuteString}`);
        })
        .catch((error) => console.log(error));
    },
    async getRpdScheduledRunDuration({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const rpdScheduledRunDuration = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'pvm_rpd_scheduled_duration'
          );
          let rpdScheduledRunValue = rpdScheduledRunDuration[0].CurrentValue;
          commit('setRpdScheduledRunDuration', rpdScheduledRunValue);
        })
        .catch((error) => console.log(error));
    },
    async saveAggressivePrefetch({ commit }, updatedAggressivePrefetch) {
      let updatedModeValue = updatedAggressivePrefetch ? 'Enabled' : 'Disabled';
      commit('setAggressivePrefetch', updatedAggressivePrefetch);
      const updatedAggressivePrefetchValue = {
        Attributes: { hb_proc_favor_aggressive_prefetch: updatedModeValue },
      };
      return api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedAggressivePrefetchValue
        )
        .then(() => {
          return i18n.t(
            'pageSystemParameters.toast.successSavingAggressivePrefetch'
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setAggressivePrefetch', !updatedAggressivePrefetch);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingAggressivePrefetch')
          );
        });
    },
    async saveRpdPolicy({ commit, dispatch }, rpdPolicyValue) {
      const updatedRpdPolicyValue = {
        Attributes: { pvm_rpd_policy: rpdPolicyValue },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedRpdPolicyValue
        )
        .then(() => {
          commit(
            'setRpdPolicy',
            updatedRpdPolicyValue.Attributes.pvm_rpd_policy
          );
          dispatch('getRpdPolicy');
          return i18n.t('pageSystemParameters.toast.successSavingRpdPolicy');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingRpdPolicy')
          );
        });
    },
    async saveRpdFeature({ commit }, rpdFeatureValue) {
      const updatedRpdFeatureValue = {
        Attributes: { pvm_rpd_feature: rpdFeatureValue },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedRpdFeatureValue
        )
        .then(() => {
          commit(
            'setRpdFeature',
            updatedRpdFeatureValue.Attributes.pvm_rpd_feature
          );
          return i18n.t('pageSystemParameters.toast.successSavingRpdFeature');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingRpdFeature')
          );
        });
    },
    async saveImmediateTestRequested({ commit }, { value }) {
      if (value === 'Enabled') {
        commit('setImmediateTestRequested', true);
      } else {
        commit('setImmediateTestRequested', false);
      }
      const updatedImmediateTestRequestedValue = {
        Attributes: { pvm_rpd_immediate_test: value },
      };
      return api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedImmediateTestRequestedValue
        )
        .then(() => {
          if (value === 'Enabled') {
            return i18n.t(
              'pageSystemParameters.toast.successStartingDiagnosticTestRun'
            );
          } else {
            return i18n.t(
              'pageSystemParameters.toast.successStoppingDiagnosticTestRun'
            );
          }
        })
        .catch((error) => {
          console.log(error);
          if (value === 'Enabled') {
            commit('setImmediateTestRequested', false);
            throw new Error(
              i18n.t(
                'pageSystemParameters.toast.errorStartingDiagnosticTestRun'
              )
            );
          } else {
            commit('setImmediateTestRequested', true);
            throw new Error(
              i18n.t(
                'pageSystemParameters.toast.errorStoppingDiagnosticTestRun'
              )
            );
          }
        });
    },
    async saveGuardOnError({ commit }, updatedImmediateTestRequested) {
      let updatedValue = updatedImmediateTestRequested ? 'Enabled' : 'Disabled';
      commit('setGuardOnError', updatedImmediateTestRequested);
      const updatedImmediateTestRequestedValue = {
        Attributes: { pvm_rpd_guard_policy: updatedValue },
      };
      return api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedImmediateTestRequestedValue
        )
        .then(() => {
          return i18n.t('pageSystemParameters.toast.successSavingGuardOnError');
        })
        .catch((error) => {
          console.log(error);
          commit('setGuardOnError', !updatedImmediateTestRequested);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingGuardOnError')
          );
        });
    },
    async saveRpdScheduledRun({ commit }, payload) {
      const updatedIoEnlargedCapacity = {
        Attributes: {
          pvm_rpd_scheduled_tod: payload.totalSeconds,
          pvm_rpd_scheduled_duration: payload.duration,
        },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedIoEnlargedCapacity
        )
        .then(() => {
          commit('setRpdScheduledRun', payload.startTime);
          return i18n.t('pageSystemParameters.toast.successSavingRpdRun');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingRpdRun')
          );
        });
    },
    async getLateralCastOutMode({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const lateralCastOutMode = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_lateral_cast_out_mode'
          );
          let lateralCastOutModeValue = lateralCastOutMode[0].CurrentValue;
          let modeValue = lateralCastOutModeValue == 'Enabled' ? true : false;
          commit('setLateralCastOutMode', modeValue);
        })
        .catch((error) => console.log(error));
    },
    async saveLateralCastOutMode({ commit }, lateralCastOutModeValue) {
      let updatedModeValue = lateralCastOutModeValue ? 'Enabled' : 'Disabled';
      commit('setLateralCastOutMode', lateralCastOutModeValue);
      const updatedLateralCastOutMode = {
        Attributes: { hb_lateral_cast_out_mode: updatedModeValue },
      };
      return api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedLateralCastOutMode
        )
        .then(() => {
          return i18n.t(
            'pageSystemParameters.toast.successSavingLateralCastOut'
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setLateralCastOutMode', !lateralCastOutModeValue);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingLateralCastOut')
          );
        });
    },
    async getFrequencyCap({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const frequencyCapData = {
            frequencyMax: Attributes.hb_cap_freq_mhz_max,
            frequencyMin: Attributes.hb_cap_freq_mhz_min,
            frequencyRequest: Attributes.hb_cap_freq_mhz_request,
            frequencyRequestCurrent: Attributes.hb_cap_freq_mhz_request_current,
          };

          commit('setFrequencyCap', frequencyCapData);

          if (frequencyCapData.frequencyRequest == 0) {
            commit('setFrequencyRequestCurrentToggle', false);
          } else {
            commit('setFrequencyRequestCurrentToggle', true);
          }
        })
        .catch((error) => console.log(error));
    },
    async saveFrequencyCap({ commit, dispatch }, { frequency, state }) {
      if (state) {
        commit('setFrequencyRequestCurrentToggle', true);
      } else {
        commit('setFrequencyRequestCurrentToggle', false);
      }
      return dispatch('newFrequencyCapRequest', frequency);
    },

    async newFrequencyCapRequest({ commit, dispatch }, frequency) {
      const newFrequencyRequest = {
        Attributes: { hb_cap_freq_mhz_request: frequency },
      };
      return api
        .patch('/redfish/v1/Systems/system/Bios/Settings', newFrequencyRequest)
        .then(() => {
          dispatch('getFrequencyCap');
          return i18n.t('pageSystemParameters.toast.successSavingFrequencyCap');
        })
        .catch((error) => {
          if (frequency == 0) {
            commit('setFrequencyRequestCurrentToggle', false);
          } else {
            commit('setFrequencyRequestCurrentToggle', true);
          }
          console.log(error);
          throw new Error(
            i18n.t('pageSystemParameters.toast.errorSavingFrequencyCap')
          );
        });
    },
  },
};

export default systemParametersStore;
