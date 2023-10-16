import api from '@/store/api';
import i18n from '@/i18n';

const DeconfigurationRecordsStore = {
  namespaced: true,
  state: {
    deconfigRecords: [],
  },
  getters: {
    deconfigRecords: (state) => state.deconfigRecords,
  },
  mutations: {
    setDeconfigurationRecordInfo: (state, deconfigRecords) =>
      (state.deconfigRecords = deconfigRecords),
  },
  actions: {
    async getDeconfigurationRecordInfo({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/LogServices/HardwareIsolation/Entries')
        .then(async ({ data: { Members = [] } = {} }) => {
          const allMembers = await api.all(
            Members.map(async (member) => {
              const arrayNumber = Number(
                member?.Links?.OriginOfCondition?.['@odata.id'].split('/').pop()
              );
              const uri = member?.Links?.OriginOfCondition?.['@odata.id']
                .split('/SubProcessors')
                .shift();
              await api.get(uri).then(async ({ data }) => {
                if (data?.Location) {
                  member.LocationCode =
                    data?.Location?.PartLocation?.ServiceLabel;
                } else {
                  const tpmObject = data.Assemblies.filter((member) => {
                    return (
                      member['@odata.id'] ==
                      `/redfish/v1/Chassis/chassis/Assembly#/Assemblies/${arrayNumber}`
                    );
                  })[0];
                  member.LocationCode =
                    tpmObject?.Location?.PartLocation?.ServiceLabel;
                }
              });
              return member;
            })
          );

          const deconfigRecords = await api.all(
            allMembers.map(async (log) => {
              const {
                Id,
                Severity,
                Created,
                Message,
                Name,
                AdditionalDataURI,
                AdditionalData = AdditionalDataURI
                  ? await api
                      .get(AdditionalDataURI.split('/attachment').shift())
                      .then(async ({ data }) => await data)
                  : null,
                LocationCode,
              } = log;
              let eventId = '';
              const additionalDataURIValue = log.AdditionalDataURI;
              if (additionalDataURIValue) {
                const splitUrl = additionalDataURIValue.split('/');
                eventId = splitUrl[splitUrl.length - 2];
              }
              return {
                additionalDataUri: AdditionalDataURI,
                date: new Date(Created),
                description: Message,
                filterByStatus: AdditionalData?.Resolved
                  ? 'Resolved'
                  : 'Unresolved',
                oemPelAttachment: `${AdditionalData?.['@odata.id']}/OemPelAttachment`,
                id: Id,
                name: Name,
                srcDetails: AdditionalData?.EventId,
                status: AdditionalData?.Resolved, //true or false
                uri: log['@odata.id'],
                severity: Severity,
                location: LocationCode,
                EventID: eventId,
              };
            })
          );
          commit('setDeconfigurationRecordInfo', deconfigRecords);
        })
        .catch((error) => console.log(error));
    },
    async clearAllEntries({ dispatch }, data) {
      return await api
        .post(
          '/redfish/v1/Systems/system/LogServices/HardwareIsolation/Actions/LogService.ClearLog'
        )
        .then(() => dispatch('getDeconfigurationRecordInfo'))
        .then(() =>
          i18n.tc('pageDeconfigurationRecords.toast.successDelete', data.length)
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.tc('pageDeconfigurationRecords.toast.errorDelete', data.length)
          );
        });
    },
    async downloadLog(_, { uri }) {
      let date = new Date();
      date =
        date.toISOString().slice(0, 10) +
        '_' +
        date.toString().split(':').join('-').split(' ')[4];

      const fileName = `attachment_${date}`;

      return await api
        .get(uri)
        .then(({ data }) => {
          const pelJsonInfo = data?.Oem?.IBM?.PelJson;

          const element = document.createElement('a');
          element.setAttribute(
            'href',
            `data:text/plain;charset=utf-8,${encodeURIComponent(pelJsonInfo)}`
          );
          element.setAttribute('download', fileName);
          element.style.display = 'none';
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
        })
        .then(() => {
          const message = [
            i18n.t('pageDeconfigurationRecords.toast.successStartDownload'),
            {
              title: i18n.t(
                'pageDeconfigurationRecords.toast.successStartDownloadTitle'
              ),
            },
          ];

          return message;
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageDeconfigurationRecords.toast.errorStartDownload')
          );
        });
    },
  },
};

export default DeconfigurationRecordsStore;
