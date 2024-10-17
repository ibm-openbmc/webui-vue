import api from '@/store/api';
import i18n from '@/i18n';

/**
 * Watch for serverStatus changes in GlobalStore module
 * to set isOperationInProgress state
 * Stop watching status changes and resolve Promise when
 * serverStatus value matches passed argument or after 5 minutes
 * @param {string} serverStatus
 * @returns {Promise}
 */
const checkForServerStatus = function (serverStatus) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve();
      unwatch();
    }, 300000 /*5mins*/);
    const unwatch = this.watch(
      (state) => state.global.serverStatus,
      (value) => {
        if (value === serverStatus) {
          resolve();
          unwatch();
          clearTimeout(timer);
        }
      }
    );
  });
};

const ControlStore = {
  namespaced: true,
  state: {
    isOperationInProgress: false,
    lastPowerOperationTime: null,
    lastBmcRebootTime: null,
    displayInfoToast: false,
  },
  getters: {
    isOperationInProgress: (state) => state.isOperationInProgress,
    lastPowerOperationTime: (state) => state.lastPowerOperationTime,
    lastBmcRebootTime: (state) => state.lastBmcRebootTime,
    displayInfoToast: (state) => state.displayInfoToast,
  },
  mutations: {
    setOperationInProgress: (state, inProgress) =>
      (state.isOperationInProgress = inProgress),
    setLastPowerOperationTime: (state, lastPowerOperationTime) =>
      (state.lastPowerOperationTime = lastPowerOperationTime),
    setLastBmcRebootTime: (state, lastBmcRebootTime) =>
      (state.lastBmcRebootTime = lastBmcRebootTime),
    setDisplayInfoToast: (state, displayInfoToast) =>
      (state.displayInfoToast = displayInfoToast),
  },
  actions: {
    async getLastPowerOperationTime({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system')
        .then((response) => {
          const lastReset = response.data.LastResetTime;
          if (lastReset) {
            const lastPowerOperationTime = new Date(lastReset);
            commit('setLastPowerOperationTime', lastPowerOperationTime);
          }
        })
        .catch((error) => console.log(error));
    },
    getLastBmcRebootTime({ commit }) {
      return api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          const lastBmcReset = response.data.LastResetTime;
          const lastBmcRebootTime = new Date(lastBmcReset);
          commit('setLastBmcRebootTime', lastBmcRebootTime);
        })
        .catch((error) => console.log(error));
    },
    async rebootBmc({ dispatch }) {
      const data = { ResetType: 'GracefulRestart' };
      return await api
        .post('/redfish/v1/Managers/bmc/Actions/Manager.Reset', data)
        .then(() => dispatch('getLastBmcRebootTime'))
        .then(() => i18n.t('pageRebootBmc.toast.successRebootStart'))
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.t('pageRebootBmc.toast.errorRebootStart'));
        });
    },
    async powerOps({ dispatch, commit }, { thisVal, value }) {
      await checkForServerStatus.bind(thisVal, value)();
      commit('setOperationInProgress', false);
      dispatch('getLastPowerOperationTime');
    },
    async serverPowerOn({ dispatch }) {
      const value = 'on';
      const data = { ResetType: 'On' };
      const displayInfo = await dispatch('serverPowerChange', data);
      dispatch('powerOps', { thisVal: this, value });
      return Promise.resolve(displayInfo);
    },
    async serverSoftReboot({ dispatch }) {
      const value = 'on';
      const data = { ResetType: 'GracefulRestart' };
      const displayInfo = await dispatch('serverPowerChange', data);
      dispatch('powerOps', { thisVal: this, value });
      return Promise.resolve(displayInfo);
    },
    async serverHardReboot({ dispatch }) {
      const value = 'on';
      const data = { ResetType: 'ForceRestart' };
      const displayInfo = await dispatch('serverPowerChange', data);
      dispatch('powerOps', { thisVal: this, value });
      return Promise.resolve(displayInfo);
    },
    async serverSoftPowerOff({ dispatch }) {
      const value = 'off';
      const data = { ResetType: 'GracefulShutdown' };
      const displayInfo = await dispatch('serverPowerChange', data);
      dispatch('powerOps', { thisVal: this, value });
      return Promise.resolve(displayInfo);
    },
    async serverHardPowerOff({ dispatch }) {
      const value = 'off';
      const data = { ResetType: 'ForceOff' };
      const displayInfo = await dispatch('serverPowerChange', data);
      dispatch('powerOps', { thisVal: this, value });
      return Promise.resolve(displayInfo);
    },
    serverPowerChange({ commit, state }, data) {
      commit('setOperationInProgress', true);
      return api
        .post('/redfish/v1/Systems/system/Actions/ComputerSystem.Reset', data)
        .then(() => {
          state.displayInfoToast = true;
          return state.displayInfoToast;
        })
        .catch((error) => {
          console.log(error);
          state.displayInfoToast = false;
          commit('setOperationInProgress', false);
        });
    },
  },
};

export default ControlStore;
