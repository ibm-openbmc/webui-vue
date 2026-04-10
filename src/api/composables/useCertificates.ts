import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n is a JS module
import i18n from '@/i18n';

export interface CertificateType {
  type: string;
  location: string;
  label: string;
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

interface CertificateLocationResponse {
  Links?: {
    Certificates?: Array<{ '@odata.id': string }>;
  };
}

interface CertificateResponse {
  Name?: string;
  ValidNotAfter?: string;
  ValidNotBefore?: string;
  Issuer?: {
    CommonName?: string;
  };
  Subject?: {
    CommonName?: string;
  };
  '@odata.id'?: string;
}

interface ServiceAccountResponse {
  Oem?: {
    IBM?: {
      ACF?: {
        ExpirationDate?: string;
      };
    };
  };
}

export const CERTIFICATE_TYPES: CertificateType[] = [
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
    label: i18n.global.t('pageCertificates.caCertificate'),
    limit: 10,
  },
  {
    type: 'ServiceLogin Certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    label: i18n.global.t('pageCertificates.serviceLoginCertificate'),
    limit: 1,
  },
  {
    type: 'BMC shell ACF certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    label: i18n.global.t('pageCertificates.bmcShell'),
    limit: 100,
  },
  {
    type: 'Resource dump ACF certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    label: i18n.global.t('pageCertificates.resourceDump'),
    limit: 100,
  },
  {
    type: 'Admin reset certificate',
    location: '/redfish/v1/AccountService/Accounts/service',
    label: i18n.global.t('pageCertificates.adminResetCertificate'),
    limit: 100,
  },
];

const getCertificateProp = (type: string, prop: keyof CertificateType): any => {
  const certificate = CERTIFICATE_TYPES.find((cert) => cert.type === type);
  return certificate ? certificate[prop] : null;
};

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

/**
 * Composable for Certificates page - uses VueQuery
 * Provides certificate-specific computed properties and methods
 */
