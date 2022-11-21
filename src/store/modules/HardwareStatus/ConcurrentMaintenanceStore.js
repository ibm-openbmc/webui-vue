import api from '@/store/api';
import i18n from '@/i18n';

const ConcurrentMaintenanceStore = {
  namespaced: true,
  state: {
    readyToRemove: false,
    todObject: {},
    readyToRemoveOpPanelBase: false,
    opPanelBase: {},
    readyToRemoveOpPanelLcd: false,
    opPanelLcd: {},
  },
  getters: {
    readyToRemove: (state) => state.readyToRemove,
    todObject: (state) => state.todObject,
    readyToRemoveOpPanelBase: (state) => state.readyToRemoveOpPanelBase,
    opPanelBase: (state) => state.opPanelBase,
    readyToRemoveOpPanelLcd: (state) => state.readyToRemoveOpPanelLcd,
    opPanelLcd: (state) => state.opPanelLcd,
  },
  mutations: {
    setReadyToRemove: (state, readyToRemove) =>
      (state.readyToRemove = readyToRemove),
    setTodObject: (state, todObject) => (state.todObject = todObject),
    setReadyToRemoveOpPanelBase: (state, readyToRemoveOpPanelBase) =>
      (state.readyToRemoveOpPanelBase = readyToRemoveOpPanelBase),
    setOpPanelBase: (state, opPanelBase) => (state.opPanelBase = opPanelBase),
    setReadyToRemoveOpPanelLcd: (state, readyToRemoveOpPanelLcd) =>
      (state.readyToRemoveOpPanelLcd = readyToRemoveOpPanelLcd),
    setOpPanelLcd: (state, opPanelLcd) => (state.opPanelLcd = opPanelLcd),
  },
  actions: {
    async getReadyToRemove({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (entry.Name === 'Time Of Day Battery') {
              commit('setTodObject', entry);
              commit('setReadyToRemove', entry.Oem.OpenBMC.ReadyToRemove);
            }
          })
        )
        .catch((error) => console.log(error));
    },
    async getOpPanelBase({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (entry.Name === 'Operator Panel Base') {
              commit('setOpPanelBase', entry);
              commit(
                'setReadyToRemoveOpPanelBase',
                entry.Oem.OpenBMC.ReadyToRemove
              );
            }
          })
        )
        .catch((error) => console.log(error));
    },
    async getOpPanelLcd({ commit }) {
      return await api
        .get('/redfish/v1/Chassis/chassis/Assembly')
        .then((response) =>
          response.data.Assemblies.map((entry) => {
            if (entry.Name === 'Operator Panel LCD') {
              commit('setOpPanelLcd', entry);
              commit(
                'setReadyToRemoveOpPanelLcd',
                entry.Oem.OpenBMC.ReadyToRemove
              );
            }
          })
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
            }
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemove', !updatedReadyToRemove);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedReadyToRemove ? 'enabling' : 'disabling',
            })
          );
        });
    },
    async saveReadyToRemoveOpPanelBase({ commit, state }, updatedOpPanelBase) {
      commit('setReadyToRemoveOpPanelBase', updatedOpPanelBase);
      return await api
        .patch('/redfish/v1/Chassis/chassis/Assembly', {
          Assemblies: [
            {
              MemberId: state.opPanelBase.MemberId,
              Oem: {
                OpenBMC: {
                  ReadyToRemove: updatedOpPanelBase,
                },
              },
            },
          ],
        })
        .then(() => {
          return i18n.t(
            'pageConcurrentMaintenance.toast.successSaveReadyToRemove',
            {
              state: updatedOpPanelBase ? 'enabled' : 'disabled',
            }
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemoveOpPanelBase', !updatedOpPanelBase);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedOpPanelBase ? 'enabling' : 'disabling',
            })
          );
        });
    },
    async saveReadyToRemoveOpPanelLcd({ commit, state }, updatedOpPanelLcd) {
      commit('setReadyToRemoveOpPanelLcd', updatedOpPanelLcd);
      return await api
        .patch('/redfish/v1/Chassis/chassis/Assembly', {
          Assemblies: [
            {
              MemberId: state.opPanelLcd.MemberId,
              Oem: {
                OpenBMC: {
                  ReadyToRemove: updatedOpPanelLcd,
                },
              },
            },
          ],
        })
        .then(() => {
          return i18n.t(
            'pageConcurrentMaintenance.toast.successSaveReadyToRemove',
            {
              state: updatedOpPanelLcd ? 'enabled' : 'disabled',
            }
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setReadyToRemoveOpPanelLcd', !updatedOpPanelLcd);
          throw new Error(
            i18n.t('pageConcurrentMaintenance.toast.errorSaveReadyToRemove', {
              state: updatedOpPanelLcd ? 'enabling' : 'disabling',
            })
          );
        });
    },
  },
};

export default ConcurrentMaintenanceStore;
