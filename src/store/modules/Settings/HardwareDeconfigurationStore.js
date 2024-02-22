import api from '@/store/api';
import i18n from '@/i18n';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';

const HardwareDeconfigurationStore = {
  namespaced: true,
  state: {
    dimms: [],
    cores: [],
  },
  getters: {
    dimms: (state) => state.dimms,
    cores: (state) => state.cores,
  },
  mutations: {
    setDimms: (state, dimms) => (state.dimms = dimms),
    setCores: (state, cores) => (state.cores = cores),
  },
  actions: {
    async getProcessorsCollection() {
      return await api
        .get('/redfish/v1/Systems/system/Processors')
        .then(({ data: { Members } }) =>
          Members.map((member) => member['@odata.id'])
        )
        .catch((error) => console.log(error));
    },
    async getProcessors({ commit, dispatch }) {
      const collection = await dispatch('getProcessorsCollection');
      if (!collection) return;
      await api
        .all(collection.map((processor) => dispatch('getCores', processor)))
        .then((response) => {
          var totalCores = [].concat.apply([], response);
          commit('setCores', totalCores);
        });
    },

    async getCores(_, id) {
      const locationCode = await api
        .get(`${id}`)
        .then((response) => response.data.Location.PartLocation.ServiceLabel)
        .catch((error) => console.log(error));
      const procId = await api
        .get(`${id}`)
        .then((response) => response.data.Id)
        .catch((error) => console.log(error));
      const cores = await api
        .get(`${id}/SubProcessors`)
        .then((response) => response.data.Members)
        .catch((error) => console.log(error));
      if (!cores) return;
      const promises = cores.map((core) => {
        return api.get(core['@odata.id']).catch((error) => {
          console.log(error);
          return error;
        });
      });
      return await api.all(promises).then(
        api.spread((...responses) => {
          const coreData = responses.map(({ data }) => {
            var msgArgs = 'None';
            var eventId = '';
            const conditionsArray = data.Status?.Conditions;
            if (Array.isArray(conditionsArray) && conditionsArray.length) {
              const messageArgsArray = conditionsArray[0].MessageArgs;
              if (Array.isArray(messageArgsArray) && messageArgsArray.length) {
                msgArgs = messageArgsArray[0];
              }
              const logEntry = conditionsArray[0].LogEntry;
              if (logEntry) {
                const eventIdUrl = logEntry['@odata.id'];
                const splitUrl = eventIdUrl.split('/');
                eventId = splitUrl[splitUrl.length - 1];
              }
            }
            return {
              name: data.Name,
              status: data.Status.Health,
              id: data.Id,
              location: locationCode,
              functionalState: data.Status?.Health,
              settings: data.Enabled,
              uri: data['@odata.id'],
              deconfigurationType:
                msgArgs === 'By Association'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.byAssociation'
                    )
                  : msgArgs === 'Error'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.error')
                  : msgArgs === 'Fatal'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.fatal')
                  : msgArgs === 'FCO-Deconfigured'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.fcoDeconfigured'
                    )
                  : msgArgs === 'Invalid'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.invalid')
                  : msgArgs === 'Manual'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.manual')
                  : msgArgs === 'None'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.none')
                  : msgArgs === 'Predictive'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.predictive'
                    )
                  : msgArgs === 'Recovered'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.recovered')
                  : msgArgs === 'Unknown'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.unknown')
                  : msgArgs,
              processorId: procId,
              eventID: eventId,
            };
          });
          return coreData;
        })
      );
    },

    async getDimms({ commit }) {
      const dimms = await api
        .get('/redfish/v1/Systems/system/Memory')
        .then((response) => response.data.Members)
        .catch((error) => console.log(error));
      if (!dimms) return;
      const promises = dimms.map((dimm) => {
        return api.get(dimm['@odata.id']).catch((error) => {
          console.log(error);
          return error;
        });
      });
      return await api.all(promises).then(
        api.spread((...responses) => {
          const dimmsData = responses.map(({ data }) => {
            var msgArgs = 'None';
            var eventId = '';
            const conditionsArray = data.Status?.Conditions;
            if (Array.isArray(conditionsArray) && conditionsArray.length) {
              const messageArgsArray = conditionsArray[0].MessageArgs;
              if (Array.isArray(messageArgsArray) && messageArgsArray.length) {
                msgArgs = messageArgsArray[0];
              }
              const logEntry = conditionsArray[0].LogEntry;
              if (logEntry) {
                const eventIdUrl = logEntry['@odata.id'];
                const splitUrl = eventIdUrl.split('/');
                eventId = splitUrl[splitUrl.length - 1];
              }
            }
            return {
              id: data.Id,
              functionalState: data.Status?.Health,
              size: data.CapacityMiB,
              locationCode: data.Location?.PartLocation?.ServiceLabel,
              deconfigurationType:
                msgArgs === 'By Association'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.byAssociation'
                    )
                  : msgArgs === 'Error'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.error')
                  : msgArgs === 'Fatal'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.fatal')
                  : msgArgs === 'FCO-Deconfigured'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.fcoDeconfigured'
                    )
                  : msgArgs === 'Invalid'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.invalid')
                  : msgArgs === 'Manual'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.manual')
                  : msgArgs === 'None'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.none')
                  : msgArgs === 'Predictive'
                  ? i18n.t(
                      'pageDeconfigurationHardware.table.filter.predictive'
                    )
                  : msgArgs === 'Recovered'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.recovered')
                  : msgArgs === 'Unknown'
                  ? i18n.t('pageDeconfigurationHardware.table.filter.unknown')
                  : msgArgs,
              settings: data.Enabled,
              uri: data['@odata.id'],
              available: data.Status?.State,
              eventID: eventId,
            };
          });
          const dimmsDataFiltered = dimmsData.filter(
            (item) => item.available !== 'Absent'
          );
          commit('setDimms', dimmsDataFiltered);
        })
      );
    },
    async updateSettingsState(_, settingsState) {
      const uri = settingsState.uri;
      const updatedSettingsValue = {
        Enabled: settingsState.settings,
      };
      return await api.patch(uri, updatedSettingsValue).catch((error) => {
        console.log('error', error);
        const messageId =
          error.response.data.error['@Message.ExtendedInfo'][0].MessageId;

        if (REGEX_MAPPINGS.resourceCannotBeDeleted.test(messageId)) {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.deleteReqFailed')
          );
        } else if (settingsState.settings) {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.errorEnablingSetting')
          );
        } else {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.errorDisablingSetting')
          );
        }
      });
    },
    async updateCoresSettingsState(_, settingsState) {
      const uri = settingsState.uri;
      const updatedSettingsValue = {
        Enabled: settingsState.settings,
      };
      return await api.patch(uri, updatedSettingsValue).catch((error) => {
        console.log('error', error);
        const messageId =
          error.response.data.error['@Message.ExtendedInfo'][0].MessageId;

        if (REGEX_MAPPINGS.resourceCannotBeDeleted.test(messageId)) {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.deleteReqFailed')
          );
        } else if (settingsState.settings) {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.errorEnablingSetting')
          );
        } else {
          throw new Error(
            i18n.t('pageDeconfigurationHardware.toast.errorDisablingSetting')
          );
        }
      });
    },
  },
};

export default HardwareDeconfigurationStore;