export function useCertificates() {
  const queryClient = useQueryClient();

  // Fetch ACF Certificate
  const {
    data: acfCertificateData,
    isFetching: isFetchingAcf,
    refetch: refetchAcf,
  } = useQuery({
    queryKey: ['redfish', 'accountService', 'service', 'acfCertificate'],
    queryFn: async (): Promise<ACFCertificate[]> => {
      const response = await api.get<ServiceAccountResponse>(
        '/redfish/v1/AccountService/Accounts/service',
      );
      const expirationDate = response.data?.Oem?.IBM?.ACF?.ExpirationDate;

      if (expirationDate) {
        return [
          {
            type: '',
            location: '/redfish/v1/AccountService/Accounts/service',
            certificate: 'ServiceLogin Certificate',
            issuedBy: '',
            issuedTo: '',
            validFrom: '',
            validUntil: new Date(expirationDate),
          },
        ];
      }
      return [];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch all certificates
  const {
    data: certificatesData,
    isFetching: isFetchingCertificates,
    isError,
    error,
    refetch: refetchCertificates,
  } = useQuery({
    queryKey: ['redfish', 'certificateService', 'certificates'],
    queryFn: async (): Promise<Certificate[]> => {
      const response = await api.get<CertificateLocationResponse>(
        '/redfish/v1/CertificateService/CertificateLocations',
      );
      const certificateLocations =
        response.data?.Links?.Certificates?.map((cert) => cert['@odata.id']) ||
        [];

      const promises = certificateLocations.map((location) =>
        api.get<CertificateResponse>(location),
      );
      const responses = await Promise.all(promises);

      return responses.map(({ data }) => {
        const {
          Name = '',
          ValidNotAfter = '',
          ValidNotBefore = '',
          Issuer = {},
          Subject = {},
        } = data;

        return {
          type: Name,
          location: data['@odata.id'] || '',
          certificate: getCertificateProp(Name, 'label') || Name,
          issuedBy: Issuer.CommonName || '',
          issuedTo: Subject.CommonName || '',
          validFrom: new Date(ValidNotBefore),
          validUntil: new Date(ValidNotAfter),
        };
      });
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Computed: All certificates
  const acfCertificate = computed(() => acfCertificateData.value || []);
  const allCertificates = computed(() => certificatesData.value || []);

  // Computed: Combined certificates
  const certificates = computed(() => [
    ...acfCertificate.value,
    ...allCertificates.value,
  ]);

  // Computed: Available upload types
  const availableUploadTypes = computed(() => {
    const available: CertificateType[] = [];
    const allCerts = certificates.value;

    CERTIFICATE_TYPES.forEach((certificateType) => {
      const certificateCount = allCerts.filter((certificate) => {
        return (
          certificate.type === certificateType.type ||
          certificate.certificate === certificateType.type
        );
      }).length;

      if (certificateType.limit !== certificateCount) {
        available.push(certificateType);
      }
    });

    return available;
  });

  // Computed: Loading state
  const isFetching = computed(
    () => isFetchingAcf.value || isFetchingCertificates.value,
  );

  // Mutation: Add new ACF certificate
  const addNewACFCertificateMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: string;
    }): Promise<string> => {
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
        certificate: getCertificateProp(type, 'label'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'accountService', 'service', 'acfCertificate'],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Add ACF certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorAddCertificate'),
      );
    },
  });

  // Mutation: Add new ACF certificate on login page
  const addNewACFCertificateOnLoginPageMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: string;
    }): Promise<string> => {
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
        certificate: getCertificateProp(type, 'label'),
      });
    },
    onError: (error) => {
      console.log('Add ACF certificate on login error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorAddCertificate'),
      );
    },
  });

  // Mutation: Add new certificate
  const addNewCertificateMutation = useMutation({
    mutationFn: async ({
      file,
      type,
    }: {
      file: File;
      type: string;
    }): Promise<string> => {
      await api.post(getCertificateProp(type, 'location'), file, {
        headers: { 'Content-Type': 'application/x-pem-file' },
      });

      const typeOfCertificate = getCertificateProp(type, 'label');
      if (typeOfCertificate === 'HTTPS Certificate') {
        return i18n.global.t(
          'pageCertificates.toast.successAddedHTTPCertificate',
          {
            certificate: getCertificateProp(type, 'label'),
          },
        );
      } else {
        return i18n.global.t('pageCertificates.toast.successAddCertificate', {
          certificate: getCertificateProp(type, 'label'),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Add certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorAddCertificate'),
      );
    },
  });

  // Mutation: Replace ACF certificate
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

      return i18n.global.t('pageCertificates.toast.successReplaceCertificate', {
        certificate: getCertificateProp(type, 'label'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'accountService', 'service', 'acfCertificate'],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Replace ACF certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
      );
    },
  });

  // Mutation: Replace certificate
  const replaceCertificateMutation = useMutation({
    mutationFn: async ({
      certificateString,
      location,
      type,
    }: {
      certificateString: string;
      location: string;
      type: string;
    }): Promise<string> => {
      const data = {
        CertificateString: certificateString,
        CertificateType: 'PEM',
        CertificateUri: { '@odata.id': location },
      };

      await api.post(
        '/redfish/v1/CertificateService/Actions/CertificateService.ReplaceCertificate',
        data,
      );

      const typeOfCertificate = getCertificateProp(type, 'label');
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'accountService', 'service', 'acfCertificate'],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Replace certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorReplaceCertificate'),
      );
    },
  });

  // Mutation: Delete ACF certificate
  const deleteACFCertificateMutation = useMutation({
    mutationFn: async ({
      type,
      location,
    }: {
      type: string;
      location: string;
    }): Promise<string> => {
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

      return i18n.global.t('pageCertificates.toast.successDeleteCertificate', {
        certificate: getCertificateProp(type, 'label'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Delete ACF certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
      );
    },
  });

  // Mutation: Delete certificate
  const deleteCertificateMutation = useMutation({
    mutationFn: async ({
      type,
      location,
    }: {
      type: string;
      location: string;
    }): Promise<string> => {
      await api.delete(location);

      return i18n.global.t('pageCertificates.toast.successDeleteCertificate', {
        certificate: getCertificateProp(type, 'label'),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'certificateService', 'certificates'],
      });
    },
    onError: (error) => {
      console.log('Delete certificate error:', error);
      throw new Error(
        i18n.global.t('pageCertificates.toast.errorDeleteCertificate'),
      );
    },
  });

  // Mutation: Generate CSR
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
      alternateName?: string[];
    }): Promise<any> => {
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

      const response = await api.post(
        '/redfish/v1/CertificateService/Actions/CertificateService.GenerateCSR',
        data,
      );

      return response.data;
    },
    onError: (error) => {
      console.log('Generate CSR error:', error);
      throw new Error(i18n.global.t('pageCertificates.toast.errorGenerateCsr'));
    },
  });

  // Helper functions
  const addNewACFCertificate = async (params: {
    file: File;
    type: string;
  }): Promise<string> => {
    return addNewACFCertificateMutation.mutateAsync(params);
  };

  const addNewACFCertificateOnLoginPage = async (params: {
    file: File;
    type: string;
  }): Promise<string> => {
    return addNewACFCertificateOnLoginPageMutation.mutateAsync(params);
  };

  const addNewCertificate = async (params: {
    file: File;
    type: string;
  }): Promise<string> => {
    return addNewCertificateMutation.mutateAsync(params);
  };

  const replaceACFCertificate = async (params: {
    file: File;
    type: string;
    location: string;
  }): Promise<string> => {
    return replaceACFCertificateMutation.mutateAsync(params);
  };

  const replaceCertificate = async (params: {
    certificateString: string;
    location: string;
    type: string;
  }): Promise<string> => {
    return replaceCertificateMutation.mutateAsync(params);
  };

  const deleteACFCertificate = async (params: {
    type: string;
    location: string;
  }): Promise<string> => {
    return deleteACFCertificateMutation.mutateAsync(params);
  };

  const deleteCertificate = async (params: {
    type: string;
    location: string;
  }): Promise<string> => {
    return deleteCertificateMutation.mutateAsync(params);
  };

  const generateCsr = async (userData: any): Promise<any> => {
    return generateCsrMutation.mutateAsync(userData);
  };

  return {
    // Data
    acfCertificate,
    allCertificates,
    certificates,
    availableUploadTypes,

    // Loading and error states
    isFetching,
    isError,
    error,

    // Refetch
    refetchAcf,
    refetchCertificates,

    // Mutations
    addNewACFCertificate,
    addNewACFCertificateOnLoginPage,
    addNewCertificate,
    replaceACFCertificate,
    replaceCertificate,
    deleteACFCertificate,
    deleteCertificate,
    generateCsr,

    // Mutation states
    isAdding: computed(
      () =>
        addNewACFCertificateMutation.isPending.value ||
        addNewCertificateMutation.isPending.value,
    ),
    isReplacing: computed(
      () =>
        replaceACFCertificateMutation.isPending.value ||
        replaceCertificateMutation.isPending.value,
    ),
    isDeleting: computed(
      () =>
        deleteACFCertificateMutation.isPending.value ||
        deleteCertificateMutation.isPending.value,
    ),
    isGenerating: generateCsrMutation.isPending,
  };
}

// Made with Bob
