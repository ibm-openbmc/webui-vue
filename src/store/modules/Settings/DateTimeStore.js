import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const DateTimeStore = defineStore('dateTime', {
  state: () => ({
    ntpServers: [],
    isNtpProtocolEnabled: null,
    networkSuppliedServers: [],
  }),
  getters: {
    ntpServersGetter: (state) => state.ntpServers,
    isNtpProtocolEnabledGetter: (state) => state.isNtpProtocolEnabled,
    networkSuppliedServersGetter: (state) => state.networkSuppliedServers,
  },
  actions: {
    async getNtpData() {
      return await api
        .get('/redfish/v1/Managers/bmc/NetworkProtocol')
        .then((response) => {
          const ntpServers = response.data.NTP.NTPServers;
          const isNtpProtocolEnabled = response.data.NTP.ProtocolEnabled;
          const networkSuppliedServers =
            response?.data?.NTP?.NetworkSuppliedServers;
          this.ntpServers = ntpServers;
          this.isNtpProtocolEnabled = isNtpProtocolEnabled;
          this.networkSuppliedServers = networkSuppliedServers;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async updateDateTime(dateTimeForm) {
      const ntpData = {
        NTP: {
          ProtocolEnabled: dateTimeForm.ntpProtocolEnabled,
        },
      };
      if (dateTimeForm.ntpProtocolEnabled) {
        ntpData.NTP.NTPServers = dateTimeForm.ntpServersArray;
      }
      return await api
        .patch(`/redfish/v1/Managers/bmc/NetworkProtocol`, ntpData)
        .then(async () => {
          if (!dateTimeForm.ntpProtocolEnabled) {
            const dateTimeData = {
              DateTime: dateTimeForm.updatedDateTime,
            };
            /**
             * https://github.com/openbmc/phosphor-time-manager/blob/master/README.md#special-note-on-changing-ntp-setting
             * When time mode is initially set to Manual from NTP,
             * NTP service is disabled and the NTP service is
             * stopping but not stopped, setting time will return an error.
             * There are no responses from backend to notify when NTP is stopped.
             * To work around, a timeout is set to allow NTP to fully stop
             * TODO: remove timeout if backend solves
             * https://github.com/openbmc/openbmc/issues/3459
             */
            const timeoutVal = this.isNtpProtocolEnabled ? 20000 : 0;
            return await new Promise((resolve, reject) => {
              setTimeout(() => {
                return api
                  .patch(`/redfish/v1/Managers/bmc`, dateTimeData)
                  .then(() => resolve())
                  .catch(() => reject());
              }, timeoutVal);
            });
          }
        })
        .then(() => {
          if (dateTimeForm.ntpProtocolEnabled) {
            return i18n.global.t(
              'pageDateTime.toast.successSaveDateTimeForNtpServer',
            );
          } else {
            return i18n.global.t('pageDateTime.toast.successSaveDateTime');
          }
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageDateTime.toast.errorSaveDateTime'),
          );
        });
    },
  },
});

export default DateTimeStore;
