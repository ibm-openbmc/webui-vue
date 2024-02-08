import api from '@/store/api';

const AuditLogsStore = {
  namespaced: true,
  state: {
    allAuditLogs: [],
  },
  getters: {
    allAuditLogs: (state) => state.allAuditLogs,
  },
  mutations: {
    setAllAuditLogs: (state, allAuditLogs) =>
      (state.allAuditLogs = allAuditLogs),
  },
  actions: {
    async getAuditLogData({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/AuditLog/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          const auditLogs = Members.map((log) => {
            const { EventTimestamp, Id, Message, MessageArgs, Oem } = log;
            const [, operation, account, , , address, , result] = MessageArgs;
            return {
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
          commit('setAllAuditLogs', auditLogs);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async downloadLogData(_, uri) {
      return await api.get(uri).then((response) => {
        return response;
      });
    },
  },
};

export default AuditLogsStore;
