import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

const FieldCoreOverrideStore = defineStore('fieldCoreOverride', {
  state: () => ({
    fieldCoreOverridePending: 0,
    fieldCoreOverrideCurrent: 0,
  }),
  getters: {
    isPendingGetter(state) {
      return state.fieldCoreOverrideCurrent !== state.fieldCoreOverridePending;
    },
    configuredCoresGetter(state) {
      return this.isPendingGetter
        ? state.fieldCoreOverridePending
        : state.fieldCoreOverrideCurrent;
    },
    isEnabledGetter(state) {
      return this.isPendingGetter
        ? state.fieldCoreOverridePending > 0
        : state.fieldCoreOverrideCurrent > 0;
    },
  },
  actions: {
    setBiosAttributes(data) {
      this.fieldCoreOverridePending = data?.hb_field_core_override;
      this.fieldCoreOverrideCurrent = data?.hb_field_core_override_current;
    },
    async getBiosAttributes() {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data }) => {
          this.setBiosAttributes(data?.Attributes || {});
        });
    },
    async setFieldCoreOverride(coreOverride) {
      const data = {
        Attributes: {
          hb_field_core_override: +coreOverride,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', data)
        .then(() => {
          this.getBiosAttributes();
          return i18n.global.t(
            'pageFieldCoreOverride.toast.configurationChangeSuccess'
          );
        })
        .catch((error) => {
          console.log('Field core override', error);
          throw new Error(
            i18n.global.t(
              'pageFieldCoreOverride.toast.configurationChangeError'
            )
          );
        });
    },
  },
});

export default FieldCoreOverrideStore;
