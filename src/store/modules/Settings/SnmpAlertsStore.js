import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const SnmpAlertsStore = defineStore('snmpAlerts', {
  state: () => ({
    allSnmpDetails: [],
  }),
  getters: {
    allSnmpDetailsGetter: (state) => state.allSnmpDetails,
  },
  actions: {
    async getSnmpAlertUrl() {
      return await api
        .get('/redfish/v1/')
        .then((response) => api.get(response.data.EventService['@odata.id']))
        .then((response) => api.get(response.data.Subscriptions['@odata.id']))
        .then((response) => response.data['@odata.id'])
        .catch((error) => console.log('Error', error));
    },
    async getSnmpDetails() {
      const snmpAlertUrl = await this.getSnmpAlertUrl();
      return await api
        .get(snmpAlertUrl)
        .then((response) =>
          response.data.Members.map((user) => user['@odata.id']),
        )
        .then((userIds) => api.all(userIds.map((user) => api.get(user))))
        .then((users) => {
          const snmpDetailsData = users.map((user) => user.data);
          const snmpDetailsDataFiltered = snmpDetailsData.filter(
            (item) => item.SubscriptionType === 'SNMPTrap',
          );
          const finalSNmpData = snmpDetailsDataFiltered.map((singleData) => {
            singleData.isSelected = false;
            return singleData;
          });
          this.allSnmpDetails = finalSNmpData;
        })
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageSnmpAlerts.toast.errorLoadSnmpDetails',
          );
          throw new Error(message);
        });
    },
    async deleteDestination(id) {
      const snmpAlertUrl = await this.getSnmpAlertUrl();
      return await api
        .delete(`${snmpAlertUrl}/${id}`)
        .then(() => this.getSnmpDetails())
        .then(() =>
          i18n.global.t('pageSnmpAlerts.toast.successDeleteDestination', {
            id,
          }),
        )
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageSnmpAlerts.toast.errorDeleteDestination',
            {
              id,
            },
          );
          throw new Error(message);
        });
    },
    async deleteMultipleDestinations(destination) {
      const snmpAlertUrl = await this.getSnmpAlertUrl();
      const promises = destination.map(({ id }) => {
        return api.delete(`${snmpAlertUrl}/${id}`).catch((error) => {
          console.log(error);
          return error;
        });
      });
      return await api
        .all(promises)
        .then((response) => {
          this.getSnmpDetails();
          return response;
        })
        .then(
          api.spread((...responses) => {
            const { successCount, errorCount } = getResponseCount(responses);
            let toastMessages = [];
            if (successCount) {
              const message = i18n.global.t(
                'pageSnmpAlerts.toast.successBatchDelete',
                successCount,
              );
              toastMessages.push({ type: 'success', message });
            }
            if (errorCount) {
              const message = i18n.global.t(
                'pageSnmpAlerts.toast.errorBatchDelete',
                errorCount,
              );
              toastMessages.push({ type: 'error', message });
            }
            return toastMessages;
          }),
        );
    },
    async addDestination({ data }) {
      const snmpAlertUrl = await this.getSnmpAlertUrl();
      return await api
        .post(snmpAlertUrl, data)
        .then(() => this.getSnmpDetails())
        .then(() => i18n.global.t('pageSnmpAlerts.toast.successAddDestination'))
        .catch((error) => {
          console.log(error);
          const message = i18n.global.t(
            'pageSnmpAlerts.toast.errorAddDestination',
          );
          throw new Error(message);
        });
    },
  },
});
export default SnmpAlertsStore;
