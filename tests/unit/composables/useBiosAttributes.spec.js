import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { useBiosAttributes } from '@/api/composables/useBiosAttributes';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeBiosQuery(data = null, overrides = {}) {
  return {
    data: ref(data),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    refetch: vi.fn(),
    ...overrides,
  };
}

function makeRegistryQuery(data = null, overrides = {}) {
  return {
    data: ref(data),
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    refetch: vi.fn(),
    ...overrides,
  };
}

function stubMutation(overrides = {}) {
  return {
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: ref(false),
    ...overrides,
  };
}

/** Wire useQuery so 1st call = biosQuery, 2nd = registryQuery */
function setupQueries(
  biosOverrides = {},
  registryOverrides = {},
  biosData = null,
  registryData = null,
) {
  let call = 0;
  useQuery.mockImplementation(() => {
    return call++ === 0
      ? makeBiosQuery(biosData, biosOverrides)
      : makeRegistryQuery(registryData, registryOverrides);
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useBiosAttributes', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    useMutation.mockReturnValue(stubMutation());
    // default: both queries return null data
    setupQueries();
  });

  afterEach(() => vi.restoreAllMocks());

  // ── Return shape ──────────────────────────────────────────────────────────────

  describe('Return shape', () => {
    it('returns all expected properties', () => {
      const result = useBiosAttributes();
      const keys = [
        'biosData',
        'registryData',
        'isFetching',
        'isFetchingBios',
        'isFetchingRegistry',
        'isError',
        'error',
        'refetchBios',
        'refetchRegistry',
        'getBiosAttribute',
        'getBiosBooleanAttribute',
        'getRegistryOptions',
        'getRegistryCurrentValue',
        'getRegistryUpperBound',
        'updateBiosAttributes',
        'updateBiosAttribute',
        'updateBiosBooleanAttribute',
        'isUpdating',
      ];
      for (const key of keys)
        expect(result, `missing: ${key}`).toHaveProperty(key);
    });
  });

  // ── Query key configuration ───────────────────────────────────────────────────

  describe('useQuery configurations', () => {
    it('sets bios query key to ["redfish","systems","system","bios"]', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      expect(capturedOptions[0].queryKey).toEqual([
        'redfish',
        'systems',
        'system',
        'bios',
      ]);
    });

    it('sets registry query key to ["redfish","registries","bios"]', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      expect(capturedOptions[1].queryKey).toEqual([
        'redfish',
        'registries',
        'bios',
      ]);
    });

    it('bios queryFn fetches /redfish/v1/Systems/system/Bios and returns Attributes', async () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      api.get.mockResolvedValue({ data: { Attributes: { key: 'val' } } });
      useBiosAttributes();
      const result = await capturedOptions[0].queryFn();
      expect(api.get).toHaveBeenCalledWith('/redfish/v1/Systems/system/Bios');
      expect(result).toEqual({ key: 'val' });
    });

    it('bios queryFn returns empty object when Attributes is absent', async () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      api.get.mockResolvedValue({ data: {} });
      useBiosAttributes();
      const result = await capturedOptions[0].queryFn();
      expect(result).toEqual({});
    });

    it('registry queryFn fetches BiosAttributeRegistry and returns Attributes array', async () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      const attrs = [{ AttributeName: 'foo' }];
      api.get.mockResolvedValue({
        data: { RegistryEntries: { Attributes: attrs } },
      });
      useBiosAttributes();
      const result = await capturedOptions[1].queryFn();
      expect(result).toEqual(attrs);
    });

    it('registry queryFn returns empty array when RegistryEntries is absent', async () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      api.get.mockResolvedValue({ data: {} });
      useBiosAttributes();
      const result = await capturedOptions[1].queryFn();
      expect(result).toEqual([]);
    });

    it('bios retry returns false for 4xx status', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      const retryFn = capturedOptions[0].retry;
      expect(retryFn(0, { response: { status: 403 } })).toBe(false);
      expect(retryFn(0, { response: { status: 404 } })).toBe(false);
    });

    it('bios retry returns true for server errors up to 2 attempts', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      const retryFn = capturedOptions[0].retry;
      expect(retryFn(0, { response: { status: 503 } })).toBe(true);
      expect(retryFn(1, { response: { status: 503 } })).toBe(true);
      expect(retryFn(2, { response: { status: 503 } })).toBe(false);
    });

    it('registry retry returns false for 4xx and true for 5xx up to 2 attempts', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      const retryFn = capturedOptions[1].retry;
      expect(retryFn(0, { response: { status: 400 } })).toBe(false);
      expect(retryFn(0, { response: { status: 500 } })).toBe(true);
      expect(retryFn(2, { response: { status: 500 } })).toBe(false);
    });

    it('retryDelay returns exponential backoff capped at 10 seconds', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      const retryDelay = capturedOptions[0].retryDelay;
      expect(retryDelay(0)).toBe(1000);
      expect(retryDelay(1)).toBe(2000);
      expect(retryDelay(10)).toBe(10000);
    });

    it('registry query retryDelay returns exponential backoff capped at 10 seconds', () => {
      const capturedOptions = [];
      useQuery.mockImplementation((opts) => {
        capturedOptions.push(opts);
        return makeBiosQuery();
      });
      useBiosAttributes();
      const retryDelay = capturedOptions[1].retryDelay;
      expect(retryDelay(0)).toBe(1000);
      expect(retryDelay(1)).toBe(2000);
      expect(retryDelay(10)).toBe(10000);
    });
  });

  // ── Derived loading states ────────────────────────────────────────────────────

  describe('Derived loading states', () => {
    it('isFetching is true when bios is fetching', () => {
      setupQueries({ isFetching: ref(true) });
      const { isFetching } = useBiosAttributes();
      expect(isFetching.value).toBe(true);
    });

    it('isFetching is true when registry is fetching', () => {
      setupQueries({}, { isFetching: ref(true) });
      const { isFetching } = useBiosAttributes();
      expect(isFetching.value).toBe(true);
    });

    it('isFetching is false when neither is fetching', () => {
      setupQueries();
      const { isFetching } = useBiosAttributes();
      expect(isFetching.value).toBe(false);
    });

    it('isError is true when bios query has error', () => {
      setupQueries({ isError: ref(true) });
      const { isError } = useBiosAttributes();
      expect(isError.value).toBe(true);
    });

    it('isError is true when only registry query has error', () => {
      setupQueries({ isError: ref(false) }, { isError: ref(true) });
      const { isError } = useBiosAttributes();
      expect(isError.value).toBe(true);
    });

    it('isError is false when neither query has error', () => {
      setupQueries({ isError: ref(false) }, { isError: ref(false) });
      const { isError } = useBiosAttributes();
      expect(isError.value).toBe(false);
    });

    it('error returns the bios error when present', () => {
      const err = new Error('bios error');
      setupQueries({ error: ref(err) });
      const { error } = useBiosAttributes();
      expect(error.value.message).toBe('bios error');
    });

    it('error falls through to registry error when bios error is null', () => {
      const registryErr = new Error('registry error');
      setupQueries({ error: ref(null) }, { error: ref(registryErr) });
      const { error } = useBiosAttributes();
      expect(error.value.message).toBe('registry error');
    });
  });

  // ── getBiosAttribute ──────────────────────────────────────────────────────────

  describe('getBiosAttribute', () => {
    it('returns attribute value from biosData', () => {
      setupQueries({}, {}, { hb_memory_region_size: '2GB' });
      const { getBiosAttribute } = useBiosAttributes();
      expect(getBiosAttribute('hb_memory_region_size').value).toBe('2GB');
    });

    it('returns null for absent attribute', () => {
      setupQueries({}, {}, {});
      const { getBiosAttribute } = useBiosAttributes();
      expect(getBiosAttribute('missing').value).toBeNull();
    });

    it('returns null when biosData is null', () => {
      setupQueries({}, {}, null);
      const { getBiosAttribute } = useBiosAttributes();
      expect(getBiosAttribute('anything').value).toBeNull();
    });
  });

  // ── getBiosBooleanAttribute ───────────────────────────────────────────────────

  describe('getBiosBooleanAttribute', () => {
    it('returns true when value is "Enabled"', () => {
      setupQueries({}, {}, { hb_memory_mirror_mode: 'Enabled' });
      const { getBiosBooleanAttribute } = useBiosAttributes();
      expect(getBiosBooleanAttribute('hb_memory_mirror_mode').value).toBe(true);
    });

    it('returns false when value is "Disabled"', () => {
      setupQueries({}, {}, { hb_memory_mirror_mode: 'Disabled' });
      const { getBiosBooleanAttribute } = useBiosAttributes();
      expect(getBiosBooleanAttribute('hb_memory_mirror_mode').value).toBe(
        false,
      );
    });

    it('returns null when attribute is absent from biosData', () => {
      setupQueries({}, {}, {});
      const { getBiosBooleanAttribute } = useBiosAttributes();
      expect(getBiosBooleanAttribute('missing').value).toBeNull();
    });
  });

  // ── getRegistryOptions ────────────────────────────────────────────────────────

  describe('getRegistryOptions', () => {
    it('returns ValueName array for matching attribute', () => {
      const registryData = [
        {
          AttributeName: 'hb_memory_region_size',
          Value: [{ ValueName: '2GB' }, { ValueName: '4GB' }],
        },
      ];
      setupQueries({}, {}, null, registryData);
      const { getRegistryOptions } = useBiosAttributes();
      expect(getRegistryOptions('hb_memory_region_size').value).toEqual([
        '2GB',
        '4GB',
      ]);
    });

    it('returns empty array when attribute has no Value', () => {
      const registryData = [{ AttributeName: 'foo' }];
      setupQueries({}, {}, null, registryData);
      const { getRegistryOptions } = useBiosAttributes();
      expect(getRegistryOptions('foo').value).toEqual([]);
    });

    it('returns empty array when registryData is null', () => {
      setupQueries({}, {}, null, null);
      const { getRegistryOptions } = useBiosAttributes();
      expect(getRegistryOptions('anything').value).toEqual([]);
    });
  });

  // ── getRegistryCurrentValue ───────────────────────────────────────────────────

  describe('getRegistryCurrentValue', () => {
    it('returns CurrentValue for matching attribute', () => {
      const registryData = [
        { AttributeName: 'hb_max_number_huge_pages', CurrentValue: 128 },
      ];
      setupQueries({}, {}, null, registryData);
      const { getRegistryCurrentValue } = useBiosAttributes();
      expect(getRegistryCurrentValue('hb_max_number_huge_pages').value).toBe(
        128,
      );
    });

    it('returns null when attribute is absent', () => {
      setupQueries({}, {}, null, []);
      const { getRegistryCurrentValue } = useBiosAttributes();
      expect(getRegistryCurrentValue('missing').value).toBeNull();
    });

    it('returns null when registryData is null', () => {
      setupQueries({}, {}, null, null);
      const { getRegistryCurrentValue } = useBiosAttributes();
      expect(getRegistryCurrentValue('anything').value).toBeNull();
    });
  });

  // ── getRegistryUpperBound ─────────────────────────────────────────────────────

  describe('getRegistryUpperBound', () => {
    it('returns UpperBound for matching attribute', () => {
      const registryData = [
        {
          AttributeName: 'hb_storage_preallocation_for_drawer_attach',
          UpperBound: 64,
        },
      ];
      setupQueries({}, {}, null, registryData);
      const { getRegistryUpperBound } = useBiosAttributes();
      expect(
        getRegistryUpperBound('hb_storage_preallocation_for_drawer_attach')
          .value,
      ).toBe(64);
    });

    it('returns null when UpperBound is absent', () => {
      setupQueries({}, {}, null, [{ AttributeName: 'foo' }]);
      const { getRegistryUpperBound } = useBiosAttributes();
      expect(getRegistryUpperBound('foo').value).toBeNull();
    });

    it('returns null when registryData is null', () => {
      setupQueries({}, {}, null, null);
      const { getRegistryUpperBound } = useBiosAttributes();
      expect(getRegistryUpperBound('anything').value).toBeNull();
    });
  });

  // ── updateBiosAttributes mutation ─────────────────────────────────────────────

  describe('updateBiosAttributes mutation', () => {
    it('patches /redfish/v1/Systems/system/Bios/Settings with Attributes wrapper', async () => {
      let mutationFn;
      useMutation.mockImplementation((opts) => {
        mutationFn = opts.mutationFn;
        return stubMutation();
      });
      api.patch.mockResolvedValue({});
      useBiosAttributes();
      await mutationFn({ hb_memory_region_size: '4GB' });
      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Systems/system/Bios/Settings',
        { Attributes: { hb_memory_region_size: '4GB' } },
      );
    });

    it('onSuccess invalidates the bios query cache', () => {
      let onSuccess;
      useMutation.mockImplementation((opts) => {
        onSuccess = opts.onSuccess;
        return stubMutation();
      });
      useBiosAttributes();
      onSuccess();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'systems', 'system', 'bios'],
      });
    });
  });

  // ── updateBiosAttribute helper ────────────────────────────────────────────────

  describe('updateBiosAttribute', () => {
    it('calls mutateAsync with a single-key attributes object', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: ref(false),
      });
      const { updateBiosAttribute } = useBiosAttributes();
      await updateBiosAttribute('hb_number_huge_pages', 4);
      expect(mockMutateAsync).toHaveBeenCalledWith({ hb_number_huge_pages: 4 });
    });
  });

  // ── updateBiosBooleanAttribute helper ─────────────────────────────────────────

  describe('updateBiosBooleanAttribute', () => {
    it('converts true to "Enabled" and patches', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: ref(false),
      });
      const { updateBiosBooleanAttribute } = useBiosAttributes();
      await updateBiosBooleanAttribute('hb_memory_mirror_mode', true);
      expect(mockMutateAsync).toHaveBeenCalledWith({
        hb_memory_mirror_mode: 'Enabled',
      });
    });

    it('converts false to "Disabled" and patches', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue(undefined);
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: ref(false),
      });
      const { updateBiosBooleanAttribute } = useBiosAttributes();
      await updateBiosBooleanAttribute('hb_memory_mirror_mode', false);
      expect(mockMutateAsync).toHaveBeenCalledWith({
        hb_memory_mirror_mode: 'Disabled',
      });
    });
  });
});
