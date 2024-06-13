import api from '@/store/api';
import i18n from '@/i18n';

const FieldCoreOverrideStore = {
  namespaced: true,
  state: {
    fieldCoreOverridePending: 0,
    fieldCoreOverrideCurrent: 0,
  },
  getters: {
    isPending: (state) =>
      state.fieldCoreOverrideCurrent !== state.fieldCoreOverridePending,
    configuredCores: (state, getters) =>
      getters.isPending
        ? state.fieldCoreOverridePending
        : state.fieldCoreOverrideCurrent,
    isEnabled: (state, getters) =>
      getters.isPending
        ? state.fieldCoreOverridePending > 0
        : state.fieldCoreOverrideCurrent > 0,
  },
  mutations: {
    setBiosAttributes: (state, data) => {
      state.fieldCoreOverridePending = data?.hb_field_core_override;
      state.fieldCoreOverrideCurrent = data?.hb_field_core_override_current;
    },
  },
  actions: {
    async getBiosAttributes({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data }) => {
          commit('setBiosAttributes', data?.Attributes || {});
        });
    },
    async setFieldCoreOverride({ dispatch }, coreOverride) {
      const data = {
        Attributes: {
          hb_field_core_override: +coreOverride,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', data)
        .then(() => {
          dispatch('getBiosAttributes');
          return i18n.t(
            'pageFieldCoreOverride.toast.configurationChangeSuccess',
          );
        })
        .catch((error) => {
          console.log('Field core override', error);
          throw new Error(
            i18n.t('pageFieldCoreOverride.toast.configurationChangeError'),
          );
        });
    },
  },
};

export default FieldCoreOverrideStore;
