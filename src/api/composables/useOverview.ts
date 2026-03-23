import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';

// ============================================================================
// TYPES
// ============================================================================

interface FirmwareVersion {
  version?: string;
  id?: string;
}

interface FirmwareData {
  activeBmcFirmware: FirmwareVersion | null;
  backupBmcFirmware: FirmwareVersion | null;
}

interface LicenseData {
  expirationDate: Date | null;
}

interface NetworkAddress {
  Address?: string;
}

interface NetworkData {
  hostname: string | null;
  staticAddress: string | null;
  dhcpAddress: NetworkAddress[];
}

interface EventLogEntry {
  Id: string;
  Severity: string;
  Resolved?: boolean;
  filterByStatus?: string;
}

interface SystemInventory {
  locationIndicatorActive?: boolean;
}

interface BmcTimeData {
  bmcTime: Date | null;
}

interface CurrentUser {
  RoleId?: string | null;
}

// ============================================================================
// FIRMWARE COMPOSABLE
// ============================================================================

/**
 * Composable for fetching firmware information for Overview
 */
export function useOverviewFirmware() {
  const {
    data: firmwareData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'firmware'],
    queryFn: async (): Promise<FirmwareData> => {
      // Get active BMC firmware ID from manager
      const bmcResponse = await api.get('/redfish/v1/Managers/bmc');
      const activeFirmwareId = bmcResponse.data?.Links?.ActiveSoftwareImage?.[
        '@odata.id'
      ]
        ?.split('/')
        .pop();

      // Get all firmware inventory
      const inventoryResponse = await api.get(
        '/redfish/v1/UpdateService/FirmwareInventory',
      );
      const members = inventoryResponse.data?.Members || [];

      const bmcFirmware: FirmwareVersion[] = [];

      // Fetch each firmware item
      const firmwarePromises = members.map((member: any) =>
        api.get(member['@odata.id']),
      );
      const firmwareResponses = await Promise.all(firmwarePromises);

      firmwareResponses.forEach((response) => {
        const fw = response.data;
        const firmwareType = fw?.RelatedItem?.[0]?.['@odata.id']
          ?.split('/')
          .pop();

        // Only collect BMC firmware
        if (firmwareType === 'bmc') {
          bmcFirmware.push({
            version: fw.Version,
            id: fw.Id,
          });
        }
      });

      // Find active and backup firmware
      const activeBmc =
        bmcFirmware.find((fw: any) => fw.id === activeFirmwareId) || null;
      const backupBmc =
        bmcFirmware.find((fw: any) => fw.id !== activeFirmwareId) || null;

      return {
        activeBmcFirmware: activeBmc,
        backupBmcFirmware: backupBmc,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    activeBmcFirmware: computed(
      () => firmwareData.value?.activeBmcFirmware ?? null,
    ),
    backupBmcFirmware: computed(
      () => firmwareData.value?.backupBmcFirmware ?? null,
    ),
    runningVersion: computed(
      () => firmwareData.value?.activeBmcFirmware?.version ?? null,
    ),
    backupVersion: computed(
      () => firmwareData.value?.backupBmcFirmware?.version ?? null,
    ),
    isLoading,
    isError,
    error,
  };
}

/**
 * Composable for fetching license/access key information
 */
export function useOverviewLicense() {
  const {
    data: licenseData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'license'],
    queryFn: async (): Promise<LicenseData> => {
      try {
        const response = await api.get('/redfish/v1/LicenseService/Licenses');
        const members = response.data?.Members || [];

        // Fetch all licenses
        const licensePromises = members.map((member: any) =>
          api.get(member['@odata.id']),
        );
        const licenseResponses = await Promise.all(licensePromises);

        // Find the UAK (Firmware Update Access Key) license
        for (const licenseResponse of licenseResponses) {
          const licenseData = licenseResponse.data;
          if (licenseData.Id === 'UAK') {
            const expirationDate = licenseData?.ExpirationDate;
            return {
              expirationDate: expirationDate ? new Date(expirationDate) : null,
            };
          }
        }
      } catch (error) {
        console.log('License fetch error:', error);
      }

      return { expirationDate: null };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false, // Don't retry if license service not available
  });

  return {
    firmwareAccessKeyInfo: computed(() => ({
      expirationDate: licenseData.value?.expirationDate ?? null,
    })),
    isLoading,
    isError,
    error,
  };
}

// ============================================================================
// NETWORK COMPOSABLE
// ============================================================================

/**
 * Composable for fetching network information for Overview
 */
