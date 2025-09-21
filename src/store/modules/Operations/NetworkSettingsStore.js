import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const NetworkSettingsStore = defineStore('networkSettings', {
  state: () => ({
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
  }),
  getters: {
    biosAttributesGetter: (state) => state.biosAttributes,
    nfsImageDirMaxLengthGetter: (state) => state.nfsImageDirMaxLength,
    initiatorNameMaxLengthGetter: (state) => state.initiatorNameMaxLength,
    targetNameMaxLengthGetter: (state) => state.targetNameMaxLength,
    targetPortUpperBoundGetter: (state) => state.targetPortUpperBound,
    vlanTagIdUpperBoundGetter: (state) => state.vlanTagIdUpperBound,
  },
  actions: {
    async getBiosAttributes() {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const filteredAttributes = this.requiredAttributes
            .filter((key) => Object.keys(Attributes).includes(key))
            .reduce((obj, key) => {
              return {
                ...obj,
                [key]: Attributes[key],
              };
            }, {});
          this.biosAttributes = filteredAttributes;
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
          return i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successUpdateDMode',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t(
              'pageServerPowerOperations.modal.networkSettings.toast.errorUpdateDMode',
            ),
          );
        });
    },
    async restoreDefault() {
      const restoreDefaultObj = {
        Attributes: { pvm_ibmi_iscsi_initiator_name: '' },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', restoreDefaultObj)
        .then(() => {
          this.getBiosAttributes();
          return i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successRestoreDefault',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t(
              'pageServerPowerOperations.modal.networkSettings.toast.errorRestoreDefault',
            ),
          );
        });
    },
    async saveBiosSettings({ form }) {
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: form,
        })
        .then(() => {
          return i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t(
              'pageServerPowerOperations.modal.networkSettings.toast.errorSavedSettings',
            ),
          );
        });
    },
    async updateChapData({ chapData }) {
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
          return i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.toast.successSavedSetting',
          );
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.global.t(
              'pageServerPowerOperations.modal.networkSettings.toast.errorSavedSettings',
            ),
          );
        });
    },
    async getPropertyLimits() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const nfsImageDir = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'pvm_ibmi_nfs_image_directory',
          );
          const nfsImageDirMaxLength = nfsImageDir[0].MaxLength;
          this.nfsImageDirMaxLength = nfsImageDirMaxLength;

          const initiatorName = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'pvm_ibmi_iscsi_initiator_name',
          );
          const initiatorNameMaxLength = initiatorName[0].MaxLength;
          this.initiatorNameMaxLength = initiatorNameMaxLength;

          const targetName = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'pvm_ibmi_iscsi_target_name',
          );
          const targetNameMaxLength = targetName[0].MaxLength;
          this.targetNameMaxLength = targetNameMaxLength;

          const targetPort = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'pvm_ibmi_iscsi_target_port',
          );
          const targetPortUpperBound = targetPort[0].UpperBound;
          this.targetPortUpperBound = targetPortUpperBound;

          const vlanTagId = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_ibmi_vlan_tag_id',
          );
          const vlanTagIdUpperBound = vlanTagId[0].UpperBound;
          this.vlanTagIdUpperBound = vlanTagIdUpperBound;
        });
    },
  },
});

export default NetworkSettingsStore;
