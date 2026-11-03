import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';
import { useMemory } from '@/api/composables/useMemory';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/api/composables/useBiosAttributes', () => ({
  useBiosAttributes: vi.fn(),
}));

vi.mock('@/api/composables/useChassisInventory', () => ({
  useChassisInventory: vi.fn(),
}));

import { useBiosAttributes } from '@/api/composables/useBiosAttributes';
import { useChassisInventory } from '@/api/composables/useChassisInventory';

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
  const mockGetRegistryLowerBound = vi.fn(() => computed(() => null));
  const mockGetRegistryUpperBound = vi.fn(() => computed(() => null));

  const mockUpdateBiosAttribute = vi.fn().mockResolvedValue(undefined);
  const mockUpdateBiosAttributes = vi.fn().mockResolvedValue(undefined);
  const mockUpdateBiosBooleanAttribute = vi.fn().mockResolvedValue(undefined);

  return {
    isLoading: ref(false),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    getBiosAttribute: mockGetBiosAttribute,
    getBiosBooleanAttribute: mockGetBiosBooleanAttribute,
    getRegistryOptions: mockGetRegistryOptions,
    getRegistryCurrentValue: mockGetRegistryCurrentValue,
    getRegistryLowerBound: mockGetRegistryLowerBound,
    getRegistryUpperBound: mockGetRegistryUpperBound,
    updateBiosAttribute: mockUpdateBiosAttribute,
    updateBiosAttributes: mockUpdateBiosAttributes,
    updateBiosBooleanAttribute: mockUpdateBiosBooleanAttribute,
    isUpdating: ref(false),
    ...attrOverrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useMemory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useChassisInventory.mockReturnValue({
      chassis: ref([]),
      isLoading: ref(false),
    });
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
        'ioAdapterNodes',
        'dynamicIoDrawerNodes',
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
        'saveNodeAttributes',
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

  // ── Multi-node attributes ─────────────────────────────────────────────────────

  describe('Multi-node attributes', () => {
    it('requests _n1 to _n8 attributes for both multi-node settings', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useMemory();

      for (let i = 1; i <= 8; i++) {
        expect(stub.getBiosAttribute).toHaveBeenCalledWith(
          `hb_ioadapter_enlarged_capacity_n${i}`,
        );
        expect(stub.getBiosAttribute).toHaveBeenCalledWith(
          `hb_storage_preallocation_for_drawer_attach_n${i}`,
        );
      }
    });

    it('lists only the nodes present in BIOS data', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity_n1: 1,
            hb_ioadapter_enlarged_capacity_n3: 3,
            hb_storage_preallocation_for_drawer_attach_n2: 5,
          },
        ),
      );

      const { ioAdapterNodes, dynamicIoDrawerNodes } = useMemory();

      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([1, 3]);
      expect(ioAdapterNodes.value[1]).toMatchObject({
        attributeName: 'hb_ioadapter_enlarged_capacity_n3',
        value: 3,
      });
      expect(dynamicIoDrawerNodes.value).toHaveLength(1);
      expect(dynamicIoDrawerNodes.value[0].attributeName).toBe(
        'hb_storage_preallocation_for_drawer_attach_n2',
      );
    });

    it('hides nodes whose chassis is Absent', () => {
      useChassisInventory.mockReturnValue({
        isLoading: ref(false),
        chassis: ref([
          { id: 'chassis1', statusState: 'Enabled' },
          { id: 'chassis2', statusState: 'Absent' },
          { id: 'chassis3', statusState: 'Enabled' },
        ]),
      });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity_n1: 1,
            hb_ioadapter_enlarged_capacity_n2: 2,
            hb_ioadapter_enlarged_capacity_n3: 3,
            hb_storage_preallocation_for_drawer_attach_n2: 5,
          },
        ),
      );

      const { ioAdapterNodes, dynamicIoDrawerNodes } = useMemory();

      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([1, 3]);
      expect(dynamicIoDrawerNodes.value).toEqual([]);
    });

    it('matches the chassis by Name when the Id has no node number', () => {
      useChassisInventory.mockReturnValue({
        isLoading: ref(false),
        chassis: ref([
          { id: 'abc', name: 'Chassis 1', statusState: 'Absent' },
          { id: 'chassis-2', name: 'x', statusState: 'Absent' },
          { id: 'chassis3', name: 'Chassis 3', statusState: 'Enabled' },
        ]),
      });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity_n1: 1,
            hb_ioadapter_enlarged_capacity_n2: 2,
            hb_ioadapter_enlarged_capacity_n3: 3,
          },
        ),
      );

      const { ioAdapterNodes } = useMemory();

      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([3]);
    });

    it('keeps nodes visible for non-Absent states such as StandbyOffline', () => {
      useChassisInventory.mockReturnValue({
        isLoading: ref(false),
        chassis: ref([
          { id: 'chassis1', statusState: 'Enabled' },
          { id: 'chassis2', statusState: 'StandbyOffline' },
        ]),
      });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity_n1: 1,
            hb_ioadapter_enlarged_capacity_n2: 2,
          },
        ),
      );

      const { ioAdapterNodes } = useMemory();

      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([1, 2]);
    });

    it('shows no nodes while the chassis list is still loading', () => {
      const isLoading = ref(true);
      useChassisInventory.mockReturnValue({ chassis: ref([]), isLoading });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity_n1: 1,
            hb_storage_preallocation_for_drawer_attach_n1: 1,
          },
        ),
      );

      const { ioAdapterNodes, dynamicIoDrawerNodes } = useMemory();
      expect(ioAdapterNodes.value).toEqual([]);
      expect(dynamicIoDrawerNodes.value).toEqual([]);

      isLoading.value = false;
      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([1]);
      expect(dynamicIoDrawerNodes.value.map((n) => n.node)).toEqual([1]);
    });

    it('reports loading/fetching while the chassis list is loading', () => {
      const isChassisLoading = ref(true);
      useChassisInventory.mockReturnValue({
        chassis: ref([]),
        isLoading: isChassisLoading,
      });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({
          isLoading: ref(false),
          isFetching: ref(false),
        }),
      );

      const { isLoading, isFetching } = useMemory();
      expect(isLoading.value).toBe(true);
      expect(isFetching.value).toBe(true);

      isChassisLoading.value = false;
      expect(isLoading.value).toBe(false);
      expect(isFetching.value).toBe(false);
    });

    it('reacts when a chassis becomes Absent', () => {
      const chassis = ref([{ id: 'chassis2', statusState: 'Enabled' }]);
      useChassisInventory.mockReturnValue({ chassis, isLoading: ref(false) });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { hb_ioadapter_enlarged_capacity_n2: 2 }),
      );

      const { ioAdapterNodes } = useMemory();
      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([2]);

      chassis.value = [{ id: 'chassis2', statusState: 'Absent' }];
      expect(ioAdapterNodes.value).toEqual([]);
    });

    it('does not fall back to node 0 when all _nN chassis are Absent', () => {
      useChassisInventory.mockReturnValue({
        isLoading: ref(false),
        chassis: ref([{ id: 'chassis1', statusState: 'Absent' }]),
      });
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity: 7,
            hb_ioadapter_enlarged_capacity_n1: 1,
          },
        ),
      );

      const { ioAdapterNodes } = useMemory();

      expect(ioAdapterNodes.value).toEqual([]);
    });

    it('ignores the un-suffixed base attribute when _nN attributes exist', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes(
          {},
          {
            hb_ioadapter_enlarged_capacity: 7,
            hb_ioadapter_enlarged_capacity_n1: 1,
          },
        ),
      );

      const { ioAdapterNodes } = useMemory();

      expect(ioAdapterNodes.value.map((n) => n.node)).toEqual([1]);
    });

    it('falls back to the single-node attribute as node 0 when no _nN attributes exist', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { hb_ioadapter_enlarged_capacity: 7 }),
      );

      const { ioAdapterNodes, dynamicIoDrawerNodes } = useMemory();

      expect(ioAdapterNodes.value).toEqual([
        {
          node: 0,
          attributeName: 'hb_ioadapter_enlarged_capacity',
          value: 7,
          min: null,
          max: null,
        },
      ]);
      expect(dynamicIoDrawerNodes.value).toEqual([]);
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

    it('saveNodeAttributes calls updateBiosAttributes with all given attributes', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveNodeAttributes } = useMemory();
      await saveNodeAttributes({
        hb_ioadapter_enlarged_capacity_n1: 2,
        hb_ioadapter_enlarged_capacity_n2: 4,
      });

      expect(stub.updateBiosAttributes).toHaveBeenCalledWith({
        hb_ioadapter_enlarged_capacity_n1: 2,
        hb_ioadapter_enlarged_capacity_n2: 4,
      });
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
