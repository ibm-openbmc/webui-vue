import { useBiosAttributes } from './useBiosAttributes';

/**
 * Composable for Memory page - uses generic useBiosAttributes
 * Provides memory-specific computed properties and methods
 */
export function useMemory() {
  const {
    isLoading,
    isFetching,
    isError,
    error,
    getBiosAttribute,
    getBiosBooleanAttribute,
    getRegistryOptions,
    getRegistryCurrentValue,
    getRegistryUpperBound,
    updateBiosAttribute,
    updateBiosBooleanAttribute,
    isUpdating,
  } = useBiosAttributes();

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
  const dynamicIoDrawerDefaultCapacity = getRegistryUpperBound(
    'hb_storage_preallocation_for_drawer_attach',
  );

  // Mutation methods
  const saveLogicalMemorySize = async (size: string): Promise<void> => {
    return updateBiosAttribute('hb_memory_region_size', size);
  };

  const savePageSetup = async (pages: number): Promise<void> => {
    return updateBiosAttribute('hb_number_huge_pages', pages);
  };

  const saveEnlargedCapacity = async (capacity: number): Promise<void> => {
    return updateBiosAttribute('hb_ioadapter_enlarged_capacity', capacity);
  };

  const saveDynamicCapacity = async (capacity: number): Promise<void> => {
    return updateBiosAttribute(
      'hb_storage_preallocation_for_drawer_attach',
      capacity,
    );
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
    ioAdapterCapacity,
    dynamicIoDrawerCapacity,
    dynamicIoDrawerDefaultCapacity,
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
    saveEnlargedCapacity,
    saveDynamicCapacity,
    saveActiveMemoryMirroringMode,
    savePredictiveDynamicMemoryDeallocation,

    // Mutation state
    isUpdating,
  };
}
