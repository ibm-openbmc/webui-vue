import { ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore
import api from '@/store/api';
// @ts-ignore
import i18n from '@/i18n';
import { useAllSubResources } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { Resource } from '@/types/redfish';

const PARENT_PATH = '/redfish/v1/Chassis';
const SUB_KEY = 'PCIeSlots';

export interface PcieSlotData {
  type: string | undefined;
  identifyLed: boolean | undefined;
  locationNumber: string | undefined;
}

interface RawPcieSlots extends Resource {
  Slots?: Array<{
    SlotType?: string;
    LocationIndicatorActive?: boolean;
    Location?: { PartLocation?: { ServiceLabel?: string } };
  }>;
}

function processPcieSlot(slot: NonNullable<RawPcieSlots['Slots']>[number]): PcieSlotData {
  return {
    type: slot.SlotType,
    identifyLed: slot.LocationIndicatorActive,
    locationNumber: slot.Location?.PartLocation?.ServiceLabel,
  };
}

/**
 * Composable for fetching PCIe Slots via Chassis → PCIeSlots with TanStack Query.
 * Uses the shared inventory preset and follows the useInventory pattern.
 *
 * NOTE: PCIeSlots is a sub-resource container, not a collection of individual resources.
 * The raw data comes back as objects with a `Slots` array, so we flatten those here.
 */
export function usePcieSlots() {
  const queryClient = useQueryClient();

  // PCIeSlots endpoint returns a single resource with a Slots array, not a collection.
  // useAllSubResources fetches Chassis members and then navigates to each PCIeSlots sub-resource.
  const { data: pcieSlotsContainersRaw, isLoading, refetch } = useAllSubResources<RawPcieSlots>(
    PARENT_PATH,
    SUB_KEY,
    { queryConfig: RedfishQueryPresets.inventory },
  );

  const pcieSlots = ref<PcieSlotData[]>([]);

  watch(pcieSlotsContainersRaw, (raw) => {
    if (!raw) {
      pcieSlots.value = [];
      return;
    }
    // Each item is a PCIeSlots resource containing a Slots array
    const allSlots: PcieSlotData[] = [];
    for (const container of raw) {
      const slots = (container as any).Slots ?? [];
      for (const slot of slots) {
        allSlots.push(processPcieSlot(slot));
      }
    }
    pcieSlots.value = allSlots;
  }, { immediate: true });

  const updateIdentifyLedMutation = useMutation({
    mutationFn: async ({
      chassisUri,
      locationNumber,
      identifyLed,
      currentSlots,
    }: {
      chassisUri: string;
      locationNumber: string;
      identifyLed: boolean;
      currentSlots: PcieSlotData[];
    }) => {
      const payload = currentSlots.map((slot) =>
        slot.locationNumber === locationNumber
          ? { LocationIndicatorActive: identifyLed }
          : {},
      );
      await api.patch(`${chassisUri}/PCIeSlots`, { Slots: payload });
      return identifyLed
        ? i18n.global.t('pageInventory.toast.successEnableIdentifyLed')
        : i18n.global.t('pageInventory.toast.successDisableIdentifyLed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['redfish', 'allSubResources', PARENT_PATH, SUB_KEY] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['redfish', 'allSubResources', PARENT_PATH, SUB_KEY] });
    },
  });

  const updateIdentifyLed = async (
    chassisUri: string,
    locationNumber: string,
    identifyLed: boolean,
  ): Promise<string> => {
    try {
      return await updateIdentifyLedMutation.mutateAsync({
        chassisUri,
        locationNumber,
        identifyLed,
        currentSlots: pcieSlots.value,
      });
    } catch {
      throw new Error(
        identifyLed
          ? i18n.global.t('pageInventory.toast.errorEnableIdentifyLed')
          : i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
      );
    }
  };

  return { pcieSlots, isLoading, refetch, updateIdentifyLed };
}
