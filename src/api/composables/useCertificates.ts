import { computed, ref } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import type { UseQueryOptions } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import { useRedfishResource } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

// Type definitions
export interface CertificateType {
  type: string;
  location: string;
  labelKey: string;
  limit: number;
}

export interface Certificate {
  type: string;
  location: string;
  certificate: string;
  issuedBy: string;
  issuedTo: string;
  validFrom: Date;
  validUntil: Date;
}

export interface ACFCertificate {
  type: string;
  location: string;
  certificate: string;
  issuedBy: string;
  issuedTo: string;
  validFrom: string;
  validUntil: Date;
}

interface ServiceAccountResource extends Resource {
  Oem?: {
    IBM?: {
      ACF?: {
        ExpirationDate?: string;
        ACFFile?: string;
      };
    };
  };
}

interface CertificateLocationsResource extends Resource {
  Links?: {
    Certificates?: Array<{ '@odata.id': string }>;
  };
}

interface CertificateResource extends Resource {
  Name: string;
  ValidNotAfter: string;
  ValidNotBefore: string;
  Issuer?: {
    CommonName?: string;
  };
  Subject?: {
    CommonName?: string;
  };
}

export const CERTIFICATE_TYPES: CertificateType[] = [
  {
    type: 'HTTPS Certificate',
    location: '/redfish/v1/Managers/bmc/NetworkProtocol/HTTPS/Certificates/',
    labelKey: 'pageCertificates.httpsCertificate',
    limit: 1,
  },
  {
    type: 'LDAP Certificate',
    location: '/redfish/v1/AccountService/LDAP/Certificates/',
    labelKey: 'pageCertificates.ldapCertificate',
    limit: 1,
  },
  {
    type: 'TrustStore Certificate',
    location: '/redfish/v1/Managers/bmc/Truststore/Certificates/',
    labelKey: 'pageCertificates.caCertificate',
    limit: 10,
  },
  {
    type: 'ServiceLogin Certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    labelKey: 'pageCertificates.serviceLoginCertificate',
    limit: 1,
  },
  {
    type: 'BMC shell ACF certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    labelKey: 'pageCertificates.bmcShell',
    limit: 100,
  },
  {
    type: 'Resource dump ACF certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    labelKey: 'pageCertificates.resourceDump',
    limit: 100,
  },
  {
    type: 'Admin reset certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    labelKey: 'pageCertificates.adminResetCertificate',
    limit: 100,
  },
];

const getCertificateProp = (type: string, prop: keyof CertificateType) => {
  const certificate = CERTIFICATE_TYPES.find((cert) => cert.type === type);
  if (!certificate) return null;

  if (prop === 'labelKey') {
    return i18n.global.t(certificate.labelKey);
  }
  return certificate[prop];
};

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

/**
 * Composable for Certificates page operations
 * Replaces CertificatesStore with vue-query
 */
