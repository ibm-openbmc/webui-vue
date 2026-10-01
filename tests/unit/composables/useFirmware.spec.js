import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { useFirmware } from '@/api/composables/useFirmware';

// Mock dependencies
vi.mock('@tanstack/vue-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    errorToast: vi.fn(),
  })),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import useToast from '@/components/Composables/useToastComposable';

describe('useFirmware', () => {
  let mockQueryClient;
  let mockErrorToast;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    useQueryClient.mockReturnValue(mockQueryClient);

    mockErrorToast = vi.fn();
    useToast.mockReturnValue({
      errorToast: mockErrorToast,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Query Configuration', () => {
    it('configures BMC active firmware query with refetchInterval', () => {
      let queryConfig;

      useQuery.mockImplementation((config) => {
        if (
          config.queryKey &&
          config.queryKey.includes('activeFirmware') &&
          config.queryKey.includes('bmc')
        ) {
          queryConfig = config;
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      useFirmware();

      expect(queryConfig).toBeDefined();
      expect(queryConfig.staleTime).toBe(0);
      expect(queryConfig.refetchInterval).toBe(false);
      expect(queryConfig.gcTime).toBe(5 * 60 * 1000);
      expect(queryConfig.retry).toBe(2);
    });

    it('configures host active firmware query with refetchInterval', () => {
      let queryConfig;

      useQuery.mockImplementation((config) => {
        if (
          config.queryKey &&
          config.queryKey.includes('activeFirmware') &&
          config.queryKey.includes('bios')
        ) {
          queryConfig = config;
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      useFirmware();

      expect(queryConfig).toBeDefined();
      expect(queryConfig.staleTime).toBe(0);
      expect(queryConfig.refetchInterval).toBe(false);
    });

    it('configures firmware inventory query with refetchInterval and custom retry', () => {
      let queryConfig;

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          queryConfig = config;
        }
        return {
          data: ref(null),
          isFetching: ref(false),
          isError: ref(false),
          error: ref(null),
          refetch: vi.fn(),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      useFirmware();

      expect(queryConfig).toBeDefined();
      expect(queryConfig.staleTime).toBe(0);
      expect(queryConfig.refetchInterval).toBe(false);
      expect(queryConfig.gcTime).toBe(5 * 60 * 1000);
      expect(typeof queryConfig.retry).toBe('function');
      expect(typeof queryConfig.retryDelay).toBe('function');
    });
  });

  describe('Firmware Data', () => {
    it('returns empty arrays when no firmware data available', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { bmcFirmware, hostFirmware } = useFirmware();

      expect(bmcFirmware.value).toEqual([]);
      expect(hostFirmware.value).toEqual([]);
    });

    it('returns firmware inventory when available', () => {
      const mockInventory = {
        bmc: [
          {
            version: '1.0.0',
            id: 'bmc_active',
            location: '/path1',
            status: 'OK',
          },
          {
            version: '0.9.0',
            id: 'bmc_backup',
            location: '/path2',
            status: 'OK',
          },
        ],
        host: [
          {
            version: '2.0.0',
            id: 'host_active',
            location: '/path3',
            status: 'OK',
          },
        ],
      };

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(mockInventory),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { bmcFirmware, hostFirmware } = useFirmware();

      expect(bmcFirmware.value).toEqual(mockInventory.bmc);
      expect(hostFirmware.value).toEqual(mockInventory.host);
    });

    it('computes active BMC firmware correctly', () => {
      const mockInventory = {
        bmc: [
          {
            version: '1.0.0',
            id: 'bmc_active',
            location: '/path1',
            status: 'OK',
          },
          {
            version: '0.9.0',
            id: 'bmc_backup',
            location: '/path2',
            status: 'OK',
          },
        ],
        host: [],
      };

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(mockInventory),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        if (
          config.queryKey &&
          config.queryKey.includes('activeFirmware') &&
          config.queryKey.includes('bmc')
        ) {
          return {
            data: ref('bmc_active'),
            isFetching: ref(false),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { activeBmcFirmware } = useFirmware();

      expect(activeBmcFirmware.value).toEqual(mockInventory.bmc[0]);
    });

    it('computes backup BMC firmware correctly', () => {
      const mockInventory = {
        bmc: [
          {
            version: '1.0.0',
            id: 'bmc_active',
            location: '/path1',
            status: 'OK',
          },
          {
            version: '0.9.0',
            id: 'bmc_backup',
            location: '/path2',
            status: 'OK',
          },
        ],
        host: [],
      };

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(mockInventory),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        if (
          config.queryKey &&
          config.queryKey.includes('activeFirmware') &&
          config.queryKey.includes('bmc')
        ) {
          return {
            data: ref('bmc_active'),
            isFetching: ref(false),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { backupBmcFirmware } = useFirmware();

      expect(backupBmcFirmware.value).toEqual(mockInventory.bmc[1]);
    });

    it('computes isSingleFileUploadEnabled correctly when no host firmware', () => {
      const mockInventory = {
        bmc: [
          {
            version: '1.0.0',
            id: 'bmc_active',
            location: '/path1',
            status: 'OK',
          },
        ],
        host: [],
      };

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(mockInventory),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { isSingleFileUploadEnabled } = useFirmware();

      expect(isSingleFileUploadEnabled.value).toBe(true);
    });

    it('computes isSingleFileUploadEnabled correctly when host firmware exists', () => {
      const mockInventory = {
        bmc: [
          {
            version: '1.0.0',
            id: 'bmc_active',
            location: '/path1',
            status: 'OK',
          },
        ],
        host: [
          {
            version: '2.0.0',
            id: 'host_active',
            location: '/path3',
            status: 'OK',
          },
        ],
      };

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(mockInventory),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { isSingleFileUploadEnabled } = useFirmware();

      expect(isSingleFileUploadEnabled.value).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('computes isFetching as true when any query is fetching', () => {
      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(null),
            isFetching: ref(true),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { isFetching } = useFirmware();

      expect(isFetching.value).toBe(true);
    });

    it('computes isFetching as false when no queries are fetching', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { isFetching } = useFirmware();

      expect(isFetching.value).toBe(false);
    });
  });

  describe('Error States', () => {
    it('exposes error states from firmware inventory query', () => {
      const mockError = new Error('Test error');

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(null),
            isFetching: ref(false),
            isError: ref(true),
            error: ref(mockError),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { isError, error } = useFirmware();

      expect(isError.value).toBe(true);
      expect(error.value).toBe(mockError);
    });
  });

  describe('Refetch Function', () => {
    it('exposes refetch function from firmware inventory query', () => {
      const mockRefetch = vi.fn();

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          return {
            data: ref(null),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: mockRefetch,
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { refetch } = useFirmware();

      expect(refetch).toBe(mockRefetch);
    });
  });

  describe('Mutations', () => {
    it('exposes uploadFirmware function', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      const mockMutateAsync = vi.fn();
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: ref(false),
      });

      const { uploadFirmware } = useFirmware();

      expect(typeof uploadFirmware).toBe('function');
    });

    it('exposes switchBmcFirmwareAndReboot function', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      const mockMutateAsync = vi.fn();
      useMutation.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: ref(false),
      });

      const { switchBmcFirmwareAndReboot } = useFirmware();

      expect(typeof switchBmcFirmwareAndReboot).toBe('function');
    });

    it('exposes isUploading state', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      useMutation.mockImplementation((config) => {
        if (
          config.mutationFn &&
          config.mutationFn.toString().includes('update')
        ) {
          return {
            mutateAsync: vi.fn(),
            isPending: ref(true),
          };
        }
        return {
          mutateAsync: vi.fn(),
          isPending: ref(false),
        };
      });

      const { isUploading } = useFirmware();

      expect(isUploading.value).toBe(true);
    });

    it('exposes isSwitching state', () => {
      useQuery.mockReturnValue({
        data: ref(null),
        isFetching: ref(false),
        isError: ref(false),
        error: ref(null),
        refetch: vi.fn(),
      });

      useMutation.mockImplementation((config) => {
        if (
          config.mutationFn &&
          config.mutationFn.toString().includes('patch')
        ) {
          return {
            mutateAsync: vi.fn(),
            isPending: ref(true),
          };
        }
        return {
          mutateAsync: vi.fn(),
          isPending: ref(false),
        };
      });

      const { isSwitching } = useFirmware();

      expect(isSwitching.value).toBe(true);
    });
  });

  describe('Firmware Boot Side', () => {
    it('returns firmware boot side when available', () => {
      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('bootSide')) {
          return {
            data: ref('Temp'),
            isFetching: ref(false),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
          isError: ref(false),
          error: ref(null),
          refetch: vi.fn(),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { firmwareBootSide } = useFirmware();

      expect(firmwareBootSide.value).toBe('Temp');
    });
  });

  describe('Lowest Supported Version', () => {
    it('returns lowest supported version when available', () => {
      const mockVersionData = {
        version: '1.0.0',
        showAlert: true,
      };

      useQuery.mockImplementation((config) => {
        if (
          config.queryKey &&
          config.queryKey.includes('lowestSupportedVersion')
        ) {
          return {
            data: ref(mockVersionData),
            isFetching: ref(false),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
          isError: ref(false),
          error: ref(null),
          refetch: vi.fn(),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      const { lowestSupportedFirmwareVersion } = useFirmware();

      expect(lowestSupportedFirmwareVersion.value).toEqual(mockVersionData);
    });
  });

  describe('Retry Logic', () => {
    it('retry function returns false for 4xx errors', () => {
      let retryFn;

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          retryFn = config.retry;
          return {
            data: ref(null),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      useFirmware();

      const error404 = { response: { status: 404 } };
      expect(retryFn(1, error404)).toBe(false);
    });

    it('retry function returns true for 5xx errors (up to 2 times)', () => {
      let retryFn;

      useQuery.mockImplementation((config) => {
        if (config.queryKey && config.queryKey.includes('firmwareInventory')) {
          retryFn = config.retry;
          return {
            data: ref(null),
            isFetching: ref(false),
            isError: ref(false),
            error: ref(null),
            refetch: vi.fn(),
          };
        }
        return {
          data: ref(null),
          isFetching: ref(false),
        };
      });

      useMutation.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: ref(false),
      });

      useFirmware();

      const error500 = { response: { status: 500 } };
      expect(retryFn(0, error500)).toBe(true);
      expect(retryFn(1, error500)).toBe(true);
      expect(retryFn(2, error500)).toBe(false);
    });
  });
});
