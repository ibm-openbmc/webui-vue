import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { GlobalStore } from '@/store/modules/GlobalStore.js';

export const ControlStore = defineStore('control', {
  state: () => ({
    isOperationInProgress: false,
    lastPowerOperationTime: null,
    lastBmcRebootTime: null,
    displayInfoToast: false,
  }),
  getters: {
    getIsOperationInProgress: (state) => state.isOperationInProgress,
    getLastPowerOperationTime: (state) => state.lastPowerOperationTime,
    getLastBmcRebootTime: (state) => state.lastBmcRebootTime,
  },
  actions: {
    /**
     * Watch for serverStatus changes in GlobalStore module
     * to set isOperationInProgress state
     * Stop watching status changes and resolve Promise when
     * serverStatus value matches passed argument or after 5 minutes
     * @param {string} serverStatus
     * @returns {Promise}
     */
    async checkForServerStatus(serverStatus) {
      const global = GlobalStore();
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve();
          clearSub();
        }, 300000 /*5mins*/);
        const clearSub = global.$subscribe(
          ({ events }) => {
            if (
              events.key === 'serverStatus' &&
              events.newValue === serverStatus
            ) {
              resolve();
              clearSub();
              clearTimeout(timer);
            }
          },
          { detached: true },
        );
      });
    },
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
    fetchLastBmcRebootTime() {
      return api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          const lastBmcReset = response.data.LastResetTime;
          const lastBmcRebootTime = new Date(lastBmcReset);
          this.lastBmcRebootTime = lastBmcRebootTime;
        })
        .catch((error) => console.log(error));
    },
    async rebootBmc() {
      const data = { ResetType: 'GracefulRestart' };
      return await api
        .post('/redfish/v1/Managers/bmc/Actions/Manager.Reset', data)
        .then(() => this.fetchLastBmcRebootTime())
        .then(() => i18n.global.t('pageRebootBmc.toast.successRebootStart'))
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageRebootBmc.toast.errorRebootStart'),
          );
        });
    },
    async powerOps(value) {
      await this.checkForServerStatus(value);
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
        });
    },
  },
});

export default ControlStore;
