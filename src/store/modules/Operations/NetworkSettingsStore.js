import api from '@/store/api';
import i18n from '@/i18n';

const NetworkSettingsStore = {
  namespaced: true,
  state: {
    biosAttributes: null,
    requiredAttributes: [
      'pvm_ibmi_network_install_type',
      'pvm_ibmi_ipaddress_protocol',
      'pvm_ibmi_server_ipaddress',
      'pvm_ibmi_nfs_image_directory',
      'pvm_ibmi_local_ipaddress',
      'pvm_ibmi_subnet_mask',
      'pvm_ibmi_gateway_ipaddress',
      'pvm_ibmi_vlan_tag_id',
      'pvm_ibmi_iscsi_target_name',
      'pvm_ibmi_iscsi_initiator_name',
      'pvm_ibmi_iscsi_target_port',
      'pvm_ibmi_max_frame_size',
    ],
    nfsImageDirMaxLength: null,
    initiatorNameMaxLength: null,
    targetNameMaxLength: null,
    targetPortUpperBound: null,
    vlanTagIdUpperBound: null,
  },
  getters: {
    biosAttributes: (state) => state.biosAttributes,
    nfsImageDirMaxLength: (state) => state.nfsImageDirMaxLength,
    initiatorNameMaxLength: (state) => state.initiatorNameMaxLength,
    targetNameMaxLength: (state) => state.targetNameMaxLength,
    targetPortUpperBound: (state) => state.targetPortUpperBound,
    vlanTagIdUpperBound: (state) => state.vlanTagIdUpperBound,
  },
  mutations: {
    setBiosAttributes: (state, biosAttributes) => (state.biosAttributes = biosAttributes),
    setNfsImageDirMaxLength: (state, nfsImageDirMaxLength) =>
      (state.nfsImageDirMaxLength = nfsImageDirMaxLength),
    setInitiatorNameMaxLength: (state, initiatorNameMaxLength) =>
      (state.initiatorNameMaxLength = initiatorNameMaxLength),
    setTargetNameMaxLength: (state, targetNameMaxLength) =>
      (state.targetNameMaxLength = targetNameMaxLength),
    setTargetPortUpperBound: (state, targetPortUpperBound) =>
      (state.targetPortUpperBound = targetPortUpperBound),
    setVlanTagIdUpperBound: (state, vlanTagIdUpperBound) =>
      (state.vlanTagIdUpperBound = vlanTagIdUpperBound),
  },
  actions: {
    async getBiosAttributes({ commit, state }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const filteredAttributes = state.requiredAttributes
            .filter((key) => Object.keys(Attributes).includes(key))
            .reduce((obj, key) => {
              return {
                ...obj,
                [key]: Attributes[key],
              };
            }, {});
          commit('setBiosAttributes', filteredAttributes);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async setDMode() {
      const setDModeObj = {
        Attributes: { pvm_os_boot_type: 'D_Mode' },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', setDModeObj)
        .then(() => {
          return i18n.t('pageServerPowerOperations.modal.networkSettings.toast.successUpdateDMode');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageServerPowerOperations.modal.networkSettings.toast.errorUpdateDMode'),
          );
        });
    },
    async restoreDefault({ dispatch }) {
      const restoreDefaultObj = {
        Attributes: { pvm_ibmi_iscsi_initiator_name: '' },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', restoreDefaultObj)
        .then(() => {
          dispatch('getBiosAttributes');
          return i18n.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successRestoreDefault',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageServerPowerOperations.modal.networkSettings.toast.errorRestoreDefault'),
          );
        });
    },
    async saveBiosSettings(_, { form }) {
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: form,
        })
        .then(() => {
          return i18n.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageServerPowerOperations.modal.networkSettings.toast.errorSavedSettings'),
          );
        });
    },
    async updateChapData(_, { chapData }) {
      return await api
        .patch('/redfish/v1/Systems/system', {
          Oem: {
            IBM: {
              ChapData: {
                ChapName: chapData.chapName,
                ChapSecret: chapData.chapSecret,
              },
            },
          },
        })
        .then(() => {
          return i18n.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
          );
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.t('pageServerPowerOperations.modal.networkSettings.toast.errorSavedSettings'),
          );
        });
    },
    async getPropertyLimits({ commit }) {
      return await api
        .get('/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry')
        .then(({ data: { RegistryEntries } }) => {
          const nfsImageDir = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_nfs_image_directory',
          );
          const nfsImageDirMaxLength = nfsImageDir[0].MaxLength;
          commit('setNfsImageDirMaxLength', nfsImageDirMaxLength);

          const initiatorName = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_iscsi_initiator_name',
          );
          const initiatorNameMaxLength = initiatorName[0].MaxLength;
          commit('setInitiatorNameMaxLength', initiatorNameMaxLength);

          const targetName = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_iscsi_target_name',
          );
          const targetNameMaxLength = targetName[0].MaxLength;
          commit('setTargetNameMaxLength', targetNameMaxLength);

          const targetPort = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_iscsi_target_port',
          );
          const targetPortUpperBound = targetPort[0].UpperBound;
          commit('setTargetPortUpperBound', targetPortUpperBound);

          const vlanTagId = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_vlan_tag_id',
          );
          const vlanTagIdUpperBound = vlanTagId[0].UpperBound;
          commit('setVlanTagIdUpperBound', vlanTagIdUpperBound);
        });
    },
  },
};

export default NetworkSettingsStore;
