import { computed } from 'vue';
import { useBiosAttributes } from './useBiosAttributes';
import { useChassisInventory } from './useChassisInventory';

const HIDDEN_NODE_STATES = ['absent'];
const normalizeState = (state: string | undefined): string =>
  (state ?? '').replace(/\s+/g, '').toLowerCase();

const CHASSIS_NODE_PATTERN = /^chassis[\s_-]*(\d+)$/i;

const IO_ADAPTER_CAPACITY_ATTR = 'hb_ioadapter_enlarged_capacity';
const DYNAMIC_IO_DRAWER_ATTR = 'hb_storage_preallocation_for_drawer_attach';
const MAX_NODES = 8;

/**
 * Composable for Memory page - uses generic useBiosAttributes
 * Provides memory-specific computed properties and methods
 */
export function useMemory() {
  const {
    isLoading: isBiosLoading,
    isFetching: isBiosFetching,
    isError,
    error,
    getBiosAttribute,
    getBiosBooleanAttribute,
    getRegistryOptions,
    getRegistryCurrentValue,
    getRegistryLowerBound,
    getRegistryUpperBound,
    updateBiosAttribute,
    updateBiosAttributes,
    updateBiosBooleanAttribute,
    isUpdating,
  } = useBiosAttributes();

  const { chassis, isLoading: isChassisLoading } = useChassisInventory();

  const isLoading = computed(
    () => isBiosLoading.value || isChassisLoading.value,
  );
  const isFetching = computed(
    () => isBiosFetching.value || isChassisLoading.value,
  );
  const absentNodes = computed(() => {
    const absent = new Set<number>();
    for (const item of chassis.value) {
      const match =
        CHASSIS_NODE_PATTERN.exec(item.id ?? '') ??
        CHASSIS_NODE_PATTERN.exec(item.name ?? '');
      if (
        match &&
        HIDDEN_NODE_STATES.includes(normalizeState(item.statusState))
      ) {
        absent.add(Number(match[1]));
      }
    }
    return absent;
  });

  // Memory-specific BIOS attributes
  const logicalMemorySize = getBiosAttribute('hb_memory_region_size');
  const ioAdapterCapacity = getBiosAttribute('hb_ioadapter_enlarged_capacity');
  const dynamicIoDrawerCapacity = getBiosAttribute(
    'hb_storage_preallocation_for_drawer_attach',
  );
  const numHugePages = getBiosAttribute('hb_number_huge_pages');
  const hmcManaged = getBiosAttribute('pvm_hmc_managed');
  const memoryMirroringMode = getBiosBooleanAttribute('hb_memory_mirror_mode');
  const predictiveDynamicMemoryDeallocation = getBiosBooleanAttribute(
    'hb_predictive_mem_guard',
  );

  // Memory-specific registry attributes
  const logicalMemorySizeOptions = getRegistryOptions('hb_memory_region_size');
  const maxNumHugePages = getRegistryCurrentValue('hb_max_number_huge_pages');
  const ioAdapterCapacityMin = getRegistryLowerBound(
    'hb_ioadapter_enlarged_capacity',
  );
  const ioAdapterCapacityMax = getRegistryUpperBound(
    'hb_ioadapter_enlarged_capacity',
  );
  const dynamicIoDrawerDefaultCapacity = getRegistryUpperBound(
    'hb_storage_preallocation_for_drawer_attach',
  );

  // Multi-node support
  const buildNodeAttributes = (
    baseName: string,
    legacyValue: typeof ioAdapterCapacity,
    legacyMin: typeof ioAdapterCapacityMin,
    legacyMax: typeof ioAdapterCapacityMax,
  ) => {
    const perNode = Array.from({ length: MAX_NODES }, (_, i) => {
      const name = `${baseName}_n${i + 1}`;
      return {
        node: i + 1,
        attributeName: name,
        value: getBiosAttribute(name),
        min: getRegistryLowerBound(name),
        max: getRegistryUpperBound(name),
      };
    });
    return computed(() => {
      if (isChassisLoading.value) return [];
      const inBios = perNode.filter((n) => n.value.value !== null);
      const nodes = inBios
        .filter((n) => !absentNodes.value.has(n.node))
        .map((n) => ({
          node: n.node,
          attributeName: n.attributeName,
          value: n.value.value,
          min: n.min.value ?? legacyMin.value,
          max: n.max.value ?? legacyMax.value,
        }));
      if (inBios.length > 0 || legacyValue.value === null) return nodes;
      return [
        {
          node: 0,
          attributeName: baseName,
          value: legacyValue.value,
          min: legacyMin.value,
          max: legacyMax.value,
        },
      ];
    });
  };

  const ioAdapterNodes = buildNodeAttributes(
    IO_ADAPTER_CAPACITY_ATTR,
    ioAdapterCapacity,
    ioAdapterCapacityMin,
    ioAdapterCapacityMax,
  );
  const dynamicIoDrawerNodes = buildNodeAttributes(
    DYNAMIC_IO_DRAWER_ATTR,
    dynamicIoDrawerCapacity,
    computed(() => 0),
    dynamicIoDrawerDefaultCapacity,
  );

  // Mutation methods
  const saveLogicalMemorySize = async (size: string): Promise<void> => {
    return updateBiosAttribute('hb_memory_region_size', size);
  };

  const savePageSetup = async (pages: number): Promise<void> => {
    return updateBiosAttribute('hb_number_huge_pages', pages);
  };

  const saveNodeAttributes = async (
    attributes: Record<string, number>,
  ): Promise<void> => {
    return updateBiosAttributes(attributes);
  };

  const saveActiveMemoryMirroringMode = async (
    enabled: boolean,
  ): Promise<void> => {
    return updateBiosBooleanAttribute('hb_memory_mirror_mode', enabled);
  };

  const savePredictiveDynamicMemoryDeallocation = async (
    enabled: boolean,
  ): Promise<void> => {
    return updateBiosBooleanAttribute('hb_predictive_mem_guard', enabled);
  };

  return {
    // Data
    logicalMemorySize,
    logicalMemorySizeOptions,
    ioAdapterNodes,
    dynamicIoDrawerNodes,
    maxNumHugePages,
    numHugePages,
    hmcManaged,
    memoryMirroringMode,
    predictiveDynamicMemoryDeallocation,

    // Loading and error states
    isLoading,
    isFetching,
    isError,
    error,

    // Mutations
    saveLogicalMemorySize,
    savePageSetup,
    saveNodeAttributes,
    saveActiveMemoryMirroringMode,
    savePredictiveDynamicMemoryDeallocation,

    // Mutation state
    isUpdating,
  };
}
