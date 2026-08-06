import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';
import { useMemory } from '@/api/composables/useMemory';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/api/composables/useBiosAttributes', () => ({
  useBiosAttributes: vi.fn(),
}));

import { useBiosAttributes } from '@/api/composables/useBiosAttributes';

// ── Shared helpers ─────────────────────────────────────────────────────────────

/**
 * Returns a stub useBiosAttributes return value.
 * Individual attribute refs can be overridden via `attrOverrides`.
 */
function stubBiosAttributes(attrOverrides = {}, biosDataOverride = {}) {
  const defaultBiosData = {
    hb_memory_region_size: null,
    hb_ioadapter_enlarged_capacity: null,
    hb_storage_preallocation_for_drawer_attach: null,
    hb_number_huge_pages: null,
    pvm_hmc_managed: null,
    hb_memory_mirror_mode: null,
    hb_predictive_mem_guard: null,
    hb_max_number_huge_pages: null,
    ...biosDataOverride,
  };

  const mockGetBiosAttribute = vi.fn((name) =>
    computed(() => defaultBiosData[name] ?? null),
  );

  const mockGetBiosBooleanAttribute = vi.fn((name) =>
    computed(() => {
      const val = defaultBiosData[name];
      if (val === null || val === undefined) return null;
      return val === 'Enabled';
    }),
  );

  const mockGetRegistryOptions = vi.fn(() => computed(() => []));
  const mockGetRegistryCurrentValue = vi.fn(() => computed(() => null));
  const mockGetRegistryUpperBound = vi.fn(() => computed(() => null));

  const mockUpdateBiosAttribute = vi.fn().mockResolvedValue(undefined);
  const mockUpdateBiosBooleanAttribute = vi.fn().mockResolvedValue(undefined);

  return {
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    getBiosAttribute: mockGetBiosAttribute,
    getBiosBooleanAttribute: mockGetBiosBooleanAttribute,
    getRegistryOptions: mockGetRegistryOptions,
    getRegistryCurrentValue: mockGetRegistryCurrentValue,
    getRegistryUpperBound: mockGetRegistryUpperBound,
    updateBiosAttribute: mockUpdateBiosAttribute,
    updateBiosBooleanAttribute: mockUpdateBiosBooleanAttribute,
    isUpdating: ref(false),
    ...attrOverrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useMemory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Return shape ─────────────────────────────────────────────────────────────

  describe('Return shape', () => {
    it('returns all expected properties', () => {
      useBiosAttributes.mockReturnValue(stubBiosAttributes());
      const result = useMemory();

      const expectedKeys = [
        'logicalMemorySize',
        'logicalMemorySizeOptions',
        'ioAdapterCapacity',
        'dynamicIoDrawerCapacity',
        'dynamicIoDrawerDefaultCapacity',
        'maxNumHugePages',
        'numHugePages',
        'hmcManaged',
        'memoryMirroringMode',
        'predictiveDynamicMemoryDeallocation',
        'isFetching',
        'isError',
        'error',
        'saveLogicalMemorySize',
        'savePageSetup',
        'saveEnlargedCapacity',
        'saveDynamicCapacity',
        'saveActiveMemoryMirroringMode',
        'savePredictiveDynamicMemoryDeallocation',
        'isUpdating',
      ];

      for (const key of expectedKeys) {
        expect(result, `missing property: ${key}`).toHaveProperty(key);
      }
    });
  });

  // ── Loading and error state passthrough ───────────────────────────────────────

  describe('Loading and error state', () => {
    it('isFetching reflects useBiosAttributes isFetching', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({ isFetching: ref(true) }),
      );
      const { isFetching } = useMemory();
      expect(isFetching.value).toBe(true);
    });

    it('isError reflects useBiosAttributes isError', () => {
      const err = new Error('bios load failed');
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({ isError: ref(true), error: ref(err) }),
      );
      const { isError, error } = useMemory();
      expect(isError.value).toBe(true);
      expect(error.value.message).toBe('bios load failed');
    });

    it('isUpdating reflects useBiosAttributes isUpdating', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({ isUpdating: ref(true) }),
      );
      const { isUpdating } = useMemory();
      expect(isUpdating.value).toBe(true);
    });
  });

  // ── BIOS attribute bindings ───────────────────────────────────────────────────

  describe('BIOS attribute bindings', () => {
    it('calls getBiosAttribute for hb_memory_region_size', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith(
        'hb_memory_region_size',
      );
    });

    it('calls getBiosAttribute for hb_ioadapter_enlarged_capacity', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith(
        'hb_ioadapter_enlarged_capacity',
      );
    });

    it('calls getBiosAttribute for hb_storage_preallocation_for_drawer_attach', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith(
        'hb_storage_preallocation_for_drawer_attach',
      );
    });

    it('calls getBiosAttribute for hb_number_huge_pages', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith(
        'hb_number_huge_pages',
      );
    });

    it('calls getBiosBooleanAttribute for hb_memory_mirror_mode', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_memory_mirror_mode',
      );
    });

    it('calls getBiosBooleanAttribute for hb_predictive_mem_guard', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_predictive_mem_guard',
      );
    });

    it('calls getRegistryOptions for hb_memory_region_size', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getRegistryOptions).toHaveBeenCalledWith(
        'hb_memory_region_size',
      );
    });

    it('calls getRegistryCurrentValue for hb_max_number_huge_pages', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getRegistryCurrentValue).toHaveBeenCalledWith(
        'hb_max_number_huge_pages',
      );
    });

    it('calls getRegistryUpperBound for hb_storage_preallocation_for_drawer_attach', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      expect(stub.getRegistryUpperBound).toHaveBeenCalledWith(
        'hb_storage_preallocation_for_drawer_attach',
      );
    });
  });

  // ── Mutation wrappers ─────────────────────────────────────────────────────────

  describe('Mutation wrappers', () => {
    it('saveLogicalMemorySize calls updateBiosAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveLogicalMemorySize } = useMemory();
      await saveLogicalMemorySize('2GB');

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'hb_memory_region_size',
        '2GB',
      );
    });

    it('savePageSetup calls updateBiosAttribute with hb_number_huge_pages', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { savePageSetup } = useMemory();
      await savePageSetup(4);

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'hb_number_huge_pages',
        4,
      );
    });

    it('saveEnlargedCapacity calls updateBiosAttribute with hb_ioadapter_enlarged_capacity', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveEnlargedCapacity } = useMemory();
      await saveEnlargedCapacity(8);

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'hb_ioadapter_enlarged_capacity',
        8,
      );
    });

    it('saveDynamicCapacity calls updateBiosAttribute with hb_storage_preallocation_for_drawer_attach', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveDynamicCapacity } = useMemory();
      await saveDynamicCapacity(16);

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'hb_storage_preallocation_for_drawer_attach',
        16,
      );
    });

    it('saveActiveMemoryMirroringMode calls updateBiosBooleanAttribute with hb_memory_mirror_mode', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveActiveMemoryMirroringMode } = useMemory();
      await saveActiveMemoryMirroringMode(true);

      expect(stub.updateBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_memory_mirror_mode',
        true,
      );
    });

    it('savePredictiveDynamicMemoryDeallocation calls updateBiosBooleanAttribute with hb_predictive_mem_guard', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { savePredictiveDynamicMemoryDeallocation } = useMemory();
      await savePredictiveDynamicMemoryDeallocation(false);

      expect(stub.updateBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_predictive_mem_guard',
        false,
      );
    });

    it('mutation propagates rejection from updateBiosAttribute', async () => {
      const stub = stubBiosAttributes();
      stub.updateBiosAttribute.mockRejectedValue(new Error('patch failed'));
      useBiosAttributes.mockReturnValue(stub);

      const { saveLogicalMemorySize } = useMemory();

      await expect(saveLogicalMemorySize('2GB')).rejects.toThrow(
        'patch failed',
      );
    });
  });
});
