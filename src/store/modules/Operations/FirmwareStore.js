import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const FirmwareStore = defineStore('firmware', {
  state: () => ({
    bmcFirmware: [],
    hostFirmware: [],
    bmcActiveFirmwareId: null,
    hostActiveFirmwareId: null,
    applyTime: null,
    firmwareBootSide: null,
    lowestSupportedFirmwareVersion: '',
    showAlert: false,
  }),
  getters: {
    isSingleFileUploadEnabled: (state) => state.hostFirmware.length === 0,
    activeBmcFirmware: (state) => {
      return state.bmcFirmware.find(
        (firmware) => firmware.id === state.bmcActiveFirmwareId,
      );
    },
    activeHostFirmware: (state) => {
      return state.hostFirmware.find(
        (firmware) => firmware.id === state.hostActiveFirmwareId,
      );
    },
    backupBmcFirmware: (state) => {
      return state.bmcFirmware.find(
        (firmware) => firmware.id !== state.bmcActiveFirmwareId,
      );
    },
    backupHostFirmware: (state) => {
      return state.hostFirmware.find(
        (firmware) => firmware.id !== state.hostActiveFirmwareId,
      );
    },
    firmwareBootSideGetter: (state) => state.firmwareBootSide,
    lowestSupportedFirmwareVersionGetter: (state) =>
      state.lowestSupportedFirmwareVersion,
    showAlertGetter: (state) => state.showAlert,
  },
  actions: {
    async getLowestSupportedFirmwareVersion() {
      await api.get('/redfish/v1/Managers/bmc').then((response) =>
        api
          .get(response.data.Links.ActiveSoftwareImage['@odata.id'])
          .then((response) => {
            let lowestSupportedFirmware;
            if (Object.keys(response.data).includes('LowestSupportedVersion')) {
              this.showAlert = true;
              lowestSupportedFirmware = response.data.LowestSupportedVersion;
            } else {
              this.showAlert = false;
            }
            this.lowestSupportedFirmwareVersion = lowestSupportedFirmware;
          }),
      );
      return this.lowestSupportedFirmwareVersion;
    },
    async getFirmwareInformation() {
      this.getActiveHostFirmware();
      this.getActiveBmcFirmware();
      return await this.getFirmwareInventory();
    },
    getActiveBmcFirmware() {
      return api
        .get('/redfish/v1/Managers/bmc')
        .then(({ data: { Links } }) => {
          const id = Links?.ActiveSoftwareImage['@odata.id'].split('/').pop();
          this.bmcActiveFirmwareId = id;
        })
        .catch((error) => console.log(error));
    },
    getActiveHostFirmware() {
      return api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Links } }) => {
          const id = Links?.ActiveSoftwareImage['@odata.id'].split('/').pop();
          this.hostActiveFirmwareId = id;
        })
        .catch((error) => console.log(error));
    },
    getFirmwareBootSide() {
      return api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data }) => {
          const fwBootSide = data.Attributes.fw_boot_side_current;
          this.firmwareBootSide = fwBootSide;
        })
        .catch((error) => console.log(error));
    },
    async getFirmwareInventory() {
      const inventoryList = await api
        .get('/redfish/v1/UpdateService/FirmwareInventory')
        .then(({ data: { Members = [] } = {} }) =>
          Members.map((item) => api.get(item['@odata.id'])),
        )
        .catch((error) => console.log(error));
      await api
        .all(inventoryList)
        .then((response) => {
          const bmcFirmware = [];
          const hostFirmware = [];
          response.forEach(({ data }) => {
            const firmwareType = data?.RelatedItem?.[0]?.['@odata.id']
              .split('/')
              .pop();
            const item = {
              version: data?.Version,
              id: data?.Id,
              location: data?.['@odata.id'],
              status: data?.Status?.Health,
            };
            if (firmwareType === 'bmc') {
              bmcFirmware.push(item);
            } else if (firmwareType === 'Bios') {
              hostFirmware.push(item);
            }
          });
          this.bmcFirmware = bmcFirmware;
          this.hostFirmware = hostFirmware;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    getUpdateServiceSettings() {
      api
        .get('/redfish/v1/UpdateService')
        .then(({ data }) => {
          const applyTime =
            data.HttpPushUriOptions.HttpPushUriApplyTime.ApplyTime;
          this.applyTime = applyTime;
        })
        .catch((error) => console.log(error));
    },
    setApplyTimeImmediate() {
      const data = {
        HttpPushUriOptions: {
          HttpPushUriApplyTime: {
            ApplyTime: 'Immediate',
          },
        },
      };
      return api
        .patch('/redfish/v1/UpdateService', data)
        .then(() => (this.applyTime = 'Immediate'))
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageFirmware.toast.errorUploadFirmware'),
          );
        });
    },
    async uploadFirmware(image) {
      if (this.applyTime !== 'Immediate') {
        // ApplyTime must be set to Immediate before making
        // request to update firmware
        await this.setApplyTimeImmediate();
      }
      return await api
        .post('/redfish/v1/UpdateService', image, {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageFirmware.toast.errorUpdateFirmware'),
          );
        });
    },
    async switchBmcFirmwareAndReboot() {
      const backupLocation = this.backupBmcFirmware.location;
      const data = {
        Links: {
          ActiveSoftwareImage: {
            '@odata.id': backupLocation,
          },
        },
      };
      return await api
        .patch('/redfish/v1/Managers/bmc', data)
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageFirmware.toast.errorSwitchImages'),
          );
        });
    },
  },
});

export default FirmwareStore;
