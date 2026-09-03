import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useRedfishCollection';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - api.js is a JavaScript module
import api, { getResponseCount } from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
// @ts-ignore - GlobalConstants.js is a JavaScript module
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants';
import type { Resource } from '@/types/redfish';

// Raw Redfish dump entry
export interface DumpEntry extends Resource {
  Created: string;
  AdditionalDataURI?: string;
  AdditionalDataSizeBytes?: number;
}

// Processed dump for the UI
export interface ProcessedDump {
  data?: string;
  dateTime: Date;
  dumpType: string;
  id: string;
  location: string;
  size?: number;
  actions: Array<{ value: string }>;
}

/** Derive a human-readable dump type from the raw Redfish entry name/id. */
function resolveDumpType(name: string, id: string): string {
  if (name !== 'System Dump Entry') return name;
  if (id.startsWith('0')) return 'Hardware Dump Entry';
  if (id.startsWith('2')) return 'Hostboot Dump Entry';
  if (id.startsWith('3')) return 'SBE Dump Entry';
  if (id.startsWith('4')) return 'OCMB SBE Dump Entry';
  if (id.startsWith('A')) return 'System Dump Entry';
  if (id.startsWith('B')) return 'Resource Dump Entry';
  return name;
}

function processDumpEntry(dump: DumpEntry): ProcessedDump {
  return {
    data: dump.AdditionalDataURI,
    dateTime: new Date(dump.Created),
    dumpType: resolveDumpType(dump.Name, dump.Id),
    id: dump.Id,
    location: (dump as any)['@odata.id'],
    size: dump.AdditionalDataSizeBytes,
    actions: [{ value: 'download' }, { value: 'delete' }],
  };
}

/**
 * Composable for fetching and managing BMC/System dump entries.
 * Replaces DumpsStore with TanStack Query.
 */
