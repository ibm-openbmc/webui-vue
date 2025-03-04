import { defineStore } from 'pinia';
import api from '@/store/api';

export const PostCodeLogsStore = defineStore('postCodeLogs', {
  state: () => ({
    allPostCodes: [],
  }),
  getters: {
    allPostCodesGetter: (state) => state.allPostCodes,
  },
  actions: {
    async getPostCodesLogData() {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/PostCodes/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          Members = Members.filter((log) => log.MessageArgs[3] !== '00000000');
          const postCodeLogs = Members.map((log) => {
            const { Created, MessageArgs, AdditionalDataURI } = log;
            return {
              toggleDetails: false,
              date: new Date(Created),
              bootCount: MessageArgs[0],
              timeStampOffset: MessageArgs[1],
              postCode: MessageArgs[3],
              uri: AdditionalDataURI,
            };
          });
          this.allPostCodes = postCodeLogs;
        })
        .catch((error) => {
          console.log('POST Codes Log Data:', error);
        });
    },
  },
});

export default PostCodeLogsStore;
