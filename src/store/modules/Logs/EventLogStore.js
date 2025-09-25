import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

const getHealthStatus = (events, loadedEvents) => {
  let status = loadedEvents ? 'OK' : '';
  for (const event of events) {
    if (event.severity === 'Critical' && !event.status) {
      status = 'Critical';
      break;
    } else if (event.severity === 'Warning' && !event.status) {
      status = 'Warning';
    }
  }
  return status;
};

// TODO: High priority events should also check if Log
// is resolved when the property is available in Redfish
const getHighPriorityEvents = (events) =>
  events.filter(({ severity }) => severity === 'Critical');

export const EventLogStore = defineStore('eventLog', {
  state: () => ({
    allEvents: [],
    ceLogs: [],
    loadedEvents: false,
    eventlogs: [],
  }),
  getters: {
    allEventsGetter: (state) => state.allEvents.concat(state.ceLogs),
    ceLogsGetter: (state) => state.ceLogs,
    highPriorityEvents: (state) => getHighPriorityEvents(state.allEvents),
    healthStatus: (state) =>
      getHealthStatus(state.allEvents, state.loadedEvents),
    eventlogsGetter: (state) => state.allEvents.concat(state.ceLogs),
  },
  actions: {
    async initializeLogs() {
      let eventLogs = [];
      this.eventlogs = eventLogs;
      this.ceLogs = eventLogs;
      this.loadedEvents = true;
    },
    async getEventLogData() {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/EventLog/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          let eventLogs = Members.map((log) => {
            const {
              Id,
              EventId,
              Severity,
              Created,
              EntryType,
              Message,
              Name,
              Modified,
              Resolution,
              Resolved,
              AdditionalDataURI,
            } = log;
            return {
              id: Id,
              eventId: EventId,
              severity: Severity,
              date: new Date(Created),
              type: EntryType,
              description: Message,
              name: Name,
              modifiedDate: new Date(Modified),
              resolution: Resolution,
              toggleDetails: false,
              rowSelected: false,
              uri: log['@odata.id'],
              filterByStatus: Resolved ? 'Resolved' : 'Unresolved',
              status: Resolved, //true or false
              additionalDataUri: AdditionalDataURI,
              actions: [
                {
                  value: 'download',
                },
                {
                  value: 'delete',
                },
              ],
            };
          });
          this.eventlogs = eventLogs;
          this.allEvents = eventLogs;
          this.loadedEvents = true;
        })
        .catch((error) => {
          console.log('Event Log Data:', error);
        });
    },
    async getCELogData() {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/CELog/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          const eventLogs = Members.map((log) => {
            const {
              Id,
              EventId,
              Severity,
              Created,
              EntryType,
              Message,
              Name,
              Modified,
              Resolution,
              Resolved,
              AdditionalDataURI,
            } = log;
            return {
              id: Id,
              eventId: EventId,
              severity: Severity,
              date: new Date(Created),
              type: EntryType,
              description: Message,
              name: Name,
              modifiedDate: new Date(Modified),
              resolution: Resolution,
              uri: log['@odata.id'],
              filterByStatus: Resolved ? 'Resolved' : 'Unresolved',
              status: Resolved, //true or false
              additionalDataUri: AdditionalDataURI,
              actions: [
                {
                  value: 'download',
                },
                {
                  value: 'delete',
                },
              ],
            };
          });
          this.ceLogs = eventLogs;
          this.loadedEvents = true;
        })
        .catch((error) => {
          console.log('Event Log Data:', error);
        });
    },
    async deleteAllEventLogs(data) {
      return await api
        .post(
          '/redfish/v1/Systems/system/LogServices/EventLog/Actions/LogService.ClearLog',
        )
        .then(() => {
          return i18n.global.t(
            'pageEventLogs.toast.successDelete',
            data.length,
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageEventLogs.toast.errorDelete', data.length),
          );
        });
    },
    async deleteEventLogs(uris = []) {
      const promises = uris.map((uri) =>
        api.delete(uri).catch((error) => {
          console.log(error);
          return error;
        }),
      );
      return await api
        .all(promises)
        .then((response) => {
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            const toastMessages = [];

            if (successCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.successDelete',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.errorDelete',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          }),
        );
    },
    async resolveEventLogs(logs) {
      const promises = logs.map((log) =>
        api.patch(log.uri, { Resolved: true }).catch((error) => {
          console.log(error);
          return error;
        }),
      );
      return await api
        .all(promises)
        .then((response) => {
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            const toastMessages = [];
            if (successCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.successResolveLogs',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }
            if (errorCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.errorResolveLogs',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }
            return toastMessages;
          }),
        );
    },
    async unresolveEventLogs(logs) {
      const promises = logs.map((log) =>
        api.patch(log.uri, { Resolved: false }).catch((error) => {
          console.log(error);
          return error;
        }),
      );
      return await api
        .all(promises)
        .then((response) => {
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            const toastMessages = [];
            if (successCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.successUnresolveLogs',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }
            if (errorCount) {
              const message = i18n.global.t(
                'pageEventLogs.toast.errorUnresolveLogs',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }
            return toastMessages;
          }),
        );
    },
    // Single log entry
    async updateEventLogStatus(log) {
      const updatedEventLogStatus = log.status;
      return await api
        .patch(log.uri, { Resolved: updatedEventLogStatus })
        .then(() => {
          if (log.status) {
            return i18n.global.t('pageEventLogs.toast.successResolveLogs', 1);
          } else {
            return i18n.global.t('pageEventLogs.toast.successUnresolveLogs', 1);
          }
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageEventLogs.toast.errorLogStatusUpdate',
          );
          throw new Error(message);
        });
    },
    async downloadLogData(uri) {
      return await api.get(uri + `/OemPelAttachment`).then((response) => {
        return response?.data?.Oem?.IBM?.PelJson;
      });
    },
  },
});

export default EventLogStore;
