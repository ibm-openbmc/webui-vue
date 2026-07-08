import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

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

vi.mock('@/components/Composables/useToastComposable', () => ({
  default: vi.fn(() => ({
    successToast: vi.fn(),
    errorToast: vi.fn(),
  })),
}));

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import i18n from '@/i18n';
import useToast from '@/components/Composables/useToastComposable';
import { useDateTime } from '@/api/composables/useDateTime';

const makeMockQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isError: ref(false),
  error: ref(null),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  ...overrides,
});

describe('useDateTime', () => {
  let mockQueryClient;
  let mockSuccessToast;
  let mockErrorToast;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = {
      invalidateQueries: vi.fn(),
    };
    useQueryClient.mockReturnValue(mockQueryClient);

    mockSuccessToast = vi.fn();
    mockErrorToast = vi.fn();
    useToast.mockReturnValue({
      successToast: mockSuccessToast,
      errorToast: mockErrorToast,
    });

    // Default mock for useQuery
    useQuery.mockReturnValue(makeMockQuery());

    // Default mock for useMutation
    useMutation.mockReturnValue(makeMockMutation());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetching NTP data', () => {
    it('returns empty arrays when data is null', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));

      const { ntpServers, networkSuppliedServers } = useDateTime();

      expect(ntpServers.value).toEqual([]);
      expect(networkSuppliedServers.value).toEqual([]);
    });

    it('returns false for isNtpProtocolEnabled when data is null', () => {
      useQuery.mockReturnValue(makeMockQuery({ data: ref(null) }));

      const { isNtpProtocolEnabled } = useDateTime();

      expect(isNtpProtocolEnabled.value).toBe(false);
    });

    it('maps NTP data correctly', () => {
      const mockNtpData = {
        NTPServers: ['ntp1.example.com', 'ntp2.example.com'],
        ProtocolEnabled: true,
        NetworkSuppliedServers: ['dhcp.ntp.com'],
      };
      useQuery.mockReturnValue(makeMockQuery({ data: ref(mockNtpData) }));

      const { ntpServers, isNtpProtocolEnabled, networkSuppliedServers } =
        useDateTime();

      expect(ntpServers.value).toEqual([
        'ntp1.example.com',
        'ntp2.example.com',
      ]);
      expect(isNtpProtocolEnabled.value).toBe(true);
      expect(networkSuppliedServers.value).toEqual(['dhcp.ntp.com']);
    });

    it('handles missing NetworkSuppliedServers', () => {
      const mockNtpData = {
        NTPServers: ['ntp.example.com'],
        ProtocolEnabled: false,
      };
      useQuery.mockReturnValue(makeMockQuery({ data: ref(mockNtpData) }));

      const { networkSuppliedServers } = useDateTime();

      expect(networkSuppliedServers.value).toEqual([]);
    });

    it('exposes isLoading, isError, error, and refetch from useQuery', () => {
      const refetchFn = vi.fn();
      useQuery.mockReturnValue(
        makeMockQuery({
          isLoading: ref(true),
          isError: ref(true),
          error: ref(new Error('fetch failed')),
          refetch: refetchFn,
        }),
      );

      const { isLoading, isError, error, refetch } = useDateTime();

      expect(isLoading.value).toBe(true);
      expect(isError.value).toBe(true);
      expect(error.value).toBeInstanceOf(Error);
      expect(refetch).toBe(refetchFn);
    });
  });

  describe('updateDateTime mutation', () => {
    it('updates NTP settings when NTP is enabled', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success message');
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { updateDateTime } = useDateTime();

      const dateTimeForm = {
        ntpProtocolEnabled: true,
        ntpServersArray: ['ntp1.example.com', 'ntp2.example.com'],
      };

      await updateDateTime(dateTimeForm);

      expect(mockMutateAsync).toHaveBeenCalledWith(dateTimeForm);
    });

    it('updates manual date/time when NTP is disabled', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue('success message');
      useMutation.mockReturnValue(
        makeMockMutation({ mutateAsync: mockMutateAsync }),
      );

      const { updateDateTime } = useDateTime();

      const dateTimeForm = {
        ntpProtocolEnabled: false,
        updatedDateTime: '2024-01-01T12:00:00Z',
      };

      await updateDateTime(dateTimeForm);

      expect(mockMutateAsync).toHaveBeenCalledWith(dateTimeForm);
    });

    it('exposes isUpdating from mutation', () => {
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isUpdating } = useDateTime();

      expect(isUpdating.value).toBe(true);
    });
  });

  describe('mutation callbacks', () => {
    it('calls successToast and invalidates queries on success', async () => {
      let onSuccessCallback;
      useMutation.mockImplementation((config) => {
        onSuccessCallback = config.onSuccess;
        return makeMockMutation();
      });

      useDateTime();

      const successMessage =
        'pageDateTime.toast.successSaveDateTimeForNtpServer';
      onSuccessCallback(successMessage);

      expect(mockSuccessToast).toHaveBeenCalledWith(successMessage);
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'managers', 'bmc', 'networkProtocol'],
      });
    });

    it('calls errorToast on error', async () => {
      let onErrorCallback;
      useMutation.mockImplementation((config) => {
        onErrorCallback = config.onError;
        return makeMockMutation();
      });

      useDateTime();

      const error = new Error('Update failed');
      onErrorCallback(error);

      expect(mockErrorToast).toHaveBeenCalledWith(
        'pageDateTime.toast.errorSaveDateTime',
      );
    });
  });

  describe('API integration', () => {
    it('calls correct API endpoint for fetching NTP data', async () => {
      let queryFn;
      useQuery.mockImplementation((config) => {
        queryFn = config.queryFn;
        return makeMockQuery();
      });

      const mockResponse = {
        data: {
          NTP: {
            NTPServers: ['ntp.example.com'],
            ProtocolEnabled: true,
          },
        },
      };
      api.get.mockResolvedValue(mockResponse);

      useDateTime();

      const result = await queryFn();

      expect(api.get).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/NetworkProtocol',
      );
      expect(result).toEqual(mockResponse.data.NTP);
    });

    it('calls correct API endpoints for updating NTP settings', async () => {
      let mutationFn;
      useMutation.mockImplementation((config) => {
        mutationFn = config.mutationFn;
        return makeMockMutation();
      });

      api.patch.mockResolvedValue({});
      i18n.global.t.mockReturnValue('Success message');

      useDateTime();

      const dateTimeForm = {
        ntpProtocolEnabled: true,
        ntpServersArray: ['ntp1.example.com'],
      };

      await mutationFn(dateTimeForm);

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/NetworkProtocol',
        {
          NTP: {
            ProtocolEnabled: true,
            NTPServers: ['ntp1.example.com'],
          },
        },
      );
    });

    it('does not include NTPServers when NTP is disabled', async () => {
      let mutationFn;
      useMutation.mockImplementation((config) => {
        mutationFn = config.mutationFn;
        return makeMockMutation();
      });

      api.patch.mockResolvedValue({});
      i18n.global.t.mockReturnValue('Success message');

      useDateTime();

      const dateTimeForm = {
        ntpProtocolEnabled: false,
        updatedDateTime: '2024-01-01T12:00:00Z',
      };

      await mutationFn(dateTimeForm);

      expect(api.patch).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/NetworkProtocol',
        {
          NTP: {
            ProtocolEnabled: false,
          },
        },
      );
    });
  });

  describe('query configuration', () => {
    it('uses correct query key', () => {
      let queryKey;
      useQuery.mockImplementation((config) => {
        queryKey = config.queryKey;
        return makeMockQuery();
      });

      useDateTime();

      expect(queryKey).toEqual([
        'redfish',
        'managers',
        'bmc',
        'networkProtocol',
      ]);
    });
  });
});
