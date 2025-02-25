import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';
import { defineStore } from 'pinia';

export const DumpsStore = defineStore('dumps', {
  state: () => ({
    allDumps: [],
  }),
  getters: {
    allDumpsGetter: (state) => state.allDumps,
  },
  actions: {
    async getBmcDumpEntries() {
      return api
        .get('/redfish/v1/')
        .then((response) => api.get(response.data.Managers['@odata.id']))
        .then((response) => api.get(`${response.data['@odata.id']}/bmc`))
        .then((response) => api.get(response.data.LogServices['@odata.id']))
        .then((response) => api.get(`${response.data['@odata.id']}/Dump`))
        .then((response) => api.get(response.data.Entries['@odata.id']))
        .catch((error) => console.log(error));
    },
    async getSystemDumpEntries() {
      return api
        .get('/redfish/v1/')
        .then((response) => api.get(response.data.Systems['@odata.id']))
        .then((response) => api.get(`${response.data['@odata.id']}/system`))
        .then((response) => api.get(response.data.LogServices['@odata.id']))
        .then((response) => api.get(`${response.data['@odata.id']}/Dump`))
        .then((response) => api.get(response.data.Entries['@odata.id']))
        .catch((error) => console.log(error));
    },
    async getAllDumps() {
      return await api
        .all([this.getBmcDumpEntries(), this.getSystemDumpEntries()])
        .then((response) => {
          const bmcDumpEntries = response[0].data?.Members || [];
          const systemDumpEntries = response[1].data?.Members || [];
          const allDumps = [...bmcDumpEntries, ...systemDumpEntries];
          this.allDumps = allDumps.map((dump) => ({
                  data: dump.AdditionalDataURI,
                  dateTime: new Date(dump.Created),
                  dumpType: dump.Name,
                  id: dump.Id,
                  location: dump['@odata.id'],
                  size: dump.AdditionalDataSizeBytes,
                }));
        })
        .catch((error) => console.log(error));
    },
    async createBmcDump(_, dumpType) {
      return await api
        .post(
          '/redfish/v1/Managers/bmc/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          {
            DiagnosticDataType: 'Manager',
          },
        )
        .catch((error) => {
          console.log(error);
          const messageId =
            error.response.data.error?.['@Message.ExtendedInfo'][0].MessageId;

          const message = REGEX_MAPPINGS.resourceInStandby.test(messageId)
            ? i18n.global.t('pageDumps.toast.errorStartDumpAnotherInProgress', {
                dump: dumpType,
              })
            : i18n.global.t('pageDumps.toast.errorStartBmcDump');

          throw new Error(message);
        });
    },
    async createResourceDump(_, { resourceSelector, resourcePassword }) {
      const delay = (time) =>
        new Promise((resolve) => setTimeout(resolve, time));

      return await api
        .post(
          '/redfish/v1/Systems/system/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          {
            DiagnosticDataType: 'OEM',
            OEMDiagnosticDataType: `Resource_${resourceSelector || ''}_${resourcePassword}`,
          },
        )
        .then(({ data }) => {
          // A half second lag is needed while the backend runs a process
          return delay(500).then(() => {
            return api.get(data['@odata.id']);
          });
        })
        .then(({ data }) => {
          const messageId = data.Messages.filter(
            (message) =>
              REGEX_MAPPINGS.actionParameterUnknown.test(message.MessageId) ||
              REGEX_MAPPINGS.resourceAtUriUnauthorized.test(
                message.MessageId,
              ) ||
              REGEX_MAPPINGS.insufficientPrivilege.test(message.MessageId),
          )[0]?.MessageId;

          if (messageId) {
            throw messageId;
          }
        })
        .catch((error) => {
          const errorMsg = error;
          if (
            REGEX_MAPPINGS.resourceInStandby.test(
              error.response?.data?.error?.code,
            )
          ) {
            throw new Error(i18n.global.t('pageDumps.toast.errorPhypInStandby'));
          }
          switch (true) {
            case REGEX_MAPPINGS.actionParameterUnknown.test(errorMsg):
              throw new Error(
                i18n.global.t('pageDumps.toast.errorStartResourceDumpInvalidSelector'),
              );
            case REGEX_MAPPINGS.resourceAtUriUnauthorized.test(errorMsg):
              throw new Error(
                i18n.global.t('pageDumps.toast.errorStartResourceDumpInvalidPassword'),
              );
            case REGEX_MAPPINGS.insufficientPrivilege.test(errorMsg):
              throw new Error(i18n.global.t('global.toast.unAuthDescription'));
            default:
              throw new Error(i18n.global.t('pageDumps.toast.errorStartResourceDump'));
          }
        });
    },
    async createSystemDump(_, dumpType) {
      return await api
        .post(
          '/redfish/v1/Systems/system/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          {
            DiagnosticDataType: 'OEM',
            OEMDiagnosticDataType: 'System',
          },
        )
        .catch((error) => {
          console.log(error);
          const errorMsg =
            error.response.data.error?.['@Message.ExtendedInfo'][0].MessageId;

          switch (true) {
            case REGEX_MAPPINGS.resourceInUse.test(errorMsg):
              throw new Error(
                i18n.global.t('pageDumps.toast.errorStartDumpAnotherInProgress', {
                  dump: dumpType,
                }),
              );
            case REGEX_MAPPINGS.resourceInStandby.test(errorMsg):
              throw new Error(
                i18n.global.t('pageDumps.toast.errorStartDumpResourceInStandby', {
                  dump: dumpType,
                }),
              );
            default:
              throw new Error(i18n.global.t('pageDumps.toast.errorStartSystemDump'));
          }
        });
    },
    async deleteDumps(dumps) {
      const promises = dumps.map(({ location }) =>
        api.delete(location).catch((error) => {
          console.log(error);
          return error;
        }),
      );
      return await api
        .all(promises)
        .then((response) => {
          this.getAllDumps();
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            const toastMessages = [];

            if (successCount) {
              const message = i18n.global.t(
                'pageDumps.toast.successDeleteDump',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }

            if (errorCount) {
              const message = i18n.global.t(
                'pageDumps.toast.errorDeleteDump',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }

            return toastMessages;
          }),
        );
    },
    async deleteAllDumps() {
      const totalDumpCount = this.allDumps.length;
      return await api
        .post(
          '/redfish/v1/Managers/bmc/LogServices/Dump/Actions/LogService.ClearLog',
        )
        .then(() => {
          this.allDumps = [];
          return i18n.global.t('pageDumps.toast.successDeleteDump', totalDumpCount);
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageDumps.toast.errorDeleteDump', totalDumpCount),
          );
        });
    },
  },
}
);

export default DumpsStore;
