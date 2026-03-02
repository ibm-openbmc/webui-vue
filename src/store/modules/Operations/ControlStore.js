import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { GlobalStore } from '@/store/modules/GlobalStore.js';
import { watch } from 'vue';

/**
 * Watch for serverStatus changes in GlobalStore module
 * to set isOperationInProgress state
 * Stop watching status changes and resolve Promise when
 * serverStatus value matches passed argument or after 5 minutes
 * @param {string} serverStatus
 * @returns {Promise}
 */
const checkForServerStatus = (serverStatus) => {
  const global = GlobalStore();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve();
      unwatch();
    }, 300000 /*5mins*/);
    const unwatch = watch(
      () => global.serverStatus,
      (value) => {
        if (value === serverStatus) {
          resolve();
          unwatch();
          clearTimeout(timer);
        }
      },
    );
  });
};
export const ControlStore = defineStore('control', {
  state: () => ({
    isOperationInProgress: false,
    lastPowerOperationTime: null,
    displayInfoToast: false,
  }),
  getters: {
    getIsOperationInProgress: (state) => state.isOperationInProgress,
    getLastPowerOperationTime: (state) => state.lastPowerOperationTime,
  },
  actions: {
    async fetchLastPowerOperationTime() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then((response) => {
          const lastReset = response.data.LastResetTime;
          if (lastReset) {
            const lastPowerOperationTime = new Date(lastReset);
            this.lastPowerOperationTime = lastPowerOperationTime;
          }
        })
        .catch((error) => console.log(error));
    },
    async powerOps(value) {
      await checkForServerStatus(value);
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverPowerOn() {
      const value = 'on';
      const data = { ResetType: 'On' };
      const displayInfo = await this.serverPowerChange(data);
      this.powerOps(value);
      return Promise.resolve(displayInfo);
    },
    async serverSoftReboot() {
      const value = 'on';
      const data = { ResetType: 'GracefulRestart' };
      const displayInfo = await this.serverPowerChange(data);
      this.powerOps(value);
      return Promise.resolve(displayInfo);
    },
    async serverHardReboot() {
      const value = 'on';
      const data = { ResetType: 'ForceRestart' };
      const displayInfo = await this.serverPowerChange(data);
      this.powerOps(value);
      return Promise.resolve(displayInfo);
    },
    async serverSoftPowerOff() {
      const value = 'off';
      const data = { ResetType: 'GracefulShutdown' };
      const displayInfo = await this.serverPowerChange(data);
      this.powerOps(value);
      return Promise.resolve(displayInfo);
    },
    async serverHardPowerOff() {
      const value = 'off';
      const data = { ResetType: 'ForceOff' };
      const displayInfo = await this.serverPowerChange(data);
      this.powerOps(value);
      return Promise.resolve(displayInfo);
    },
    serverPowerChange(data) {
      this.isOperationInProgress = true;
      return api
        .post('/redfish/v1/Systems/system/Actions/ComputerSystem.Reset', data)
        .then(() => {
          this.displayInfoToast = true;
          return this.displayInfoToast;
        })
        .catch((error) => {
          console.log(error);
          this.displayInfoToast = false;
          this.isOperationInProgress = false;
          throw new Error(
            i18n.global.t('pageServerPowerOperations.toast.errorSaveSettings'),
          );
        });
    },
  },
});

export default ControlStore;
