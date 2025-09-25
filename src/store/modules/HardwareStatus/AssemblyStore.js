import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const AssemblyStore = defineStore('assemblyStore', {
  state: () => ({
    assemblies: null,
  }),
  getters: {
    assembliesGetter: (state) => state.assemblies,
  },
  mutations: {
    setAssemblyInfo: (state, data) => {
      state.assemblies = data.map((assembly) => {
        const {
          MemberId,
          PartNumber,
          SerialNumber,
          SparePartNumber,
          Model,
          Name,
          Location,
          Status,
          LocationIndicatorActive,
        } = assembly;
        return {
          id: MemberId,
          health: Status?.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          sparePartNumber: SparePartNumber,
          model: Model,
          name: Name,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          identifyLed: LocationIndicatorActive,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: assembly['@odata.id'],
        };
      });
    },
  },
  actions: {
    setAssemblyInfo(data) {
      this.assemblies = data.map((assembly) => {
        const {
          MemberId,
          PartNumber,
          SerialNumber,
          SparePartNumber,
          Model,
          Name,
          Location,
          Status,
          LocationIndicatorActive,
        } = assembly;
        return {
          id: MemberId,
          health: Status?.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          sparePartNumber: SparePartNumber,
          model: Model,
          name: Name,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          identifyLed: LocationIndicatorActive,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: assembly['@odata.id'],
        };
      });
    },
    async getAssemblyInfo(requestBody) {
      this.setAssemblyInfo([]);
      return await api
        .get(`${requestBody.uri}/Assembly`)
        .then(({ data }) => this.setAssemblyInfo(data.Assemblies))
        .catch((error) => console.log(error));
    },
    async updateIdentifyLedValue(led) {
      const uri = led.uri;
      const updatedIdentifyLedValue = {
        Assemblies: [
          {
            MemberId: led.memberId,
            LocationIndicatorActive: led.identifyLed,
          },
        ],
      };

      return await api
        .patch(uri, updatedIdentifyLedValue)
        .then(() => {
          if (led.identifyLed) {
            return i18n.global.t(
              'pageInventory.toast.successEnableIdentifyLed',
            );
          } else {
            return i18n.global.t(
              'pageInventory.toast.successDisableIdentifyLed',
            );
          }
        })
        .catch((error) => {
          const chassisUri = uri.split('/Assembly').shift();
          this.getAssemblyInfo({ uri: chassisUri });
          console.log('error', error);
          if (led.identifyLed) {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorEnableIdentifyLed'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
            );
          }
        });
    },
  },
});

export default AssemblyStore;
