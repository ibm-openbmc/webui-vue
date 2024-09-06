import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const CERTIFICATE_TYPES = [
  {
    type: 'HTTPS Certificate',
    location: '/redfish/v1/Managers/bmc/NetworkProtocol/HTTPS/Certificates/',
    label: i18n.global.t('pageCertificates.httpsCertificate'),
    limit: 1,
  },
  {
    type: 'LDAP Certificate',
    location: '/redfish/v1/AccountService/LDAP/Certificates/',
    label: i18n.global.t('pageCertificates.ldapCertificate'),
    limit: 1,
  },
  {
    type: 'TrustStore Certificate',
    location: '/redfish/v1/Managers/bmc/Truststore/Certificates/',
    // Web UI will show 'CA Certificate' instead of
    // 'TrustStore Certificate' after user testing revealed
    // the term 'TrustStore Certificate' wasn't recognized/was unfamilar
    label: i18n.global.t('pageCertificates.caCertificate'),
    limit: 10,
  },
  {
    type: 'ServiceLogin Certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    label: i18n.global.t('pageCertificates.serviceLoginCertificate'),
    limit: 1,
  },
];
const getCertificateProp = (type, prop) => {
  const certificate = CERTIFICATE_TYPES.find(
    (certificate) => certificate.type === type,
  );
  return certificate ? certificate[prop] : null;
};
const convertFileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
export const CertificatesStore = defineStore('certificates', {
  namespaced: true,
  state: () => {
    return {
      allCertificates: [],
      acfCertificate: [],
      availableUploadTypes: [],
    };
  },
  getters: {
    allCertificatesGetter: (state) => state.allCertificates,
    acfCertificateGetter: (state) => state.acfCertificate,
    availableUploadTypesGetter: (state) => state.availableUploadTypes,
  },
  actions: {
    async getAcfCertificate() {
      return await api
        .get('/redfish/v1/AccountService/Accounts/service')
        .then(
          ({
            data: {
              Oem: {
                IBM: { ACF },
              },
            },
          }) => {
            if (ACF.ExpirationDate) {
              var acfCertificate = {
                type: '',
                location: '/redfish/v1/AccountService/Accounts/service',
                certificate: 'ServiceLogin Certificate',
                issuedBy: '',
                issuedTo: '',
                validFrom: '',
                validUntil: new Date(ACF.ExpirationDate),
              };
              this.acfCertificate = [acfCertificate];
            } else {
              this.acfCertificate = [];
            }
          },
        )
        .catch((error) => console.log(error));
    },
    async getCertificates() {
      return await api
        .get('/redfish/v1/CertificateService/CertificateLocations')
        .then(
          ({
            data: {
              Links: { Certificates },
            },
          }) => Certificates.map((certificate) => certificate['@odata.id']),
        )
        .then((certificateLocations) => {
          const promises = certificateLocations.map((location) =>
            api.get(location),
          );
          api.all(promises).then(
            api.spread((...responses) => {
              const certificates = responses.map(({ data }) => {
                const {
                  Name,
                  ValidNotAfter,
                  ValidNotBefore,
                  Issuer = {},
                  Subject = {},
                } = data;
                return {
                  type: Name,
                  location: data['@odata.id'],
                  certificate: getCertificateProp(Name, 'label'),
                  issuedBy: Issuer.CommonName,
                  issuedTo: Subject.CommonName,
                  validFrom: new Date(ValidNotBefore),
                  validUntil: new Date(ValidNotAfter),
                };
              });
              this.allCertificates = certificates;
              this.getAvailableCertificates();
            }),
          );
        });
    },
    async getAvailableCertificates() {
      const availableUploadTypes = [];
      const allCertificates = [...this.acfCertificate, ...this.allCertificates];
      CERTIFICATE_TYPES.map((certificateType) => {
        const certificateCount = allCertificates.filter((certificate) => {
          return (
            certificate.type === certificateType.type ||
            certificate.certificate === certificateType.type
          );
        }).length;
        if (certificateType.limit === certificateCount) {
          return;
        } else {
          availableUploadTypes.push(certificateType);
        }
      });
      this.availableUploadTypes = availableUploadTypes;
    },
    async addNewACFCertificate({ dispatch }, { file, type }) {
      const base64File = await convertFileToBase64(file);
      const fileObj = {
        Oem: {
          IBM: {
            ACF: {
              ACFFile: base64File.split('base64,')[1],
            },
          },
        },
      };
      return await api
        .patch(getCertificateProp(type, 'location'), fileObj, {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        .then(() => {
          dispatch('getAcfCertificate');
          dispatch('getCertificates');
        })
        .then(() => {
          return i18n.global.t('pageCertificates.toast.successAddCertificate', {
            certificate: getCertificateProp(type, 'label'),
          });
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorAddCertificate'),
          );
        });
    },
    async addNewACFCertificateOnLoginPage(_, { file, type }) {
      const base64File = await convertFileToBase64(file);
      const fileObj = {
        Oem: {
          IBM: {
            ACF: {
              ACFFile: base64File.split('base64,')[1],
            },
          },
        },
      };
      return await api
        .patch(getCertificateProp(type, 'location'), fileObj, {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        .then(() =>
          i18n.global.t('pageCertificates.toast.successAddCertificate', {
            certificate: getCertificateProp(type, 'label'),
          }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorAddCertificate'),
          );
        });
    },
    async addNewCertificate({ dispatch }, { file, type }) {
      const typeOfCertificate = getCertificateProp(type, 'label');
      return await api
        .post(getCertificateProp(type, 'location'), file, {
          headers: { 'Content-Type': 'application/x-pem-file' },
        })
        .then(() => dispatch('getCertificates'))
        .then(() => {
          if (typeOfCertificate === 'HTTPS Certificate') {
            return i18n.global.t(
              'pageCertificates.toast.successAddedHTTPCertificate',
              {
                certificate: getCertificateProp(type, 'label'),
              },
            );
          } else {
            return i18n.global.t(
              'pageCertificates.toast.successAddCertificate',
              {
                certificate: getCertificateProp(type, 'label'),
              },
            );
          }
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorAddCertificate'),
          );
        });
    },
    async replaceACFCertificate({ dispatch }, { file, type, location }) {
      const base64File = await convertFileToBase64(file);
      const fileObj = {
        Oem: {
          IBM: {
            ACF: {
              ACFFile: base64File.split('base64,')[1],
            },
          },
        },
      };
      return await api
        .patch(location, fileObj, {
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        .then(() => {
          dispatch('getAcfCertificate');
          dispatch('getCertificates');
        })
        .then(() =>
          i18n.global.t('pageCertificates.toast.successReplaceCertificate', {
            certificate: getCertificateProp(type, 'label'),
          }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
          );
        });
    },
    async replaceCertificate(
      { dispatch },
      { certificateString, location, type },
    ) {
      const data = {};
      data.CertificateString = certificateString;
      data.CertificateType = 'PEM';
      data.CertificateUri = { '@odata.id': location };
      const typeOfCertificate = getCertificateProp(type, 'label');
      return await api
        .post(
          '/redfish/v1/CertificateService/Actions/CertificateService.ReplaceCertificate',
          data,
        )
        .then(() => {
          dispatch('getAcfCertificate');
          dispatch('getCertificates');
        })
        .then(() => {
          if (typeOfCertificate === 'HTTPS Certificate') {
            return i18n.global.t(
              'pageCertificates.toast.successReplacedHTTPCertificate',
              {
                certificate: getCertificateProp(type, 'label'),
              },
            );
          } else {
            return i18n.global.t(
              'pageCertificates.toast.successReplaceCertificate',
              {
                certificate: getCertificateProp(type, 'label'),
              },
            );
          }
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
          );
        });
    },
    async deleteACFCertificate({ dispatch }, { type, location }) {
      const data = {
        Oem: {
          IBM: {
            ACF: {
              ACFFile: '',
            },
          },
        },
      };
      return await api
        .patch(location, data)
        .then(() => dispatch('getCertificates'))
        .then(() =>
          i18n.global.t('pageCertificates.toast.successDeleteCertificate', {
            certificate: getCertificateProp(type, 'label'),
          }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
          );
        });
    },
    async deleteCertificate({ dispatch }, { type, location }) {
      return await api
        .delete(location)
        .then(() => dispatch('getCertificates'))
        .then(() =>
          i18n.global.t('pageCertificates.toast.successDeleteCertificate', {
            certificate: getCertificateProp(type, 'label'),
          }),
        )
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
          );
        });
    },
    async generateCsr(userData) {
      const {
        certificateType,
        country,
        state,
        city,
        companyName,
        companyUnit,
        commonName,
        keyPairAlgorithm,
        keyBitLength,
        keyCurveId,
        contactPerson,
        emailAddress,
        alternateName,
      } = userData;
      const data = {};
      data.CertificateCollection = {
        '@odata.id': getCertificateProp(certificateType, 'location'),
      };
      data.Country = country;
      data.State = state;
      data.City = city;
      data.Organization = companyName;
      data.OrganizationalUnit = companyUnit;
      data.CommonName = commonName;
      data.KeyPairAlgorithm = keyPairAlgorithm;
      data.AlternativeNames = alternateName;
      if (keyCurveId) data.KeyCurveId = keyCurveId;
      if (keyBitLength) data.KeyBitLength = parseInt(keyBitLength);
      if (contactPerson) data.ContactPerson = contactPerson;
      if (emailAddress) data.Email = emailAddress;
      return await api
        .post(
          '/redfish/v1/CertificateService/Actions/CertificateService.GenerateCSR',
          data,
        )
        //TODO: Success response also throws error so
        // can't accurately show legitimate error in UI
        .catch((error) => console.log(error));
    },
  },
});
export default CertificatesStore;
