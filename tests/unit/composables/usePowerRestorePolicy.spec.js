import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock dependencies
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

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

vi.mock('@/api/composables/useAllSubResources', () => ({
  usePropertyFromCollection: vi.fn(),
  useRedfishResource: vi.fn(),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import i18n from '@/i18n';
import {
  usePropertyFromCollection,
  useRedfishResource,
} from '@/api/composables/useAllSubResources';
import { usePowerRestorePolicy } from '@/api/composables/usePowerRestorePolicy';

const makeMockQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null),
  ...overrides,
});

describe('usePowerRestorePolicy', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    useQueryClient.mockReturnValue(mockQueryClient);

    // Default mock for usePropertyFromCollection
    usePropertyFromCollection.mockReturnValue(
      makeMockQuery({ data: ref(null) }),
    );

    // Default mock for useRedfishResource
    useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));

    // Default mock for useMutation
    useMutation.mockReturnValue(makeMockMutation());
  });

  describe('Power Restore Policies Schema', () => {
    it('returns empty array when schema data is not available', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));

      const { powerRestorePolicies } = usePowerRestorePolicy();

      expect(powerRestorePolicies.value).toEqual([]);
    });

    it('maps power restore policy types correctly', () => {
      const mockPolicies = [
        {
          state: 'AlwaysOn',
          desc: 'pagePowerRestorePolicy.policies.AlwaysOn - Always power on after AC power loss',
        },
        {
          state: 'AlwaysOff',
          desc: 'pagePowerRestorePolicy.policies.AlwaysOff - Always remain off after AC power loss',
        },
        {
          state: 'LastState',
          desc: 'pagePowerRestorePolicy.policies.LastState - Restore to last power state',
        },
      ];

      useQuery.mockReturnValue(makeMockQuery({ data: ref(mockPolicies) }));

      const { powerRestorePolicies } = usePowerRestorePolicy();

      expect(powerRestorePolicies.value).toHaveLength(3);
      expect(powerRestorePolicies.value[0].state).toBe('AlwaysOn');
      expect(powerRestorePolicies.value[1].state).toBe('AlwaysOff');
      expect(powerRestorePolicies.value[2].state).toBe('LastState');
    });

    it('handles loading state for policies', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(true) }));

      const { isLoading } = usePowerRestorePolicy();

      expect(isLoading.value).toBe(true);
    });

    it('handles error state for policies', () => {
      useQuery.mockReturnValue(
        makeMockQuery({
          isError: ref(true),
          error: ref(new Error('Failed to fetch schema')),
        }),
      );

      const { isError, policiesError } = usePowerRestorePolicy();

      expect(isError.value).toBe(true);
      expect(policiesError.value).toBeInstanceOf(Error);
    });
  });

  describe('Current Power Restore Policy', () => {
    it('returns null when current policy is not available', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ data: ref(null) }),
      );

      const { powerRestoreCurrentPolicy } = usePowerRestorePolicy();

      expect(powerRestoreCurrentPolicy.value).toBeNull();
    });

    it('returns current policy when available', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ data: ref('AlwaysOn') }),
      );

      const { powerRestoreCurrentPolicy } = usePowerRestorePolicy();

      expect(powerRestoreCurrentPolicy.value).toBe('AlwaysOn');
    });

    it('handles loading state for current policy', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isLoading: ref(true) }),
      );

      const { isLoading } = usePowerRestorePolicy();

      expect(isLoading.value).toBe(true);
    });

    it('handles error state for current policy', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({
          isError: ref(true),
          error: ref(new Error('Failed to fetch current policy')),
        }),
      );

      const { isError, currentPolicyError } = usePowerRestorePolicy();

      expect(isError.value).toBe(true);
      expect(currentPolicyError.value).toBeInstanceOf(Error);
    });

    it('exposes refetch function for current policy', () => {
      const refetchFn = vi.fn();
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ refetch: refetchFn }),
      );

      const { refetchCurrentPolicy } = usePowerRestorePolicy();

      expect(refetchCurrentPolicy).toBe(refetchFn);
    });
  });

  describe('Operating Mode', () => {
    it('returns true when operating mode is Manual', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useRedfishResource.mockReturnValue(
        makeMockQuery({
          data: ref({
            Attributes: {
              pvm_system_operating_mode: 'Manual',
            },
          }),
        }),
      );

      const { isOperatingModeManual } = usePowerRestorePolicy();

      expect(isOperatingModeManual.value).toBe(true);
    });

    it('returns true when operating mode is not set', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useRedfishResource.mockReturnValue(
        makeMockQuery({
          data: ref({
            Attributes: {},
          }),
        }),
      );

      const { isOperatingModeManual } = usePowerRestorePolicy();

      expect(isOperatingModeManual.value).toBe(true);
    });

    it('returns false when operating mode is not Manual', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useRedfishResource.mockReturnValue(
        makeMockQuery({
          data: ref({
            Attributes: {
              pvm_system_operating_mode: 'Automatic',
            },
          }),
        }),
      );

      const { isOperatingModeManual } = usePowerRestorePolicy();

      expect(isOperatingModeManual.value).toBe(false);
    });

    it('handles missing BIOS attributes', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useRedfishResource.mockReturnValue(makeMockQuery({ data: ref(null) }));

      const { isOperatingModeManual } = usePowerRestorePolicy();

      expect(isOperatingModeManual.value).toBe(true);
    });
  });

  describe('Set Power Restore Policy', () => {
    it('calls mutation with correct policy', async () => {
      const mutateFn = vi.fn().mockResolvedValue(undefined);
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync: mutateFn }));

      const { setPowerRestorePolicy } = usePowerRestorePolicy();

      await setPowerRestorePolicy('AlwaysOn');

      expect(mutateFn).toHaveBeenCalledWith('AlwaysOn');
    });

    it('invalidates queries on successful mutation', async () => {
      let onSuccessCallback;
      useMutation.mockImplementation(({ onSuccess }) => {
        onSuccessCallback = onSuccess;
        return makeMockMutation({
          mutateAsync: vi.fn().mockResolvedValue(undefined),
        });
      });

      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));

      usePowerRestorePolicy();

      // Simulate successful mutation
      onSuccessCallback();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'powerRestorePolicy', 'current'],
      });
    });

    it('handles mutation error', async () => {
      let onErrorCallback;
      const mockError = new Error('Network error');

      useMutation.mockImplementation(({ onError }) => {
        onErrorCallback = onError;
        return makeMockMutation({
          mutateAsync: vi.fn().mockRejectedValue(mockError),
        });
      });

      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));

      usePowerRestorePolicy();

      // Simulate error
      expect(() => onErrorCallback(mockError)).toThrow();
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pagePowerRestorePolicy.toast.errorSaveSettings',
      );
    });

    it('exposes mutation pending state', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref([]) }));
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isSettingPolicy } = usePowerRestorePolicy();

      expect(isSettingPolicy.value).toBe(true);
    });
  });

  describe('Combined Loading States', () => {
    it('returns true when policies are loading', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(true) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isLoading: ref(false) }),
      );

      const { isLoading } = usePowerRestorePolicy();

      expect(isLoading.value).toBe(true);
    });

    it('returns true when current policy is loading', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(false) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isLoading: ref(true) }),
      );

      const { isLoading } = usePowerRestorePolicy();

      expect(isLoading.value).toBe(true);
    });

    it('returns false when nothing is loading', () => {
      useQuery.mockReturnValue(makeMockQuery({ isLoading: ref(false) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isLoading: ref(false) }),
      );

      const { isLoading } = usePowerRestorePolicy();

      expect(isLoading.value).toBe(false);
    });
  });

  describe('Combined Error States', () => {
    it('returns true when policies have error', () => {
      useQuery.mockReturnValue(makeMockQuery({ isError: ref(true) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isError: ref(false) }),
      );

      const { isError } = usePowerRestorePolicy();

      expect(isError.value).toBe(true);
    });

    it('returns true when current policy has error', () => {
      useQuery.mockReturnValue(makeMockQuery({ isError: ref(false) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isError: ref(true) }),
      );

      const { isError } = usePowerRestorePolicy();

      expect(isError.value).toBe(true);
    });

    it('returns false when no errors', () => {
      useQuery.mockReturnValue(makeMockQuery({ isError: ref(false) }));
      usePropertyFromCollection.mockReturnValue(
        makeMockQuery({ isError: ref(false) }),
      );

      const { isError } = usePowerRestorePolicy();

      expect(isError.value).toBe(false);
    });
  });
});
