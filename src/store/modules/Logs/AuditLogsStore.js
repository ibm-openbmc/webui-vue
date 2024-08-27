import { defineStore } from 'pinia';
import api from '@/store/api';

export const AuditLogsStore = defineStore('auditLogs', {
  state: () => ({
    allAuditLogs: [],
  }),
  getters: {
    allAuditLogsGetter: (state) => state.allAuditLogs,
  },
  actions: {
    async getAuditLogData() {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/AuditLog/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          const auditLogs = Members.map((log) => {
            const { EventTimestamp, Id, Message, MessageArgs, Oem } = log;
            const [, operation, account, , , address, , result] = MessageArgs;
            return {
              toggleDetails: false,
              auditId: Id,
              operation: operation,
              message: Message,
              account: account || '--',
              date: new Date(EventTimestamp),
              addr: address ? address.split('::ffff:').pop() : '--',
              res: result || '--',
              uri: log['@odata.id'],
              additionalDataUri: Oem.IBM.AdditionalDataFullAuditLogURI,
            };
          });
          this.allAuditLogs = auditLogs;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async downloadLogData(uri) {
      return await api.get(uri).then((response) => {
        return response;
      });
    },
  },
});

export default AuditLogsStore;
