import api from '@/store/api';
import i18n from '@/i18n';

const formatedData = (MessageId, Message, MessageArgs) => {
  if (MessageId === 'OpenBMC.0.5.AuditLogUsysConfig') {
    const [, operation, account, , , address, , result] = MessageArgs;

    return {
      operation: operation ? operation.split(':')[0] : '--',
      account: account || '--',
      address: address ? address.split('::ffff:').pop() : '--',
      result: result || '--',
    };
  } else if (MessageId === 'OpenBMC.0.5.AuditLogEntry') {
    const opMatch = Message.match(/op=([^ ]+)/);
    const resMatch = Message.match(/res=([^ ]+)/);
    const addrMatch = Message.match(/addr=([^ ]+)/);
    const accMatch = Message.match(/acc=([^ ]+)/);
    return {
      operation: opMatch ? opMatch[1] : '--',
      result: resMatch ? resMatch[1] : '--',
      address: addrMatch ? addrMatch[1] : '--',
      account: accMatch ? accMatch[1] : '--',
    };
  }
};
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
            const {
              EventTimestamp,
              Id,
              Message,
              MessageArgs,
              MessageId,
              Oem,
            } = log;

            const response = formatedData(MessageId, Message, MessageArgs);
            return {
              id: Id && Id.split(':')[1],
              date: new Date(EventTimestamp),
              operation: response.operation,
              account: response.account,
              addr: response.address,
              res: response.result,
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
      return await api
        .get(uri)
        .then((response) => {
          return response;
        })
        .then(() => {
          const message = [
            i18n.t('pageAuditLogs.toast.successStartDownload'),
            {
              title: i18n.t('pageAuditLogs.toast.successStartDownloadTitle'),
            },
          ];

          return message;
        })
        .catch((error) => {
          console.log(error);
          throw new Error(i18n.t('pageAuditLogs.toast.errorStartDownload'));
        });
    },
  },
};

export default AuditLogsStore;
