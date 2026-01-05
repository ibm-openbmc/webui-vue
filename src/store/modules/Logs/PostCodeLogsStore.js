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
          Members = Members.filter(
            (log) => log.MessageArgs[2] !== '0x3030303030303030',
          );
          const postCodeLogs = Members.map((log) => {
            const { Created, MessageArgs, AdditionalDataURI } = log;
            let asciiString = '';
            let hexString = MessageArgs[2];
            for (let i = 0; i < hexString.length; i += 2) {
              const hexPair = hexString.substring(i, i + 2);
              const decimalValue = parseInt(hexPair, 16);
              asciiString += String.fromCharCode(decimalValue);
            }
            return {
              toggleDetails: false,
              date: new Date(Created),
              bootCount: MessageArgs[0],
              timeStampOffset: MessageArgs[1],
              postCode: asciiString,
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
