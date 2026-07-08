import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock the dependencies
vi.mock('@/store/api', () => ({
  default: {
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
  useRedfishResource: vi.fn(),
}));

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

import api from '@/store/api';
import i18n from '@/i18n';
import { useRedfishResource } from '@/api/composables/useAllSubResources';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useKeyClear } from '@/api/composables/useKeyClear';

const makeMockBiosQuery = (overrides = {}) => ({
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

describe('useKeyClear', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  describe('currentKeyClearRequest', () => {
    it('returns "NONE" when BIOS data is null', () => {
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ data: ref(null) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { currentKeyClearRequest } = useKeyClear();

      expect(currentKeyClearRequest.value).toBe('NONE');
    });

    it('returns "NONE" when hb_key_clear_request is undefined', () => {
      const biosData = {
        Attributes: {},
      };
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ data: ref(biosData) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { currentKeyClearRequest } = useKeyClear();

      expect(currentKeyClearRequest.value).toBe('NONE');
    });

    it('returns the current key clear request value from BIOS attributes', () => {
      const biosData = {
        Attributes: {
          hb_key_clear_request: 'ALL',
        },
      };
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ data: ref(biosData) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { currentKeyClearRequest } = useKeyClear();

      expect(currentKeyClearRequest.value).toBe('ALL');
    });

    it('returns "POWERVM_SYSKEY" when set in BIOS attributes', () => {
      const biosData = {
        Attributes: {
          hb_key_clear_request: 'POWERVM_SYSKEY',
        },
      };
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ data: ref(biosData) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { currentKeyClearRequest } = useKeyClear();

      expect(currentKeyClearRequest.value).toBe('POWERVM_SYSKEY');
    });
  });

  describe('isLoading', () => {
    it('exposes isLoading state from BIOS query', () => {
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ isLoading: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isLoading } = useKeyClear();

      expect(isLoading.value).toBe(true);
    });

    it('returns false when BIOS query is not loading', () => {
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ isLoading: ref(false) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isLoading } = useKeyClear();

      expect(isLoading.value).toBe(false);
    });
  });

  describe('isClearing', () => {
    it('exposes isPending state from mutation', () => {
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isClearing } = useKeyClear();

      expect(isClearing.value).toBe(true);
    });

    it('returns false when mutation is not pending', () => {
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(false) }));

      const { isClearing } = useKeyClear();

      expect(isClearing.value).toBe(false);
    });
  });

  describe('clearEncryptionKeys', () => {
    it('calls mutation with the selected key', async () => {
      const mutateAsync = vi.fn().mockResolvedValue('Success message');
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { clearEncryptionKeys } = useKeyClear();
      await clearEncryptionKeys('ALL');

      expect(mutateAsync).toHaveBeenCalledWith('ALL');
    });

    it('returns success message from mutation', async () => {
      const successMessage = 'pageKeyClear.toast.selectedKeyClearedSuccess';
      const mutateAsync = vi.fn().mockResolvedValue(successMessage);
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { clearEncryptionKeys } = useKeyClear();
      const result = await clearEncryptionKeys('POWERVM_SYSKEY');

      expect(result).toBe(successMessage);
    });

    it('handles different key options correctly', async () => {
      const mutateAsync = vi.fn().mockResolvedValue('Success');
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { clearEncryptionKeys } = useKeyClear();

      await clearEncryptionKeys('NONE');
      expect(mutateAsync).toHaveBeenCalledWith('NONE');

      await clearEncryptionKeys('MFG_ALL');
      expect(mutateAsync).toHaveBeenCalledWith('MFG_ALL');

      await clearEncryptionKeys('MFG');
      expect(mutateAsync).toHaveBeenCalledWith('MFG');
    });
  });

  describe('mutation configuration', () => {
    it('configures mutation with correct mutationFn', () => {
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });

      useKeyClear();

      expect(capturedConfig).toBeDefined();
      expect(capturedConfig.mutationFn).toBeInstanceOf(Function);
    });

    it('mutation calls API patch with correct parameters', async () => {
      api.patch.mockResolvedValue({});
      i18n.global.t.mockReturnValue('Success message');

      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });

      useKeyClear();

      await capturedConfig.mutationFn('ALL');

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Systems/system/Bios/Settings',
        {
          Attributes: { hb_key_clear_request: 'ALL' },
        },
      );
    });

    it('mutation returns translated success message', async () => {
      const successMessage = 'Keys cleared successfully';
      api.patch.mockResolvedValue({});
      i18n.global.t.mockReturnValue(successMessage);

      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });

      useKeyClear();

      const result = await capturedConfig.mutationFn('POWERVM_SYSKEY');

      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageKeyClear.toast.selectedKeyClearedSuccess',
      );
      expect(result).toBe(successMessage);
    });

    it('onSuccess invalidates BIOS query', () => {
      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });

      useKeyClear();

      capturedConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'resource', '/redfish/v1/Systems/system/Bios'],
      });
    });

    it('onError logs error and throws translated error message', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const errorMessage = 'Failed to clear keys';
      i18n.global.t.mockReturnValue(errorMessage);

      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });

      useKeyClear();

      const testError = new Error('API Error');
      expect(() => capturedConfig.onError(testError)).toThrow(errorMessage);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Key clear error:',
        testError,
      );
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageKeyClear.toast.selectedKeyClearedError',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('refetch', () => {
    it('exposes refetch function from BIOS query', () => {
      const refetchFn = vi.fn();
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ refetch: refetchFn }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { refetch } = useKeyClear();

      expect(refetch).toBe(refetchFn);
    });

    it('calls refetch when invoked', () => {
      const refetchFn = vi.fn();
      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({ refetch: refetchFn }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { refetch } = useKeyClear();
      refetch();

      expect(refetchFn).toHaveBeenCalled();
    });
  });

  describe('BIOS resource query', () => {
    it('queries the correct BIOS endpoint', () => {
      useMutation.mockReturnValue(makeMockMutation());

      useKeyClear();

      expect(useRedfishResource).toHaveBeenCalledWith(
        '/redfish/v1/Systems/system/Bios',
        expect.objectContaining({
          queryConfig: expect.any(Object),
        }),
      );
    });
  });

  describe('integration scenarios', () => {
    it('handles complete flow: fetch current state, clear keys, refetch', async () => {
      const refetchFn = vi.fn();
      const mutateAsync = vi.fn().mockResolvedValue('Success');

      const biosData = {
        Attributes: {
          hb_key_clear_request: 'NONE',
        },
      };

      useRedfishResource.mockReturnValue(
        makeMockBiosQuery({
          data: ref(biosData),
          refetch: refetchFn,
        }),
      );

      let capturedConfig;
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation({ mutateAsync });
      });

      const { currentKeyClearRequest, clearEncryptionKeys, refetch } =
        useKeyClear();

      // Initial state
      expect(currentKeyClearRequest.value).toBe('NONE');

      // Clear keys
      await clearEncryptionKeys('ALL');
      expect(mutateAsync).toHaveBeenCalledWith('ALL');

      // Trigger onSuccess to invalidate queries
      capturedConfig.onSuccess();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();

      // Manual refetch
      refetch();
      expect(refetchFn).toHaveBeenCalled();
    });

    it('handles error scenario gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
      const mutateAsync = vi.fn().mockRejectedValue(new Error('Network error'));

      useRedfishResource.mockReturnValue(makeMockBiosQuery());
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { clearEncryptionKeys } = useKeyClear();

      await expect(clearEncryptionKeys('ALL')).rejects.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});

// Made with Bob