export function useDumps() {
  const queryClient = useQueryClient();

  // Fetch BMC dump entries — server does not support $expand on dump endpoints
  const {
    data: bmcDumpsRaw,
    isLoading: isLoadingBmc,
    refetch: refetchBmcDumps,
  } = useRedfishCollection<DumpEntry>(
    '/redfish/v1/Managers/bmc/LogServices/Dump/Entries',
    { expand: false, queryConfig: RedfishQueryPresets.dumps },
  );

  // Fetch System dump entries — server does not support $expand on dump endpoints
  const {
    data: systemDumpsRaw,
    isLoading: isLoadingSystem,
    refetch: refetchSystemDumps,
  } = useRedfishCollection<DumpEntry>(
    '/redfish/v1/Systems/system/LogServices/Dump/Entries',
    { expand: false, queryConfig: RedfishQueryPresets.dumps },
  );

  // Combine and process all dump entries
  const allDumps = computed<ProcessedDump[]>(() => {
    const bmc = (bmcDumpsRaw.value ?? []).map(processDumpEntry);
    const system = (systemDumpsRaw.value ?? []).map(processDumpEntry);
    return [...bmc, ...system];
  });

  const isLoading = computed(() => isLoadingBmc.value || isLoadingSystem.value);

  const refetchAll = async () => {
    await Promise.all([refetchBmcDumps(), refetchSystemDumps()]);
  };

  /** Invalidate both dump collection queries so they refetch. */
  const invalidateDumps = () => {
    queryClient.invalidateQueries({
      queryKey: [
        'redfish',
        'collection',
        '/redfish/v1/Managers/bmc/LogServices/Dump/Entries',
      ],
    });
    queryClient.invalidateQueries({
      queryKey: [
        'redfish',
        'collection',
        '/redfish/v1/Systems/system/LogServices/Dump/Entries',
      ],
    });
  };

  // ── Mutations ───────────────────────────────────────────────────────────────

  /** Delete one or more dumps by their location (odata.id). */
  const deleteDumpsMutation = useMutation({
    mutationFn: async (dumps: ProcessedDump[]) => {
      const promises = dumps.map(({ location }) =>
        api.delete(location).catch((error: any) => {
          console.error(error);
          return error;
        }),
      );
      const responses = await api.all(promises);
      const { successCount, errorCount } = getResponseCount(responses);
      const toastMessages: Array<{ type: string; message: string }> = [];

      if (successCount) {
        toastMessages.push({
          type: 'success',
          message: i18n.global.t(
            'pageDumps.toast.successDeleteDump',
            successCount,
          ),
        });
      }
      if (errorCount) {
        toastMessages.push({
          type: 'error',
          message: i18n.global.t('pageDumps.toast.errorDeleteDump', errorCount),
        });
      }
      return toastMessages;
    },
    onSuccess: () => invalidateDumps(),
  });

  /** Fetch the task service task list (used by resource dump polling). */
  const getTask = async () => {
    return api.get('/redfish/v1/TaskService/Tasks');
  };

  /** Initiate a BMC dump. */
  const createBmcDumpMutation = useMutation({
    mutationFn: async (dumpType: string) => {
      return api
        .post(
          '/redfish/v1/Managers/bmc/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          { DiagnosticDataType: 'Manager' },
        )
        .catch((error: any) => {
          const errorMsg =
            error.response?.data?.error?.['@Message.ExtendedInfo']?.[0]
              ?.MessageId;
          if (REGEX_MAPPINGS.resourceInUse.test(errorMsg)) {
            throw new Error(
              i18n.global.t('pageDumps.toast.errorStartDumpAnotherInProgress', {
                dump: dumpType,
              }),
            );
          }
          if (REGEX_MAPPINGS.resourceInStandby.test(errorMsg)) {
            throw new Error(
              i18n.global.t('pageDumps.toast.errorStartDumpResourceInStandby', {
                dump: dumpType,
              }),
            );
          }
          throw new Error(i18n.global.t('pageDumps.toast.errorStartBmcDump'));
        });
    },
    onSuccess: () => invalidateDumps(),
  });

  /** Initiate a Resource dump. */
  const createResourceDumpMutation = useMutation({
    mutationFn: async ({
      resourceSelector,
      resourcePassword,
    }: {
      resourceSelector: string | null;
      resourcePassword: string;
    }) => {
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      return api
        .post(
          '/redfish/v1/Systems/system/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          {
            DiagnosticDataType: 'OEM',
            OEMDiagnosticDataType: `Resource_${resourceSelector || ''}_${resourcePassword}`,
          },
        )
        .then(({ data }: any) =>
          delay(500).then(() => api.get(data['@odata.id'])),
        )
        .then(({ data }: any) => {
          const messageId = data.Messages?.filter(
            (m: any) =>
              REGEX_MAPPINGS.actionParameterUnknown.test(m.MessageId) ||
              REGEX_MAPPINGS.resourceAtUriUnauthorized.test(m.MessageId) ||
              REGEX_MAPPINGS.insufficientPrivilege.test(m.MessageId),
          )[0]?.MessageId;
          if (messageId) throw messageId;
        })
        .catch((error: any) => {
          if (
            REGEX_MAPPINGS.resourceInStandby.test(
              error.response?.data?.error?.code,
            )
          ) {
            throw new Error(
              i18n.global.t('pageDumps.toast.errorPhypInStandby'),
            );
          }
          const errorMsg = error;
          if (REGEX_MAPPINGS.actionParameterUnknown.test(errorMsg)) {
            throw new Error(
              i18n.global.t(
                'pageDumps.toast.errorStartResourceDumpInvalidSelector',
              ),
            );
          }
          if (REGEX_MAPPINGS.resourceAtUriUnauthorized.test(errorMsg)) {
            throw new Error(
              i18n.global.t(
                'pageDumps.toast.errorStartResourceDumpInvalidPassword',
              ),
            );
          }
          if (REGEX_MAPPINGS.insufficientPrivilege.test(errorMsg)) {
            throw new Error(i18n.global.t('global.toast.unAuthDescription'));
          }
          throw new Error(
            i18n.global.t('pageDumps.toast.errorStartResourceDump'),
          );
        });
    },
    onSuccess: () => invalidateDumps(),
  });

  /** Initiate a System dump. */
  const createSystemDumpMutation = useMutation({
    mutationFn: async (dumpType: string) => {
      return api
        .post(
          '/redfish/v1/Systems/system/LogServices/Dump/Actions/LogService.CollectDiagnosticData',
          { DiagnosticDataType: 'OEM', OEMDiagnosticDataType: 'System' },
        )
        .catch((error: any) => {
          const errorMsg =
            error.response?.data?.error?.['@Message.ExtendedInfo']?.[0]
              ?.MessageId;
          if (REGEX_MAPPINGS.resourceInUse.test(errorMsg)) {
            throw new Error(
              i18n.global.t('pageDumps.toast.errorStartDumpAnotherInProgress', {
                dump: dumpType,
              }),
            );
          }
          if (REGEX_MAPPINGS.resourceInStandby.test(errorMsg)) {
            throw new Error(
              i18n.global.t('pageDumps.toast.errorStartDumpResourceInStandby', {
                dump: dumpType,
              }),
            );
          }
          throw new Error(i18n.global.t('pageDumps.toast.errorStartBmcDump'));
        });
    },
    onSuccess: () => invalidateDumps(),
  });

  return {
    // Data
    allDumps,

    // Loading states
    isLoading,
    isLoadingBmc,
    isLoadingSystem,

    // Mutations
    deleteDumps: deleteDumpsMutation.mutateAsync,
    createBmcDump: createBmcDumpMutation.mutateAsync,
    createResourceDump: createResourceDumpMutation.mutateAsync,
    createSystemDump: createSystemDumpMutation.mutateAsync,

    // Mutation pending states
    isDeleting: deleteDumpsMutation.isPending,
    isCreatingBmcDump: createBmcDumpMutation.isPending,
    isCreatingResourceDump: createResourceDumpMutation.isPending,
    isCreatingSystemDump: createSystemDumpMutation.isPending,

    // Task helper (for resource dump polling)
    getTask,

    // Refetch
    refetchAll,
    refetchBmcDumps,
    refetchSystemDumps,
  };
}
