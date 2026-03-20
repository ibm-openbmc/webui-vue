import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
// @ts-ignore - i18n is a JS module
import i18n from '@/i18n';

interface FirmwareItem {
  version: string;
  id: string;
  location: string;
  status: string;
}

interface FirmwareInventoryResponse {
  Members?: Array<{ '@odata.id': string }>;
}

interface FirmwareItemResponse {
  Version?: string;
  Id?: string;
  '@odata.id'?: string;
  Status?: {
    Health?: string;
  };
  RelatedItem?: Array<{ '@odata.id': string }>;
}

interface UpdateServiceResponse {
  HttpPushUriOptions?: {
    HttpPushUriApplyTime?: {
      ApplyTime?: string;
    };
  };
}

interface BiosResponse {
  Links?: {
    ActiveSoftwareImage?: {
      '@odata.id': string;
    };
  };
  Attributes?: {
    fw_boot_side_current?: string;
  };
}

interface ManagerResponse {
  Links?: {
    ActiveSoftwareImage?: {
      '@odata.id': string;
    };
  };
}

interface SoftwareImageResponse {
  LowestSupportedVersion?: string;
}

/**
 * Composable for Firmware page - uses VueQuery
 * Provides firmware-specific computed properties and methods
 */
export function useFirmware() {
  const queryClient = useQueryClient();

  // Fetch BMC active firmware ID
  const {
    data: bmcActiveFirmwareId,
    isFetching: isFetchingBmcActive,
  } = useQuery({
    queryKey: ['redfish', 'managers', 'bmc', 'activeFirmware'],
    queryFn: async (): Promise<string | null> => {
      const response = await api.get<ManagerResponse>('/redfish/v1/Managers/bmc');
      const id = response.data?.Links?.ActiveSoftwareImage?.['@odata.id']?.split('/').pop();
      return id || null;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch Host active firmware ID
  const {
    data: hostActiveFirmwareId,
    isFetching: isFetchingHostActive,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'bios', 'activeFirmware'],
    queryFn: async (): Promise<string | null> => {
      const response = await api.get<BiosResponse>('/redfish/v1/Systems/system/Bios');
      const id = response.data?.Links?.ActiveSoftwareImage?.['@odata.id']?.split('/').pop();
      return id || null;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch firmware boot side
  const {
    data: firmwareBootSide,
    isFetching: isFetchingBootSide,
  } = useQuery({
    queryKey: ['redfish', 'systems', 'system', 'bios', 'bootSide'],
    queryFn: async (): Promise<string | null> => {
      const response = await api.get<BiosResponse>('/redfish/v1/Systems/system/Bios');
      return response.data?.Attributes?.fw_boot_side_current || null;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch firmware inventory
  const {
    data: firmwareInventory,
    isFetching: isFetchingInventory,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['redfish', 'updateService', 'firmwareInventory'],
    queryFn: async (): Promise<{ bmc: FirmwareItem[]; host: FirmwareItem[] }> => {
      const response = await api.get<FirmwareInventoryResponse>(
        '/redfish/v1/UpdateService/FirmwareInventory'
      );
      const members = response.data?.Members || [];

      const promises = members.map((item) => api.get<FirmwareItemResponse>(item['@odata.id']));
      const responses = await Promise.all(promises);

      const bmcFirmware: FirmwareItem[] = [];
      const hostFirmware: FirmwareItem[] = [];

      responses.forEach(({ data }) => {
        const firmwareType = data?.RelatedItem?.[0]?.['@odata.id']?.split('/').pop();
        const item: FirmwareItem = {
          version: data?.Version || '',
          id: data?.Id || '',
          location: data?.['@odata.id'] || '',
          status: data?.Status?.Health || '',
        };

        if (firmwareType === 'bmc') {
          bmcFirmware.push(item);
        } else if (firmwareType === 'Bios') {
          hostFirmware.push(item);
        }
      });

      return { bmc: bmcFirmware, host: hostFirmware };
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Fetch update service settings
  const {
    data: applyTime,
    isFetching: isFetchingApplyTime,
  } = useQuery({
    queryKey: ['redfish', 'updateService', 'settings'],
    queryFn: async (): Promise<string | null> => {
      const response = await api.get<UpdateServiceResponse>('/redfish/v1/UpdateService');
      return response.data?.HttpPushUriOptions?.HttpPushUriApplyTime?.ApplyTime || null;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch lowest supported firmware version
  const {
    data: lowestSupportedFirmwareVersion,
    isFetching: isFetchingLowestSupported,
  } = useQuery({
    queryKey: ['redfish', 'managers', 'bmc', 'lowestSupportedVersion'],
    queryFn: async (): Promise<{ version: string | null; showAlert: boolean }> => {
      const managerResponse = await api.get<ManagerResponse>('/redfish/v1/Managers/bmc');
      const imageUrl = managerResponse.data?.Links?.ActiveSoftwareImage?.['@odata.id'];
      
      if (!imageUrl) {
        return { version: null, showAlert: false };
      }

      const imageResponse = await api.get<SoftwareImageResponse>(imageUrl);
      const lowestVersion = imageResponse.data?.LowestSupportedVersion;

      return {
        version: lowestVersion || null,
        showAlert: !!lowestVersion,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  // Computed: BMC firmware list
  const bmcFirmware = computed(() => firmwareInventory.value?.bmc || []);

  // Computed: Host firmware list
  const hostFirmware = computed(() => firmwareInventory.value?.host || []);

  // Computed: Active BMC firmware
  const activeBmcFirmware = computed(() => {
    return bmcFirmware.value.find(
      (firmware) => firmware.id === bmcActiveFirmwareId.value
    ) || null;
  });

  // Computed: Active Host firmware
  const activeHostFirmware = computed(() => {
    return hostFirmware.value.find(
      (firmware) => firmware.id === hostActiveFirmwareId.value
    ) || null;
  });

  // Computed: Backup BMC firmware
  const backupBmcFirmware = computed(() => {
    return bmcFirmware.value.find(
      (firmware) => firmware.id !== bmcActiveFirmwareId.value
    ) || null;
  });

  // Computed: Backup Host firmware
  const backupHostFirmware = computed(() => {
    return hostFirmware.value.find(
      (firmware) => firmware.id !== hostActiveFirmwareId.value
    ) || null;
  });

  // Computed: Is single file upload enabled
  const isSingleFileUploadEnabled = computed(() => hostFirmware.value.length === 0);

  // Computed: Loading state
  const isFetching = computed(
    () =>
      isFetchingBmcActive.value ||
      isFetchingHostActive.value ||
      isFetchingBootSide.value ||
      isFetchingInventory.value ||
      isFetchingApplyTime.value ||
      isFetchingLowestSupported.value
  );

  // Mutation: Set apply time to immediate
  const setApplyTimeImmediateMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const data = {
        HttpPushUriOptions: {
          HttpPushUriApplyTime: {
            ApplyTime: 'Immediate',
          },
        },
      };
      await api.patch('/redfish/v1/UpdateService', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'updateService', 'settings'],
      });
    },
    onError: (error) => {
      console.log('Set apply time error:', error);
      throw new Error(i18n.global.t('pageFirmware.toast.errorUploadFirmware'));
    },
  });

  // Mutation: Upload firmware
  const uploadFirmwareMutation = useMutation({
    mutationFn: async (image: File): Promise<any> => {
      // Ensure ApplyTime is set to Immediate
      if (applyTime.value !== 'Immediate') {
        await setApplyTimeImmediateMutation.mutateAsync();
      }

      const response = await api.post('/redfish/v1/UpdateService/update', image, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'updateService', 'firmwareInventory'],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'managers', 'bmc', 'activeFirmware'],
      });
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'systems', 'system', 'bios', 'activeFirmware'],
      });
    },
    onError: (error) => {
      console.log('Upload firmware error:', error);
      throw new Error(i18n.global.t('pageFirmware.toast.errorUpdateFirmware'));
    },
  });

  // Mutation: Switch BMC firmware and reboot
  const switchBmcFirmwareMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      const backupLocation = backupBmcFirmware.value?.location;
      if (!backupLocation) {
        throw new Error('No backup firmware available');
      }

      const data = {
        Links: {
          ActiveSoftwareImage: {
            '@odata.id': backupLocation,
          },
        },
      };

      await api.patch('/redfish/v1/Managers/bmc', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'managers', 'bmc', 'activeFirmware'],
      });
    },
    onError: (error) => {
      console.log('Switch firmware error:', error);
      throw new Error(i18n.global.t('pageFirmware.toast.errorSwitchImages'));
    },
  });

  // Helper functions
  const uploadFirmware = async (image: File): Promise<any> => {
    return uploadFirmwareMutation.mutateAsync(image);
  };

  const switchBmcFirmwareAndReboot = async (): Promise<void> => {
    return switchBmcFirmwareMutation.mutateAsync();
  };

  const setApplyTimeImmediate = async (): Promise<void> => {
    return setApplyTimeImmediateMutation.mutateAsync();
  };

  return {
    // Data
    bmcFirmware,
    hostFirmware,
    bmcActiveFirmwareId,
    hostActiveFirmwareId,
    activeBmcFirmware,
    activeHostFirmware,
    backupBmcFirmware,
    backupHostFirmware,
    applyTime,
    firmwareBootSide,
    lowestSupportedFirmwareVersion,
    isSingleFileUploadEnabled,

    // Loading and error states
    isFetching,
    isError,
    error,

    // Refetch
    refetch,

    // Mutations
    uploadFirmware,
    switchBmcFirmwareAndReboot,
    setApplyTimeImmediate,
    isUploading: uploadFirmwareMutation.isPending,
    isSwitching: switchBmcFirmwareMutation.isPending,
  };
}