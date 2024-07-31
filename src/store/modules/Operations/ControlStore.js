import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';
import { GlobalStore } from '@/store/modules/GlobalStore.js';

export const ControlStore = defineStore('control', {
  state: () => ({
    isOperationInProgress: false,
    lastPowerOperationTime: null,
    lastBmcRebootTime: null,
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
      // Action not tested. Remove this comment once the action is tested and verified.
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
      // Action not tested. Remove this comment once the action is tested and verified.
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
    async serverPowerOn() {
      // Action not tested. Remove this comment once the action is tested and verified.
      const data = { ResetType: 'On' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverSoftReboot() {
      // Action not tested. Remove this comment once the action is tested and verified.
      const data = { ResetType: 'GracefulRestart' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverHardReboot() {
      // Action not tested. Remove this comment once the action is tested and verified.
      const data = { ResetType: 'ForceRestart' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('on');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverSoftPowerOff() {
      // Action not tested. Remove this comment once the action is tested and verified.
      const data = { ResetType: 'GracefulShutdown' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('off');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    async serverHardPowerOff() {
      // Action not tested. Remove this comment once the action is tested and verified.
      const data = { ResetType: 'ForceOff' };
      this.serverPowerChange(data);
      await this.checkForServerStatus('off');
      this.isOperationInProgress = false;
      this.fetchLastPowerOperationTime();
    },
    serverPowerChange(data) {
      // Action not tested. Remove this comment once the action is tested and verified.
      this.isOperationInProgress = true;
      api
        .post('/redfish/v1/Systems/system/Actions/ComputerSystem.Reset', data)
        .catch((error) => {
          console.log(error);
          this.isOperationInProgress = false;
        });
    },
  },
});

export default ControlStore;
