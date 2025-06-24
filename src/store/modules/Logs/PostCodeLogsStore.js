import api from '@/store/api';

const PostCodeLogsStore = {
  namespaced: true,
  state: {
    allPostCodes: [],
  },
  getters: {
    allPostCodes: (state) => state.allPostCodes,
  },
  mutations: {
    setAllPostCodes: (state, allPostCodes) =>
      (state.allPostCodes = allPostCodes),
  },
  actions: {
    async getPostCodesLogData({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/PostCodes/Entries')
        .then(({ data: { Members = [] } = {} }) => {
          Members = Members.filter((log) => log.MessageArgs[3] !== '00000000');
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
              date: new Date(Created),
              bootCount: MessageArgs[0],
              timeStampOffset: MessageArgs[1],
              postCode: asciiString,
              uri: AdditionalDataURI,
            };
          });
          commit('setAllPostCodes', postCodeLogs);
        })
        .catch((error) => {
          console.log('POST Codes Log Data:', error);
        });
    },
  },
};

export default PostCodeLogsStore;