export function useCertificates() {
  const queryClient = useQueryClient();

  // Fetch ACF Certificate
  const acfQuery = useRedfishResource<ServiceAccountResource>(
    '/redfish/v1/AccountService/Accounts/service',
    {
      queryConfig: RedfishQueryPresets.sensors as Partial<
        UseQueryOptions<ServiceAccountResource>
      >,
    },
  );

  const acfCertificate = computed<ACFCertificate[]>(() => {
    const data = acfQuery.data.value;
    if (!data?.Oem?.IBM?.ACF?.ExpirationDate) {
      return [];
    }

    return [
      {
        type: '',
        location: '/redfish/v1/AccountService/Accounts/service',
        certificate: 'ServiceLogin Certificate',
        issuedBy: '',
        issuedTo: '',
        validFrom: '',
        validUntil: new Date(data.Oem.IBM.ACF.ExpirationDate),
      },
    ];
  });

  // Fetch Certificate Locations and all certificates
  const certificatesQuery = useQuery({
    queryKey: ['redfish', 'certificates', 'all'],
    queryFn: async (): Promise<Certificate[]> => {
      // Get certificate locations
      const locationsResponse = await api.get<CertificateLocationsResource>(
        '/redfish/v1/CertificateService/CertificateLocations',
      );

      const certificateLocations =
        locationsResponse.data.Links?.Certificates?.map(
          (cert) => cert['@odata.id'],
        ) || [];

      if (certificateLocations.length === 0) {
        return [];
      }

      // Fetch all certificates
      const responses = await Promise.all(
        certificateLocations.map((location) =>
          api.get<CertificateResource>(location),
        ),
      );

      return responses.map(({ data }) => ({
        type: data.Name,
        location: data['@odata.id'],
        certificate: data.Name,
        issuedBy: data.Issuer?.CommonName || '',
        issuedTo: data.Subject?.CommonName || '',
        validFrom: new Date(data.ValidNotBefore),
        validUntil: new Date(data.ValidNotAfter),
      }));
    },
    ...RedfishQueryPresets.sensors,
  });

  // Combined certificates
  const allCertificates = computed<(Certificate | ACFCertificate)[]>(() => {
    const acf = acfCertificate.value;
    const others = certificatesQuery.data.value || [];
    return [...acf, ...others];
  });

  // Available upload types
  const availableUploadTypes = computed(() => {
    const available: CertificateType[] = [];
    const all = allCertificates.value;

    CERTIFICATE_TYPES.forEach((certType) => {
      const count = all.filter(
        (cert) =>
          cert.type === certType.type || cert.certificate === certType.type,
      ).length;

      if (certType.limit !== count) {
        available.push(certType);
      }
    });

    return available;
  });

  const isLoading = computed(
    () => acfQuery.isLoading.value || certificatesQuery.isLoading.value,
  );

  const isFetching = computed(
    () => acfQuery.isFetching.value || certificatesQuery.isFetching.value,
  );

  // Refetch all certificates
  const refetchAll = async () => {
    await Promise.all([acfQuery.refetch(), certificatesQuery.refetch()]);
  };

  // Mutations for certificate operations

  // Add new ACF certificate
  const addNewACFCertificateMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: string;
    }): Promise<string> => {
      try {
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

        await api.patch(getCertificateProp(type, 'location'), fileObj, {
          headers: { 'Content-Type': 'application/json' },
        });

        return i18n.global.t('pageCertificates.toast.successAddCertificate', {
          certificate: getCertificateProp(type, 'labelKey'),
        });
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorAddCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'resource',
          '/redfish/v1/AccountService/Accounts/service',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Add new certificate (non-ACF)
  const addNewCertificateMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: string;
    }): Promise<string> => {
      try {
        await api.post(getCertificateProp(type, 'location'), file, {
          headers: { 'Content-Type': 'application/x-pem-file' },
        });

        const typeLabel = getCertificateProp(type, 'labelKey');
        if (typeLabel === 'HTTPS Certificate') {
          return i18n.global.t(
            'pageCertificates.toast.successAddedHTTPCertificate',
            {
              certificate: typeLabel,
            },
          );
        }

        return i18n.global.t('pageCertificates.toast.successAddCertificate', {
          certificate: typeLabel,
        });
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorAddCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Replace ACF certificate
  const replaceACFCertificateMutation = useMutation({
    mutationFn: async ({
      file,
      type,
      location,
    }: {
      file: File;
      type: string;
      location: string;
    }): Promise<string> => {
      try {
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

        await api.patch(location, fileObj, {
          headers: { 'Content-Type': 'application/json' },
        });

        return i18n.global.t(
          'pageCertificates.toast.successReplaceCertificate',
          {
            certificate: getCertificateProp(type, 'labelKey'),
          },
        );
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'resource',
          '/redfish/v1/AccountService/Accounts/service',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Replace certificate (non-ACF)
  const replaceCertificateMutation = useMutation({
    mutationFn: async ({
      certificateString,
      type,
      location,
    }: {
      certificateString: string;
      type: string;
      location: string;
    }): Promise<string> => {
      try {
        const data = {
          CertificateString: certificateString,
          CertificateType: 'PEM',
          CertificateUri: { '@odata.id': location },
        };

        await api.post(
          '/redfish/v1/CertificateService/Actions/CertificateService.ReplaceCertificate',
          data,
        );

        const typeLabel = getCertificateProp(type, 'labelKey');
        if (typeLabel === 'HTTPS Certificate') {
          return i18n.global.t(
            'pageCertificates.toast.successReplacedHTTPCertificate',
            {
              certificate: typeLabel,
            },
          );
        }

        return i18n.global.t(
          'pageCertificates.toast.successReplaceCertificate',
          {
            certificate: typeLabel,
          },
        );
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'resource',
          '/redfish/v1/AccountService/Accounts/service',
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Delete ACF certificate
  const deleteACFCertificateMutation = useMutation({
    mutationFn: async ({
      type,
      location,
    }: {
      type: string;
      location: string;
    }): Promise<string> => {
      try {
        const data = {
          Oem: {
            IBM: {
              ACF: {
                ACFFile: '',
              },
            },
          },
        };

        await api.patch(location, data);

        return i18n.global.t(
          'pageCertificates.toast.successDeleteCertificate',
          {
            certificate: getCertificateProp(type, 'labelKey'),
          },
        );
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Delete certificate (non-ACF)
  const deleteCertificateMutation = useMutation({
    mutationFn: async ({
      type,
      location,
    }: {
      type: string;
      location: string;
    }): Promise<string> => {
      try {
        await api.delete(location);

        return i18n.global.t(
          'pageCertificates.toast.successDeleteCertificate',
          {
            certificate: getCertificateProp(type, 'labelKey'),
          },
        );
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificates', 'all'],
      });
    },
  });

  // Generate CSR
  const generateCsrMutation = useMutation({
    mutationFn: async (userData: {
      certificateType: string;
      country: string;
      state: string;
      city: string;
      companyName: string;
      companyUnit: string;
      commonName: string;
      keyPairAlgorithm: string;
      keyBitLength?: string;
      keyCurveId?: string;
      contactPerson?: string;
      emailAddress?: string;
      alternateName: string;
    }): Promise<any> => {
      try {
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

        const data: any = {
          CertificateCollection: {
            '@odata.id': getCertificateProp(certificateType, 'location'),
          },
          Country: country,
          State: state,
          City: city,
          Organization: companyName,
          OrganizationalUnit: companyUnit,
          CommonName: commonName,
          KeyPairAlgorithm: keyPairAlgorithm,
          AlternativeNames: alternateName,
        };

        if (keyCurveId) data.KeyCurveId = keyCurveId;
        if (keyBitLength) data.KeyBitLength = parseInt(keyBitLength);
        if (contactPerson) data.ContactPerson = contactPerson;
        if (emailAddress) data.Email = emailAddress;

        return await api.post(
          '/redfish/v1/CertificateService/Actions/CertificateService.GenerateCSR',
          data,
        );
      } catch (error) {
        console.error(error);
        throw new Error(
          i18n.global.t('pageCertificates.toast.errorGenerateCsr'),
        );
      }
    },
  });

  // Wrapper functions for backward compatibility
  async function addNewACFCertificate({
    file,
    type,
  }: {
    file: File;
    type: string;
  }): Promise<string> {
    return await addNewACFCertificateMutation.mutateAsync({ file, type });
  }

  async function addNewCertificate({
    file,
    type,
  }: {
    file: File;
    type: string;
  }): Promise<string> {
    return await addNewCertificateMutation.mutateAsync({ file, type });
  }

  async function replaceACFCertificate({
    file,
    type,
    location,
  }: {
    file: File;
    type: string;
    location: string;
  }): Promise<string> {
    return await replaceACFCertificateMutation.mutateAsync({
      file,
      type,
      location,
    });
  }

  async function replaceCertificate({
    certificateString,
    type,
    location,
  }: {
    certificateString: string;
    type: string;
    location: string;
  }): Promise<string> {
    return await replaceCertificateMutation.mutateAsync({
      certificateString,
      type,
      location,
    });
  }

  async function deleteACFCertificate({
    type,
    location,
  }: {
    type: string;
    location: string;
  }): Promise<string> {
    return await deleteACFCertificateMutation.mutateAsync({ type, location });
  }

  async function deleteCertificate({
    type,
    location,
  }: {
    type: string;
    location: string;
  }): Promise<string> {
    return await deleteCertificateMutation.mutateAsync({ type, location });
  }

  async function generateCsr(userData: any): Promise<any> {
    return await generateCsrMutation.mutateAsync(userData);
  }

  return {
    // State
    acfCertificate,
    allCertificates: certificatesQuery.data,
    certificates: allCertificates,
    availableUploadTypes,
    // Loading
    isLoading,
    isFetching,
    // Refetch
    refetchAll,
    // Mutations
    addNewACFCertificate,
    addNewCertificate,
    replaceACFCertificate,
    replaceCertificate,
    deleteACFCertificate,
    deleteCertificate,
    generateCsr,
  };
}
