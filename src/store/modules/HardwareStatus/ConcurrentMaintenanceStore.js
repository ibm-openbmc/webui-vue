import api from '@/store/api';
import i18n from '@/i18n';

const ConcurrentMaintenanceStore = {
  namespaced: true,
  state: {
    readyToRemove: false,
    todObject: {},
    readyToRemoveControlPanel: false,
    controlPanel: {},
    readyToRemoveControlPanelDisp: false,
    controlPanelDisp: {},
  },
  getters: {
    readyToRemove: (state) => state.readyToRemove,
    todObject: (state) => state.todObject,
    readyToRemoveControlPanel: (state) => state.readyToRemoveControlPanel,
    controlPanel: (state) => state.controlPanel,
    readyToRemoveControlPanelDisp: (state) =>
      state.readyToRemoveControlPanelDisp,
    controlPanelDisp: (state) => state.controlPanelDisp,
  },
  mutations: {
    setReadyToRemove: (state, readyToRemove) =>
      (state.readyToRemove = readyToRemove),
    setTodObject: (state, todObject) => (state.todObject = todObject),
    setReadyToRemoveControlPanel: (state, readyToRemoveControlPanel) =>
      (state.readyToRemoveControlPanel = readyToRemoveControlPanel),
    setControlPanel: (state, controlPanel) =>
      (state.controlPanel = controlPanel),
    setReadyToRemoveControlPanelDisp: (state, readyToRemoveControlPanelDisp) =>
      (state.readyToRemoveControlPanelDisp = readyToRemoveControlPanelDisp),
    setControlPanelDisp: (state, controlPanelDisp) =>
      (state.controlPanelDisp = controlPanelDisp),
  },
  actions: {
    async getReadyToRemove({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (
              Object.hasOwn(entry?.Oem?.OpenBMC || {}, 'ReadyToRemove') &&
              entry?.Location?.PartLocation?.ServiceLabel?.endsWith?.(
                'P0-C0-E0',
              )
            ) {
              commit('setTodObject', entry);
              commit('setReadyToRemove', entry.Oem.OpenBMC.ReadyToRemove);
            }
          }),
        )
        .catch((error) => console.log(error));
    },
    async getControlPanel({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (entry.Name === 'Operator Panel Base') {
              commit('setOpPanelBase', entry);
              commit(
                'setReadyToRemoveControlPanel',
                entry.Oem.OpenBMC.ReadyToRemove,
              );
            }
          }),
        )
        .catch((error) => console.log(error));
    },
    async getControlPanelDisp({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (
              Object.hasOwn(entry?.Oem?.OpenBMC || {}, 'ReadyToRemove') &&
              entry?.Location?.PartLocation?.ServiceLabel?.endsWith?.('D1')
            ) {
              commit('setControlPanelDisp', entry);
              commit(
                'setReadyToRemoveControlPanelDisp',
                entry.Oem.OpenBMC.ReadyToRemove,
              );
            }
          }),
        )
        .catch((error) => console.log(error));
    },
    async saveReadyToRemoveState({ commit, state }, updatedReadyToRemove) {
      commit('setReadyToRemove', updatedReadyToRemove);
      return await api
        .patch('/redfish/v1/Chassis/chassis/Assembly', {
          Assemblies: [
            {
              MemberId: state.todObject.MemberId,
              Oem: {
                OpenBMC: {
                  ReadyToRemove: updatedReadyToRemove,
                },
              },
            },
          ],
        })
        .then(() => {
          return i18n.t(
            'pageConcurrentMaintenance.toast.successSaveReadyToRemove',
            {
              state: updatedReadyToRemove ? 'enabled' : 'disabled',
            },
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemove', !updatedReadyToRemove);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedReadyToRemove ? 'enabling' : 'disabling',
            }),
          );
        });
    },
    async saveReadyToRemoveControlPanel(
      { commit, state },
      updatedControlPanel,
    ) {
      commit('setReadyToRemoveControlPanel', updatedControlPanel);
      return await api
        .patch('/redfish/v1/Chassis/chassis/Assembly', {
          Assemblies: [
            {
              MemberId: state.controlPanel.MemberId,
              Oem: {
                OpenBMC: {
                  ReadyToRemove: updatedControlPanel,
                },
              },
            },
          ],
        })
        .then(() => {
          return i18n.t(
            'pageConcurrentMaintenance.toast.successSaveReadyToRemove',
            {
              state: updatedControlPanel ? 'enabled' : 'disabled',
            },
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemoveControlPanel', !updatedControlPanel);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedControlPanel ? 'enabling' : 'disabling',
            }),
          );
        });
    },
    async saveReadyToRemoveControlPanelDisp(
      { commit, state },
      updatedControlPanelDisp,
    ) {
      commit('setReadyToRemoveControlPanelDisp', updatedControlPanelDisp);
      return await api
        .patch('/redfish/v1/Chassis/chassis/Assembly', {
          Assemblies: [
            {
              MemberId: state.controlPanelDisp.MemberId,
              Oem: {
                OpenBMC: {
                  ReadyToRemove: updatedControlPanelDisp,
                },
              },
            },
          ],
        })
        .then(() => {
          return i18n.t(
            'pageConcurrentMaintenance.toast.successSaveReadyToRemove',
            {
              state: updatedControlPanelDisp ? 'enabled' : 'disabled',
            },
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemoveControlPanelDisp', !updatedControlPanelDisp);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedControlPanelDisp ? 'enabling' : 'disabling',
            }),
          );
        });
    },
  },
};

export default ConcurrentMaintenanceStore;
