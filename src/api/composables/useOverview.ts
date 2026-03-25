import { computed } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - useToast is a JS module
import useToast from '@/components/Composables/useToastComposable';
import {
  useRedfishCollection,
  useRedfishResource,
} from './useRedfishCollection';
import { usePatchResource } from './usePatchResource';
import type {
  Manager,
  FirmwareInventory,
  License,
  EthernetInterface,
  EventLog,
  System,
  Account,
} from '@/types/redfish';

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
  // Get BMC manager to find active firmware
  const {
    data: bmcManager,
    isLoading: isBmcLoading,
    isError: isBmcError,
    error: bmcError,
  } = useRedfishResource<Manager>('/redfish/v1/Managers/bmc');

  // Get all firmware inventory
  const {
    data: firmwareInventory,
    isLoading: isFirmwareLoading,
    isError: isFirmwareError,
    error: firmwareError,
  } = useRedfishCollection<FirmwareInventory>(
    '/redfish/v1/UpdateService/FirmwareInventory',
    {
      expand: false, // Disable expand for this endpoint
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );

  const firmwareData = computed((): FirmwareData => {
    if (!firmwareInventory.value || !bmcManager.value) {
      return {
        activeBmcFirmware: null,
        backupBmcFirmware: null,
      };
    }

    const activeFirmwareId = bmcManager.value.Links?.ActiveSoftwareImage?.[
      '@odata.id'
    ]
      ?.split('/')
      .pop();

    const bmcFirmware: FirmwareVersion[] = firmwareInventory.value
      .filter((fw) => {
        const firmwareType = fw.RelatedItem?.[0]?.['@odata.id']
          ?.split('/')
          .pop();
        return firmwareType === 'bmc';
      })
      .map((fw) => ({
        version: fw.Version,
        id: fw.Id,
      }));

    const activeBmc =
      bmcFirmware.find((fw) => fw.id === activeFirmwareId) || null;
    const backupBmc =
      bmcFirmware.find((fw) => fw.id !== activeFirmwareId) || null;

    return {
      activeBmcFirmware: activeBmc,
      backupBmcFirmware: backupBmc,
    };
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
    isLoading: computed(() => isBmcLoading.value || isFirmwareLoading.value),
    isError: computed(() => isBmcError.value || isFirmwareError.value),
    error: computed(() => bmcError.value || firmwareError.value),
  };
}

/**
 * Composable for fetching license/access key information
 */
export function useOverviewLicense() {
  const {
    data: licenses,
    isLoading,
    isError,
    error,
  } = useRedfishCollection<License>('/redfish/v1/LicenseService/Licenses', {
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });

  const licenseData = computed((): LicenseData => {
    if (!licenses.value) {
      return { expirationDate: null };
    }

    // Find the UAK (Firmware Update Access Key) license
    const uakLicense = licenses.value.find((license) => license.Id === 'UAK');
    if (uakLicense?.ExpirationDate) {
      return {
        expirationDate: new Date(uakLicense.ExpirationDate),
      };
    }

    return { expirationDate: null };
  });

  return {
    firmwareAccessKeyInfo: licenseData,
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
    data: ethernetInterfaces,
    isLoading,
    isError,
    error,
  } = useRedfishCollection<EthernetInterface>(
    '/redfish/v1/Managers/bmc/EthernetInterfaces',
    {
      expand: false, // Disable expand for this endpoint
      staleTime: 2 * 60 * 1000, // 2 minutes
    },
  );

  const networkData = computed((): NetworkData => {
    if (!ethernetInterfaces.value || ethernetInterfaces.value.length === 0) {
      return {
        hostname: null,
        staticAddress: null,
        dhcpAddress: [],
      };
    }

    const firstInterface = ethernetInterfaces.value[0];
    const dhcpAddresses = (firstInterface.IPv4Addresses || []).filter(
      (ipv4) => ipv4.AddressOrigin === 'DHCP',
    );

    return {
      hostname: firstInterface.HostName || null,
      staticAddress: firstInterface.IPv4StaticAddresses?.[0]?.Address || null,
      dhcpAddress: dhcpAddresses,
    };
  });

  return {
    network: networkData,
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
    data: eventLogs,
    isLoading,
    isError,
    error,
  } = useRedfishCollection<EventLog>(
    '/redfish/v1/Systems/system/LogServices/EventLog/Entries',
    {
      staleTime: 30 * 1000, // 30 seconds
    },
  );

  const eventsData = computed((): EventLogEntry[] => {
    if (!eventLogs.value) {
      return [];
    }

    return eventLogs.value.map((event) => ({
      ...event,
      Severity: event.Severity || 'OK',
      filterByStatus: event.Resolved ? 'Resolved' : 'Unresolved',
    }));
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
    allEvents: eventsData,
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
    data: system,
    isLoading,
    isError,
    error,
  } = useRedfishResource<System>('/redfish/v1/Systems/system', {
    enabled: true,
  });

  const inventoryData = computed((): SystemInventory => {
    return {
      locationIndicatorActive: system.value?.LocationIndicatorActive ?? false,
    };
  });

  return {
    systems: inventoryData,
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
    data: bmcManager,
    isLoading: isBmcTimeLoading,
    isError: isBmcTimeError,
  } = useRedfishResource<Manager>('/redfish/v1/Managers/bmc');

  const bmcTimeData = computed((): BmcTimeData => {
    const bmcDateTime = bmcManager.value?.DateTime;
    return {
      bmcTime: bmcDateTime ? new Date(bmcDateTime) : null,
    };
  });

  // Get username from localStorage (set during login)
  const username = localStorage.getItem('storedUsername');

  const {
    data: currentUser,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useRedfishResource<Account>(
    `/redfish/v1/AccountService/Accounts/${username}`,
    {
      enabled: !!username,
    },
  );

  const currentUserData = computed((): CurrentUser => {
    return {
      RoleId: currentUser.value?.RoleId || null,
    };
  });

  return {
    bmcTime: computed(() => bmcTimeData.value?.bmcTime ?? null),
    currentUser: currentUserData,
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
  const { patchResource, isPending, isError, error } = usePatchResource();

  const updateIdentifyLed = async (ledState: boolean) => {
    try {
      await patchResource({
        endpoint: '/redfish/v1/Systems/system',
        field: 'LocationIndicatorActive',
        value: ledState,
        invalidateQueries: [
          ['redfish', 'overview', 'inventory'],
          ['redfish', 'resource', '/redfish/v1/Systems/system'],
        ],
        onSuccess: () => {
          if (ledState) {
            successToast(
              i18n.global.t('pageInventory.toast.successEnableIdentifyLed'),
            );
          } else {
            successToast(
              i18n.global.t('pageInventory.toast.successDisableIdentifyLed'),
            );
          }
        },
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
    } catch (err) {
      console.log('Identify LED Error:', err);
      if (ledState) {
        errorToast(i18n.global.t('pageInventory.toast.errorEnableIdentifyLed'));
      } else {
        errorToast(
          i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
        );
      }
      throw err;
    }
  };

  return {
    updateIdentifyLed,
    updateIdentifyLedAsync: updateIdentifyLed,
    isUpdating: isPending,
    isError,
    error,
  };
}