export function useOverviewNetwork() {
  const {
    data: networkData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'network'],
    queryFn: async (): Promise<NetworkData> => {
      const response = await api.get(
        '/redfish/v1/Managers/bmc/EthernetInterfaces',
      );
      const members = response.data?.Members || [];

      if (members.length > 0) {
        const ethResponse = await api.get(members[0]['@odata.id']);
        const data = ethResponse.data;

        // Filter IPv4Addresses to only include DHCP addresses
        const dhcpAddresses = (data.IPv4Addresses || []).filter(
          (ipv4: any) => ipv4.AddressOrigin === 'DHCP',
        );

        return {
          hostname: data.HostName || null,
          staticAddress: data.IPv4StaticAddresses?.[0]?.Address || null,
          dhcpAddress: dhcpAddresses,
        };
      }

      return {
        hostname: null,
        staticAddress: null,
        dhcpAddress: [],
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    network: computed(() => networkData.value ?? null),
    isLoading,
    isError,
    error,
  };
}

// ============================================================================
// EVENT LOGS COMPOSABLE
// ============================================================================

/**
 * Composable for fetching event logs for Overview
 */
export function useOverviewEvents() {
  const {
    data: eventsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'events'],
    queryFn: async (): Promise<EventLogEntry[]> => {
      const response = await api.get(
        '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
      );
      const members = response.data?.Members || [];

      return members.map((event: any) => ({
        Id: event.Id,
        Severity: event.Severity,
        Resolved: event.Resolved,
        filterByStatus: event.Resolved ? 'Resolved' : 'Unresolved',
        ...event,
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const criticalEvents = computed(() => {
    return (eventsData.value || []).filter(
      (log) =>
        log.Severity === 'Critical' && log.filterByStatus === 'Unresolved',
    );
  });

  const warningEvents = computed(() => {
    return (eventsData.value || []).filter(
      (log) =>
        log.Severity === 'Warning' && log.filterByStatus === 'Unresolved',
    );
  });

  return {
    allEvents: computed(() => eventsData.value || []),
    criticalEvents,
    warningEvents,
    isLoading,
    isError,
    error,
  };
}

// ============================================================================
// INVENTORY COMPOSABLE
// ============================================================================

/**
 * Composable for fetching system inventory for Overview
 */
export function useOverviewInventory() {
  const {
    data: inventoryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'inventory'],
    queryFn: async (): Promise<SystemInventory> => {
      const response = await api.get('/redfish/v1/Systems/system');
      return {
        locationIndicatorActive:
          response.data?.LocationIndicatorActive ?? false,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    systems: computed(() => inventoryData.value ?? {}),
    isLoading,
    isError,
    error,
  };
}

// ============================================================================
// BMC TIME & USER COMPOSABLE
// ============================================================================

/**
 * Composable for fetching BMC time and current user for Overview
 */
export function useOverviewQuickLinks() {
  const {
    data: bmcTimeData,
    isLoading: isBmcTimeLoading,
    isError: isBmcTimeError,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'bmc-time'],
    queryFn: async (): Promise<BmcTimeData> => {
      const response = await api.get('/redfish/v1/Managers/bmc');
      const bmcDateTime = response.data?.DateTime;
      return {
        bmcTime: bmcDateTime ? new Date(bmcDateTime) : null,
      };
    },
    staleTime: 10 * 1000, // 10 seconds
    gcTime: 60 * 1000, // 1 minute
    retry: (failureCount: number, err: any) => {
      const status = err?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const {
    data: currentUserData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery({
    queryKey: ['redfish', 'overview', 'current-user'],
    queryFn: async (): Promise<CurrentUser> => {
      // Get username from localStorage (set during login)
      const username = localStorage.getItem('storedUsername');

      if (!username) {
        return { RoleId: null };
      }

      try {
        const response = await api.get(
          `/redfish/v1/AccountService/Accounts/${username}`,
        );
        return {
          RoleId: response.data?.RoleId || null,
        };
      } catch (error) {
        console.log('Error fetching current user:', error);
        return { RoleId: null };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  return {
    bmcTime: computed(() => bmcTimeData.value?.bmcTime ?? null),
    currentUser: computed(() => currentUserData.value ?? {}),
    currentUserRole: computed(() => currentUserData.value?.RoleId ?? null),
    canUseHostConsole: computed(() => {
      const role = currentUserData.value?.RoleId;
      return role === 'Administrator' || role === 'OemIBMServiceAgent';
    }),
    isLoading: computed(() => isBmcTimeLoading.value || isUserLoading.value),
    isError: computed(() => isBmcTimeError.value || isUserError.value),
  };
}

/**
 * Composable for updating system identify LED state
 * Provides mutation function with automatic cache invalidation
 */
export function useUpdateIdentifyLed() {
  const queryClient = useQueryClient();
  const { successToast, errorToast } = useToast();

  const mutation = useMutation({
    mutationFn: async (ledState: boolean) => {
      await api.patch('/redfish/v1/Systems/system', {
        LocationIndicatorActive: ledState,
      });
      return ledState;
    },
    onSuccess: (ledState) => {
      if (ledState) {
        successToast(
          i18n.global.t('pageInventory.toast.successEnableIdentifyLed'),
        );
      } else {
        successToast(
          i18n.global.t('pageInventory.toast.successDisableIdentifyLed'),
        );
      }
      // Invalidate inventory query to refetch
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'overview', 'inventory'],
      });

      // Optimistically update the cache
      queryClient.setQueryData(
        ['redfish', 'overview', 'inventory'],
        (old: any) => {
          if (old) {
            return { ...old, locationIndicatorActive: ledState };
          }
          return old;
        },
      );
    },
    onError: (error, ledState) => {
      console.log('Identify LED Error:', error);
      if (ledState) {
        errorToast(i18n.global.t('pageInventory.toast.errorEnableIdentifyLed'));
      } else {
        errorToast(
          i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
        );
      }
    },
  });

  return {
    updateIdentifyLed: mutation.mutate,
    updateIdentifyLedAsync: mutation.mutateAsync,
    isUpdating: computed(() => mutation.isPending.value),
    isError: computed(() => mutation.isError.value),
    error: mutation.error,
  };
}
