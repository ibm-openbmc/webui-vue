import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const PowerControlStore = defineStore('powerControl', {
  state: () => ({
    powerConsumption: null,
    powerControlMode: null,
    powerCap: null,
    powerCapMin: null,
    powerCapMax: null,
    powerPerformanceMode: null,
    powerPerformanceModeValues: null,
    idlePowerSaverData: null,
  }),
  getters: {
    powerConsumptionGetter: (state) => state.powerConsumption,
    powerControlModeGetter: (state) => state.powerControlMode,
    isPowerCapEnabled: (state) => state.powerControlMode === 'Automatic',
    powerCapGetter: (state) => state.powerCap,
    powerCapMinGetter: (state) => state.powerCapMin,
    powerCapMaxGetter: (state) => state.powerCapMax,
    powerPerformanceModeGetter: (state) => state.powerPerformanceMode,
    powerPerformanceModeValuesGetter: (state) =>
      state.powerPerformanceModeValues,
    idlePowerSaverDataGetter: (state) => state.idlePowerSaverData,
  },
  actions: {
    async getPowerControl() {
      return await api
        .get('/redfish/v1/Chassis/chassis/EnvironmentMetrics')
        .then(({ data }) => {
          this.powerConsumption = data.PowerWatts?.Reading;
          this.powerControlMode = data.PowerLimitWatts?.ControlMode;
          this.powerCap = data.PowerLimitWatts?.SetPoint;
          this.powerCapMin = data.PowerLimitWatts?.AllowableMin;
          this.powerCapMax = data.PowerLimitWatts?.AllowableMax;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async setPowerControlAndCap({ powerControlMode, powerCap }) {
      const newPowerCap = {
        PowerLimitWatts: {
          ControlMode: powerControlMode,
          SetPoint: powerCap,
        },
      };
      return await api
        .patch('/redfish/v1/Chassis/chassis/EnvironmentMetrics', newPowerCap)
        .then(() =>
          i18n.global.t('pageServerPowerOperations.toast.successSaveSettings'),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
        });
    },
    async getPowerPerformanceMode() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then(({ data }) => {
          this.powerPerformanceMode = data.PowerMode;
          this.powerPerformanceModeValues =
            data['PowerMode@Redfish.AllowableValues'];
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async setPowerPerformanceMode(powerPerformanceMode) {
      const newData = { PowerMode: powerPerformanceMode };
      return await api
        .patch('/redfish/v1/Systems/system', newData)
        .then(() =>
          i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pagePower.toast.errorPowerPerformanceModes'),
          );
        });
    },
    async getIdlePowerSaverData() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then(({ data }) => {
          const idlePowerSaverData = data.IdlePowerSaver;
          this.idlePowerSaverData = idlePowerSaverData;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async setIdlePowerSaverData(idlePowerSaverData) {
      const newData = {
        IdlePowerSaver: {
          Enabled: idlePowerSaverData.isIdlePowerSaverEnabled,
          EnterDwellTimeSeconds: idlePowerSaverData.enterDwellTimeSeconds,
          ExitDwellTimeSeconds: idlePowerSaverData.exitDwellTimeSeconds,
          EnterUtilizationPercent: idlePowerSaverData.enterUtilizationPercent,
          ExitUtilizationPercent: idlePowerSaverData.exitUtilizationPercent,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system', newData)
        .then(() => i18n.global.t('pagePower.toast.successIdlePower'))
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.global.t('pagePower.toast.errorIdlePower'));
        });
    },
    async resetIdlePowerSaver() {
      const newData = {
        IdlePowerSaver: {
          ExitUtilizationPercent: 0,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system', newData)
        .then(() => i18n.global.t('pagePower.toast.successIdlePowerReset'))
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.global.t('pagePower.toast.errorIdlePowerReset'));
        });
    },
    async setIdlePowerSaverEnable(idlePowerSaver) {
      const newData = {
        IdlePowerSaver: {
          Enabled: idlePowerSaver,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system', newData)
        .then(() =>
          i18n.global.t('pagePower.toast.successPowerPerformanceModes'),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pagePower.toast.errorPowerPerformanceModes'),
          );
        });
    },
  },
});

export default PowerControlStore;
