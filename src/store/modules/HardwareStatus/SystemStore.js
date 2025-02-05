//TODO: Work Requird -->
import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const SystemStore = defineStore('system', {
  state: () => ({
    systems: [],
  }),
  getters: {
    getSystems: (state) => state.systems,
  },
  actions: {
    setSystemInfo(data) {
      const system = {};
      system.assetTag = data.AssetTag;
      system.name = data.Name;
      system.health = data.Status?.Health;
      system.totalSystemMemoryGiB = data.MemorySummary?.TotalSystemMemoryGiB;
      system.id = data.Id;
      system.lampTest = data.Oem?.IBM?.LampTest;
      system.sysAttentionLed =
        data.Oem?.IBM?.PartitionSystemAttentionIndicator ||
        data.Oem?.IBM?.PlatformSystemAttentionIndicator;
      system.locationIndicatorActive = data.LocationIndicatorActive;
      system.model = data.Model;
      system.processorSummaryCoreCount = data.ProcessorSummary?.CoreCount;
      system.processorSummaryCount = data.ProcessorSummary?.Count;
      system.powerState = data.PowerState;
      system.serialNumber = data.SerialNumber;
      system.statusState = data.Status?.State;
      this.systems = [system];
    },
    async getSystem() {
      return await api
        .get('/redfish/v1')
        .then((response) =>
          api.get(`${response.data.Systems['@odata.id']}/system`),
        )
        .then(({ data }) => this.setSystemInfo(data))
        .catch((error) => console.log(error));
    },
    async changeIdentifyLedState(ledState) {
      return await api
        .patch('/redfish/v1/Systems/system', {
          LocationIndicatorActive: ledState,
        })
        .then(() => {
          if (ledState) {
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
          this.getSystem();
          console.log('error', error);
          if (ledState) {
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
    async changeSystemAttentionLedState(ledState) {
      return await api
        .patch('/redfish/v1/Systems/system', {
          Oem: {
            IBM: {
              PartitionSystemAttentionIndicator: ledState,
              PlatformSystemAttentionIndicator: ledState,
            },
          },
        })
        .then(() => {
          if (!ledState) {
            return i18n.global.t(
              'pageInventory.toast.successDisableSystemAttentionLed',
            );
          }
        })
        .catch((error) => {
          this.getSystem();
          console.log('error', error);
          if (!ledState) {
            throw new Error(
              i18n.global.t(
                'pageInventory.toast.errorDisableSystemAttentionLed',
              ),
            );
          }
        });
    },
    async changeLampTestState(lampTestState) {
      return await api
        .patch('/redfish/v1/Systems/system', {
          Oem: {
            IBM: {
              LampTest: lampTestState,
            },
          },
        })
        .then(() => {
          if (lampTestState) {
            return i18n.global.t('pageInventory.toast.successEnableLampTest');
          }
        })
        .catch((error) => {
          this.getSystem();
          console.log('error', error);
          if (lampTestState) {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorEnableLampTest'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorDisableLampTest'),
            );
          }
        });
    },
    async saveAssetTag(assetTag) {
      return api
        .patch('/api/redfish/v1/Systems/system', assetTag)
        .then(() => {
          return i18n.global.t('pageOverview.toast.successSaveAssetTag');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageOverview.toast.errorSaveAssetTag'),
          );
        });
    },
  },
});

export default SystemStore;
