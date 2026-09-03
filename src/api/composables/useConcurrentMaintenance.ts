import { computed } from 'vue';
import { useAllSubResources } from './useAllSubResources';
import { usePatchResource } from './usePatchResource';
import { useWritableQueryState } from './useWritableQueryState';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import type { Assembly, AssemblyItem } from '@/types/redfish';
import type { UseQueryOptions } from '@tanstack/vue-query';

export interface AssemblyData {
  /** Redfish unique identifier — preserved for deduplication and future deep-links */
  odataId: string;
  memberId: string;
  serviceLabel: string | undefined;
  readyToRemove: boolean | undefined;
}

export interface ConcurrentMaintenanceData {
  readyToRemove: boolean | null;
  todObject: AssemblyData | null;
  readyToRemoveControlPanel: boolean | null;
  controlPanel: AssemblyData | null;
  readyToRemoveControlPanelDisp: boolean | null;
  controlPanelDisp: AssemblyData | null;
}

/**
 * Composable for fetching and managing concurrent maintenance data
 * Replaces the ConcurrentMaintenanceStore with TanStack Query
 */
export function useConcurrentMaintenance() {
  const { patchResource, isPending: isUpdating } = usePatchResource();

  // Fetch assembly data from all chassis using useAllSubResources.
  // Assembly data is configuration-like — use the config preset (1 min stale).
  const {
    data: assembliesData,
    isLoading,
    isFetching,
    error,
    isError,
    refetch,
  } = useAllSubResources<Assembly>('/redfish/v1/Chassis', 'Assembly', {
    queryConfig: RedfishQueryPresets.concurrentMaintenance as Partial<
      UseQueryOptions<Assembly[]>
    >,
  });
  // Process assembly data to extract concurrent maintenance info
  const assemblyData = computed<ConcurrentMaintenanceData>(() => {
    if (!assembliesData.value) {
      return {
        readyToRemove: null,
        todObject: null,
        readyToRemoveControlPanel: null,
        controlPanel: null,
        readyToRemoveControlPanelDisp: null,
        controlPanelDisp: null,
      };
    }

    const result: ConcurrentMaintenanceData = {
      readyToRemove: null,
      todObject: null,
      readyToRemoveControlPanel: null,
      controlPanel: null,
      readyToRemoveControlPanelDisp: null,
      controlPanelDisp: null,
    };
    assembliesData.value.forEach((assemblyResource: any) => {
      // Assembly resources have an Assemblies array property
      const assemblies = assemblyResource?.Assemblies;
      if (!assemblies || !Array.isArray(assemblies)) {
        return;
      }

      assemblies.forEach((entry: AssemblyItem) => {
        const hasReadyToRemove =
          entry?.Oem?.OpenBMC && 'ReadyToRemove' in entry.Oem.OpenBMC;
        const serviceLabel = entry?.Location?.PartLocation?.ServiceLabel;

        if (hasReadyToRemove && serviceLabel) {
          // Construct the full @odata.id for the assembly item
          const assemblyResourcePath = assemblyResource['@odata.id'];
          const assemblyData: AssemblyData = {
            odataId: `${assemblyResourcePath}/Assemblies/${entry.MemberId}`,
            memberId: entry.MemberId,
            serviceLabel: serviceLabel,
            readyToRemove: entry.Oem?.OpenBMC?.ReadyToRemove,
          };

          // TOD (P0-C0-E0)
          if (serviceLabel.endsWith('P0-C0-E0')) {
            result.todObject = assemblyData;
            result.readyToRemove = entry.Oem?.OpenBMC?.ReadyToRemove ?? null;
          }
          // Control Panel (D0)
          else if (serviceLabel.endsWith('D0')) {
            result.controlPanel = assemblyData;
            result.readyToRemoveControlPanel =
              entry.Oem?.OpenBMC?.ReadyToRemove ?? null;
          }
          // Control Panel Display (D1)
          else if (serviceLabel.endsWith('D1')) {
            result.controlPanelDisp = assemblyData;
            result.readyToRemoveControlPanelDisp =
              entry.Oem?.OpenBMC?.ReadyToRemove ?? null;
          }
        }
      });
    });
    return result;
  });

  // Helper function to update ReadyToRemove state
  const updateReadyToRemove = async (
    assemblyPath: string,
    memberId: string,
    state: boolean,
    onSuccess?: () => void,
  ) => {
    try {
      await patchResource({
        endpoint: assemblyPath,
        field: 'Assemblies',
        value: [
          {
            MemberId: memberId,
            Oem: {
              OpenBMC: {
                ReadyToRemove: state,
              },
            },
          },
        ],
        invalidateQueries: [
          ['redfish', 'allSubResources', '/redfish/v1/Chassis', 'Assembly'],
        ],
        onSuccess,
      });
    } catch (error) {
      console.error('Error updating ReadyToRemove:', error);
      throw new Error(
        i18n.global.t(
          'pageConcurrentMaintenance.toast.errorSaveReadyToRemove',
          {
            state: state ? 'enabling' : 'disabling',
          },
        ),
      );
    }
  };

  // Helper functions for updating each component
  const updateTodState = async (state: boolean, onSuccess?: () => void) => {
    if (!assemblyData.value?.todObject?.memberId) {
      throw new Error('TOD object not found');
    }
    if (!assemblyData.value?.todObject?.odataId) {
      throw new Error('TOD object path not found');
    }
    // Extract the Assembly path from the object's @odata.id
    const assemblyPath =
      assemblyData.value.todObject.odataId.split('/Assemblies/')[0];
    await updateReadyToRemove(
      assemblyPath,
      assemblyData.value.todObject.memberId,
      state,
      onSuccess,
    );
  };

  const updateControlPanelState = async (
    state: boolean,
    onSuccess?: () => void,
  ) => {
    if (!assemblyData.value?.controlPanel?.memberId) {
      throw new Error('Control Panel object not found');
    }
    if (!assemblyData.value?.controlPanel?.odataId) {
      throw new Error('Control Panel object path not found');
    }
    // Extract the Assembly path from the object's @odata.id
    const assemblyPath =
      assemblyData.value.controlPanel.odataId.split('/Assemblies/')[0];
    await updateReadyToRemove(
      assemblyPath,
      assemblyData.value.controlPanel.memberId,
      state,
      onSuccess,
    );
  };

  const updateControlPanelDispState = async (
    state: boolean,
    onSuccess?: () => void,
  ) => {
    if (!assemblyData.value?.controlPanelDisp?.memberId) {
      throw new Error('Control Panel Display object not found');
    }
    if (!assemblyData.value?.controlPanelDisp?.odataId) {
      throw new Error('Control Panel Display object path not found');
    }
    // Extract the Assembly path from the object's @odata.id
    const assemblyPath =
      assemblyData.value.controlPanelDisp.odataId.split('/Assemblies/')[0];
    await updateReadyToRemove(
      assemblyPath,
      assemblyData.value.controlPanelDisp.memberId,
      state,
      onSuccess,
    );
  };

  // Create writable refs that auto-sync with query data
  const readyToRemove = useWritableQueryState(
    () => assemblyData.value?.readyToRemove ?? null,
  );

  const readyToRemoveControlPanel = useWritableQueryState(
    () => assemblyData.value?.readyToRemoveControlPanel ?? null,
  );

  const readyToRemoveControlPanelDisp = useWritableQueryState(
    () => assemblyData.value?.readyToRemoveControlPanelDisp ?? null,
  );

  return {
    // Data - writable refs that auto-sync with query data
    readyToRemove,
    readyToRemoveControlPanel,
    readyToRemoveControlPanelDisp,

    // Loading states
    isLoading,
    isFetching,
    isUpdating,

    // Error states
    error,
    isError,

    // Actions
    refetch,
    updateTodState,
    updateControlPanelState,
    updateControlPanelDispState,
  };
}
