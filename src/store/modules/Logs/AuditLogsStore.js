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
            const { EventTimestamp, Id, MessageArgs, MessageId, Oem } = log;
            const [, operation, account, , , address, , result] = MessageArgs;
            return {
              id: Id && Id.split(':')[1],
              date: new Date(EventTimestamp),
              operation: operation ? operation.split(':')[0] : '--',
              account: account || '--',
              addr: address ? address.split('::ffff:').pop() : '--',
              res: result || '--',
              messageId: MessageId && MessageId.split('OpenBMC.0.5.').pop(),
              uri: log['@odata.id'],
              additionalDataUri: Oem.IBM.AdditionalDataFullAuditLogURI,
            };
          });
          commit('setAllAuditLogs', auditLogs);
        })
        .catch((error) => {
          console.log('Audit Log Data:', error);
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
