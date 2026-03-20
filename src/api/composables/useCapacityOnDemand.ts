import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n is a JS module
import i18n from '@/i18n';

interface License {
  Id: string;
  Name: string;
  SerialNumber?: string;
  ExpirationDate?: string;
  LicenseScope?: {
    MaxNumberOfDevices?: number;
  };
}

interface LicenseInfo {
  licensed: number | string;
  resourceId: string;
  sequenceNumber: string;
  expirationDate: Date | string;
}

const parseData = (data?: License): LicenseInfo => {
  const [resourceId = '--', sequenceNumber = '--'] =
    data?.SerialNumber?.split('-') || [];
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

/**
 * Composable for Capacity on Demand page - uses VueQuery
 * Provides license-specific computed properties and methods
 */
export function useCapacityOnDemand() {
  const queryClient = useQueryClient();

  // Fetch licenses data
  const {
    data: licensesData,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'licenseService', 'licenses'],
    queryFn: async (): Promise<Record<string, License>> => {
      const response = await api.get('/redfish/v1/LicenseService/Licenses');
      const members = response.data?.Members || [];
      
      const promises = members.map((member: any) => 
        api.get(member['@odata.id'])
      );
      
      const responses = await Promise.all(promises);
      
      const data = responses.reduce((acc, { data }) => {
        acc[data.Id] = data;
        return acc;
      }, {} as Record<string, License>);
      
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Computed: All licenses
  const licenses = computed(() => licensesData.value || {});

  // Computed: VET capabilities (filtered licenses)
  const vetCapabilities = computed(() => {
    const excludedNames = [
      'AIX Update Access Key',
      'Asset Protection Machine ID',
      'Asset Protection Public Key',
      'Elastic MemoryGB*Days Available',
      'Elastic Processor*Days Available',
      'Trial Memory Licenses (GB)',
      'Permanent Memory Licenses (GB)',
      'Permanent Processor Licenses',
      'Firmware Update Access Key',
      'Virtualization Engine Technology',
      'Trial Processor Licenses',
      'System Anchor',
    ];

    return Object.values(licenses.value).filter((license) => {
      return !excludedNames.includes(license.Name);
    });
  });

  // Computed: Processor info
  const processorInfo = computed<LicenseInfo>(() => {
    return parseData(licenses.value.PermProcs);
  });

  // Computed: Memory info
  const memoryInfo = computed<LicenseInfo>(() => {
    return parseData(licenses.value.PermMem);
  });

  // Computed: Firmware access key info
  const firmwareAccessKeyInfo = computed<LicenseInfo>(() => {
    return parseData(licenses.value.UAK);
  });

  // Computed: AIX access key info
  const aixAccessKeyInfo = computed<LicenseInfo>(() => {
    return parseData(licenses.value.AIXUAK);
  });

  // Mutation: Activate license
  const activateLicenseMutation = useMutation({
    mutationFn: async (licenseKey: string): Promise<string> => {
      await api.post('/redfish/v1/LicenseService/Licenses', {
        LicenseString: licenseKey,
      });
      return i18n.global.t('pageCapacityOnDemand.activation.toast.success');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'licenseService', 'licenses'],
      });
    },
    onError: (error) => {
      console.log('License activation error:', error);
      throw new Error(
        i18n.global.t('pageCapacityOnDemand.activation.toast.error')
      );
    },
  });

  // Helper function to activate license
  const activateLicense = async (licenseKey: string): Promise<string> => {
    return activateLicenseMutation.mutateAsync(licenseKey);
  };

  return {
    // Data
    licenses,
    vetCapabilities,
    processorInfo,
    memoryInfo,
    firmwareAccessKeyInfo,
    aixAccessKeyInfo,

    // Loading and error states
    isFetching,
    isError,
    error,

    // Refetch
    refetch,

    // Mutations
    activateLicense,
    isActivating: activateLicenseMutation.isPending,
  };
}