import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, computed } from 'vue';
import { useSystemParameters } from '@/api/composables/useSystemParameters';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('@/api/composables/useBiosAttributes', () => ({
  useBiosAttributes: vi.fn(),
}));

import { useBiosAttributes } from '@/api/composables/useBiosAttributes';

// ── Shared helpers ─────────────────────────────────────────────────────────────

/**
 * Creates a stub useBiosAttributes return value.
 * `biosData` is a plain object whose keys are BIOS attribute names and values
 * are the raw strings that `getBiosAttribute` / `getBiosBooleanAttribute` will
 * return for those names.
 */
function stubBiosAttributes(attrOverrides = {}, biosData = {}) {
  const defaults = {
    hb_proc_favor_aggressive_prefetch: null,
    hb_lateral_cast_out_mode: null,
    hb_cap_freq_mhz_max: null,
    hb_cap_freq_mhz_min: null,
    hb_cap_freq_mhz_request: null,
    hb_cap_freq_mhz_request_current: null,
    pvm_rpd_policy: null,
    pvm_rpd_feature: null,
    pvm_rpd_feature_current: null,
    pvm_rpd_immediate_test: null,
    pvm_rpd_guard_policy: null,
    pvm_rpd_scheduled_tod: null,
    pvm_rpd_scheduled_duration: null,
    ...biosData,
  };

  const mockGetBiosAttribute = vi.fn((name) =>
    computed(() => defaults[name] ?? null),
  );

  const mockGetBiosBooleanAttribute = vi.fn((name) =>
    computed(() => {
      const val = defaults[name];
      if (val === null || val === undefined) return null;
      return val === 'Enabled';
    }),
  );

  const mockGetRegistryOptions = vi.fn(() => computed(() => []));
  const mockUpdateBiosAttribute = vi.fn().mockResolvedValue(undefined);
  const mockUpdateBiosBooleanAttribute = vi.fn().mockResolvedValue(undefined);
  const mockUpdateBiosAttributes = vi.fn().mockResolvedValue(undefined);

  return {
    isFetching: ref(false),
    isError: ref(false),
    error: ref(null),
    getBiosAttribute: mockGetBiosAttribute,
    getBiosBooleanAttribute: mockGetBiosBooleanAttribute,
    getRegistryOptions: mockGetRegistryOptions,
    updateBiosAttribute: mockUpdateBiosAttribute,
    updateBiosBooleanAttribute: mockUpdateBiosBooleanAttribute,
    updateBiosAttributes: mockUpdateBiosAttributes,
    isUpdating: ref(false),
    ...attrOverrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useSystemParameters', () => {
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
      const result = useSystemParameters();

      const expectedKeys = [
        'aggressivePrefetch',
        'lateralCastOutMode',
        'frequencyMax',
        'frequencyMin',
        'frequencyRequest',
        'frequencyRequestCurrent',
        'frequencyRequestCurrentToggle',
        'rpdPolicy',
        'rpdFeature',
        'rpdPolicyCurrent',
        'rpdPolicyOptions',
        'rpdFeatureOptions',
        'immediateTestRequested',
        'guardOnError',
        'rpdScheduledRun',
        'rpdScheduledRunDuration',
        'isFetching',
        'isError',
        'error',
        'saveAggressivePrefetch',
        'saveLateralCastOutMode',
        'saveFrequencyCap',
        'saveRpdPolicy',
        'saveRpdFeature',
        'saveImmediateTestRequested',
        'saveGuardOnError',
        'saveRpdScheduledRun',
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
      const { isFetching } = useSystemParameters();
      expect(isFetching.value).toBe(true);
    });

    it('isError reflects useBiosAttributes isError', () => {
      const err = new Error('bios load failed');
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({ isError: ref(true), error: ref(err) }),
      );
      const { isError, error } = useSystemParameters();
      expect(isError.value).toBe(true);
      expect(error.value.message).toBe('bios load failed');
    });

    it('isUpdating reflects useBiosAttributes isUpdating', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({ isUpdating: ref(true) }),
      );
      const { isUpdating } = useSystemParameters();
      expect(isUpdating.value).toBe(true);
    });
  });

  // ── BIOS attribute bindings ───────────────────────────────────────────────────

  describe('BIOS attribute bindings', () => {
    it('calls getBiosBooleanAttribute for hb_proc_favor_aggressive_prefetch', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useSystemParameters();

      expect(stub.getBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_proc_favor_aggressive_prefetch',
      );
    });

    it('calls getBiosBooleanAttribute for hb_lateral_cast_out_mode', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useSystemParameters();

      expect(stub.getBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_lateral_cast_out_mode',
      );
    });

    it('calls getBiosAttribute for hb_cap_freq_mhz_max and hb_cap_freq_mhz_min', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useSystemParameters();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith('hb_cap_freq_mhz_max');
      expect(stub.getBiosAttribute).toHaveBeenCalledWith('hb_cap_freq_mhz_min');
    });

    it('calls getBiosAttribute for pvm_rpd_policy and pvm_rpd_feature', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useSystemParameters();

      expect(stub.getBiosAttribute).toHaveBeenCalledWith('pvm_rpd_policy');
      expect(stub.getBiosAttribute).toHaveBeenCalledWith('pvm_rpd_feature');
    });

    it('calls getRegistryOptions for pvm_rpd_policy and pvm_rpd_feature', () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      useSystemParameters();

      expect(stub.getRegistryOptions).toHaveBeenCalledWith('pvm_rpd_policy');
      expect(stub.getRegistryOptions).toHaveBeenCalledWith('pvm_rpd_feature');
    });
  });

  // ── frequencyRequestCurrentToggle computed ────────────────────────────────────

  describe('frequencyRequestCurrentToggle', () => {
    it('is false when frequencyRequest is null', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { hb_cap_freq_mhz_request: null }),
      );
      const { frequencyRequestCurrentToggle } = useSystemParameters();
      expect(frequencyRequestCurrentToggle.value).toBe(false);
    });

    it('is false when frequencyRequest is 0', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { hb_cap_freq_mhz_request: 0 }),
      );
      const { frequencyRequestCurrentToggle } = useSystemParameters();
      expect(frequencyRequestCurrentToggle.value).toBe(false);
    });

    it('is true when frequencyRequest is a positive number', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { hb_cap_freq_mhz_request: 3000 }),
      );
      const { frequencyRequestCurrentToggle } = useSystemParameters();
      expect(frequencyRequestCurrentToggle.value).toBe(true);
    });
  });

  // ── rpdScheduledRun computed ──────────────────────────────────────────────────

  describe('rpdScheduledRun', () => {
    it('returns null when pvm_rpd_scheduled_tod is null', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { pvm_rpd_scheduled_tod: null }),
      );
      const { rpdScheduledRun } = useSystemParameters();
      expect(rpdScheduledRun.value).toBeNull();
    });

    it('converts seconds to HH:MM format', () => {
      // 3600s = 01:00, 3661s = 01:01
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { pvm_rpd_scheduled_tod: 3661 }),
      );
      const { rpdScheduledRun } = useSystemParameters();
      expect(rpdScheduledRun.value).toBe('01:01');
    });

    it('zero-pads hours and minutes', () => {
      // 60s = 00:01
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { pvm_rpd_scheduled_tod: 60 }),
      );
      const { rpdScheduledRun } = useSystemParameters();
      expect(rpdScheduledRun.value).toBe('00:01');
    });

    it('handles midnight (0 seconds)', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { pvm_rpd_scheduled_tod: 0 }),
      );
      const { rpdScheduledRun } = useSystemParameters();
      expect(rpdScheduledRun.value).toBe('00:00');
    });

    it('handles end of day (86399s = 23:59)', () => {
      useBiosAttributes.mockReturnValue(
        stubBiosAttributes({}, { pvm_rpd_scheduled_tod: 86399 }),
      );
      const { rpdScheduledRun } = useSystemParameters();
      expect(rpdScheduledRun.value).toBe('23:59');
    });
  });

  // ── Mutation wrappers ─────────────────────────────────────────────────────────

  describe('Mutation wrappers', () => {
    it('saveAggressivePrefetch calls updateBiosBooleanAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveAggressivePrefetch } = useSystemParameters();
      await saveAggressivePrefetch(true);

      expect(stub.updateBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_proc_favor_aggressive_prefetch',
        true,
      );
    });

    it('saveLateralCastOutMode calls updateBiosBooleanAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveLateralCastOutMode } = useSystemParameters();
      await saveLateralCastOutMode(false);

      expect(stub.updateBiosBooleanAttribute).toHaveBeenCalledWith(
        'hb_lateral_cast_out_mode',
        false,
      );
    });

    it('saveFrequencyCap calls updateBiosAttribute with numeric value', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveFrequencyCap } = useSystemParameters();
      await saveFrequencyCap(3000);

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'hb_cap_freq_mhz_request',
        3000,
      );
    });

    it('saveRpdPolicy calls updateBiosAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveRpdPolicy } = useSystemParameters();
      await saveRpdPolicy('Scheduled');

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'pvm_rpd_policy',
        'Scheduled',
      );
    });

    it('saveRpdFeature calls updateBiosAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveRpdFeature } = useSystemParameters();
      await saveRpdFeature('Disabled');

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'pvm_rpd_feature',
        'Disabled',
      );
    });

    it('saveImmediateTestRequested calls updateBiosAttribute with string value', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveImmediateTestRequested } = useSystemParameters();
      await saveImmediateTestRequested('Enabled');

      expect(stub.updateBiosAttribute).toHaveBeenCalledWith(
        'pvm_rpd_immediate_test',
        'Enabled',
      );
    });

    it('saveGuardOnError calls updateBiosBooleanAttribute with correct key', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveGuardOnError } = useSystemParameters();
      await saveGuardOnError(true);

      expect(stub.updateBiosBooleanAttribute).toHaveBeenCalledWith(
        'pvm_rpd_guard_policy',
        true,
      );
    });

    it('saveRpdScheduledRun calls updateBiosAttributes with both fields', async () => {
      const stub = stubBiosAttributes();
      useBiosAttributes.mockReturnValue(stub);

      const { saveRpdScheduledRun } = useSystemParameters();
      await saveRpdScheduledRun({ totalSeconds: 3600, duration: 60 });

      expect(stub.updateBiosAttributes).toHaveBeenCalledWith({
        pvm_rpd_scheduled_tod: 3600,
        pvm_rpd_scheduled_duration: 60,
      });
    });

    it('mutation propagates rejection from updateBiosAttribute', async () => {
      const stub = stubBiosAttributes();
      stub.updateBiosAttribute.mockRejectedValue(new Error('patch failed'));
      useBiosAttributes.mockReturnValue(stub);

      const { saveFrequencyCap } = useSystemParameters();

      await expect(saveFrequencyCap(3000)).rejects.toThrow('patch failed');
    });

    it('mutation propagates rejection from updateBiosBooleanAttribute', async () => {
      const stub = stubBiosAttributes();
      stub.updateBiosBooleanAttribute.mockRejectedValue(
        new Error('bool patch failed'),
      );
      useBiosAttributes.mockReturnValue(stub);

      const { saveAggressivePrefetch } = useSystemParameters();

      await expect(saveAggressivePrefetch(true)).rejects.toThrow(
        'bool patch failed',
      );
    });
  });
});
