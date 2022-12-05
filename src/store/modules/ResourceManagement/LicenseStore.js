import api from '@/store/api';
import i18n from '@/i18n';

const parseData = (data) => {
  const [resourceId = '--', sequenceNumber = '--'] =
    data?.SerialNumber?.split('-') || '';
  const expirationDate = data?.ExpirationDate
    ? new Date(data.ExpirationDate)
    : '--';
  const licensed = data?.LicenseScope?.MaxNumberOfDevices || '--';

  return {
    licensed,
    resourceId,
    sequenceNumber,
    expirationDate,
  };
};

const LicenseStore = {
  namespaced: true,
  state: {
    licenses: {},
  },
  getters: {
    licenses: (state) => state.licenses,
    vetCapabilities: (state) =>
      Object.values(state.licenses).filter((license) => {
        return (
          license.Name !== 'AIX Update Access Key' &&
          license.Name !== 'Asset Protection Machine ID' &&
          license.Name !== 'Asset Protection Public Key' &&
          license.Name !== 'Elastic MemoryGB*Days Available' &&
          license.Name !== 'Elastic Processor*Days Available' &&
          license.Name !== 'Trial Memory Licenses (GB)' &&
          license.Name !== 'Permanent Memory Licenses (GB)' &&
          license.Name !== 'Permanent Processor Licenses' &&
          license.Name !== 'Firmware Update Access Key' &&
          license.Name !== 'Virtualization Engine Technology' &&
          license.Name !== 'Trial Processor Licenses' &&
          license.Name !== 'P05 Virtual Tier' &&
          license.Name !== 'P10 Virtual Tier' &&
          license.Name !== 'P20 Virtual Tier' &&
          license.Name !== 'P30 Virtual Tier' &&
          license.Name !== 'System Anchor'
        );
      }),
    processorInfo: (state) => parseData(state.licenses.PermProcs),
    memoryInfo: (state) => parseData(state.licenses.PermMem),
    firmwareAccessKeyInfo: (state) => parseData(state.licenses.UAK),
    aixAccessKeyInfo: (state) => parseData(state.licenses.AIXUAK),
  },
  mutations: {
    setLicenses: (state, licenses) => (state.licenses = licenses),
  },
  actions: {
    async getLicenses({ commit }) {
      return await api
        .get('/redfish/v1/LicenseService/Licenses')
        .then(({ data: { Members = [] } }) => {
          return Members.map((member) => api.get(member['@odata.id']));
        })
        .then((promises) => api.all(promises))
        .then((response) => {
          const data = response.reduce((acc, { data }) => {
            acc[data.Id] = data;
            return acc;
          }, {});
          commit('setLicenses', data);
        })
        .catch((error) => {
          console.log('Licenses', error);
        });
    },
    async activateLicense(_, licenseKey) {
      return await api
        .post('/redfish/v1/LicenseService/Licenses', {
          LicenseString: licenseKey,
        })
        .then(() => {
          return i18n.t('pageCapacityOnDemand.activation.toast.success');
        })
        .catch((error) => {
          console.log('Licenses', error);
          throw new Error(
            i18n.t('pageCapacityOnDemand.activation.toast.error')
          );
        });
    },
  },
};

export default LicenseStore;
