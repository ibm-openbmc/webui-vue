import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/api/composables/useAllSubResources', () => ({
  useNavigatedCollection: vi.fn(),
  navigateToCollection: vi.fn(),
}));

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock('@/store/api', () => ({
  default: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

import {
  useNavigatedCollection,
  navigateToCollection,
} from '@/api/composables/useAllSubResources';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import i18n from '@/i18n';
import { useSnmpAlerts } from '@/api/composables/useSnmpAlerts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SNMP_QUERY_KEY = [
  'redfish',
  'navigatedCollection',
  'EventService',
  'Subscriptions',
];

const makeNavigatedQuery = (overrides = {}) => ({
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

const RAW_SUB_WITH_PROTOCOL = {
  '@odata.id': '/redfish/v1/EventService/Subscriptions/1',
  Id: 'sub-1',
  Destination: 'snmp://192.168.1.10:162',
  SubscriptionType: 'SNMPTrap',
  Protocol: 'SNMPv2c',
};

const RAW_SUB_NO_PROTOCOL = {
  '@odata.id': '/redfish/v1/EventService/Subscriptions/2',
  Id: 'sub-2',
  Destination: '10.0.0.1:161',
  SubscriptionType: 'SNMPTrap',
  Protocol: 'SNMPv2c',
};

const RAW_SUB_NO_PORT = {
  '@odata.id': '/redfish/v1/EventService/Subscriptions/3',
  Id: 'sub-3',
  Destination: 'snmp://10.0.0.2',
  SubscriptionType: 'SNMPTrap',
  Protocol: 'SNMPv2c',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSnmpAlerts', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  // ── snmpAlerts computed ──────────────────────────────────────────────────

  describe('snmpAlerts computed', () => {
    it('returns empty array when data is null', () => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value).toEqual([]);
    });

    it('parses ip and port from protocol-prefixed destination', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ data: ref([RAW_SUB_WITH_PROTOCOL]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value[0].ip).toBe('192.168.1.10');
      expect(snmpAlerts.value[0].port).toBe('162');
    });

    it('parses ip and port from plain host:port destination', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ data: ref([RAW_SUB_NO_PROTOCOL]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value[0].ip).toBe('10.0.0.1');
      expect(snmpAlerts.value[0].port).toBe('161');
    });

    it('sets port to empty string when no port is present', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ data: ref([RAW_SUB_NO_PORT]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value[0].port).toBe('');
    });

    it('maps isSelected to false by default', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ data: ref([RAW_SUB_WITH_PROTOCOL]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value[0].isSelected).toBe(false);
    });

    it('maps multiple subscriptions correctly', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({
          data: ref([RAW_SUB_WITH_PROTOCOL, RAW_SUB_NO_PROTOCOL]),
        }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { snmpAlerts } = useSnmpAlerts();

      expect(snmpAlerts.value).toHaveLength(2);
      expect(snmpAlerts.value[1].id).toBe('sub-2');
    });
  });

  // ── query state passthrough ──────────────────────────────────────────────

  describe('query state passthrough', () => {
    it('exposes isLoading from navigated query', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ isLoading: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isLoading } = useSnmpAlerts();

      expect(isLoading.value).toBe(true);
    });

    it('exposes isError from navigated query', () => {
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ isError: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isError } = useSnmpAlerts();

      expect(isError.value).toBe(true);
    });

    it('exposes refetch from navigated query', () => {
      const refetchFn = vi.fn();
      useNavigatedCollection.mockReturnValue(
        makeNavigatedQuery({ refetch: refetchFn }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { refetch } = useSnmpAlerts();

      expect(refetch).toBe(refetchFn);
    });
  });

  // ── addDestination mutationFn ────────────────────────────────────────────

  describe('addDestination mutationFn', () => {
    let capturedAddConfig;

    beforeEach(() => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation((config) => {
        if (callCount === 0) capturedAddConfig = config;
        callCount++;
        return makeMockMutation();
      });
      useSnmpAlerts();
    });

    it('navigates to the subscriptions collection and posts the payload', async () => {
      const collectionUrl = '/redfish/v1/EventService/Subscriptions';
      navigateToCollection.mockResolvedValue(collectionUrl);
      api.post.mockResolvedValue({});

      const payload = {
        Destination: 'snmp://10.0.0.1:162',
        SubscriptionType: 'SNMPTrap',
        Protocol: 'SNMPv2c',
      };

      await capturedAddConfig.mutationFn(payload);

      expect(navigateToCollection).toHaveBeenCalledWith([
        'EventService',
        'Subscriptions',
      ]);
      expect(api.post).toHaveBeenCalledWith(collectionUrl, payload);
    });

    it('throws a translated error when the API call fails', async () => {
      navigateToCollection.mockRejectedValue(new Error('Network error'));
      i18n.global.t.mockReturnValue('pageSnmpAlerts.toast.errorAddDestination');

      await expect(
        capturedAddConfig.mutationFn({
          Destination: 'snmp://10.0.0.1',
          SubscriptionType: 'SNMPTrap',
          Protocol: 'SNMPv2c',
        }),
      ).rejects.toThrow('pageSnmpAlerts.toast.errorAddDestination');
    });

    it('onSuccess invalidates the subscriptions query', () => {
      capturedAddConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: SNMP_QUERY_KEY,
      });
    });
  });

  // ── deleteDestination mutationFn ─────────────────────────────────────────

  describe('deleteDestination mutationFn', () => {
    let capturedDeleteConfig;

    beforeEach(() => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation((config) => {
        if (callCount === 1) capturedDeleteConfig = config;
        callCount++;
        return makeMockMutation();
      });
      useSnmpAlerts();
    });

    it('navigates to the subscriptions collection and deletes by id', async () => {
      const collectionUrl = '/redfish/v1/EventService/Subscriptions';
      navigateToCollection.mockResolvedValue(collectionUrl);
      api.delete.mockResolvedValue({});

      await capturedDeleteConfig.mutationFn('sub-1');

      expect(api.delete).toHaveBeenCalledWith(`${collectionUrl}/sub-1`);
    });

    it('throws a translated error (with id) when the delete fails', async () => {
      navigateToCollection.mockRejectedValue(new Error('Network error'));
      i18n.global.t.mockReturnValue(
        'pageSnmpAlerts.toast.errorDeleteDestination',
      );

      await expect(capturedDeleteConfig.mutationFn('sub-1')).rejects.toThrow(
        'pageSnmpAlerts.toast.errorDeleteDestination',
      );

      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageSnmpAlerts.toast.errorDeleteDestination',
        { id: 'sub-1' },
      );
    });

    it('onSuccess invalidates the subscriptions query', () => {
      capturedDeleteConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: SNMP_QUERY_KEY,
      });
    });
  });

  // ── deleteMultipleDestinations mutationFn ────────────────────────────────

  describe('deleteMultipleDestinations mutationFn', () => {
    let capturedDeleteMultipleConfig;

    beforeEach(() => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation((config) => {
        if (callCount === 2) capturedDeleteMultipleConfig = config;
        callCount++;
        return makeMockMutation();
      });
      useSnmpAlerts();
    });

    it('deletes each destination and returns success/error counts', async () => {
      const collectionUrl = '/redfish/v1/EventService/Subscriptions';
      navigateToCollection.mockResolvedValue(collectionUrl);
      api.delete.mockResolvedValue({});

      const destinations = [{ id: 'sub-1' }, { id: 'sub-2' }];

      const result =
        await capturedDeleteMultipleConfig.mutationFn(destinations);

      expect(api.delete).toHaveBeenCalledTimes(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
    });

    it('counts failed deletes in errorCount', async () => {
      navigateToCollection.mockResolvedValue(
        '/redfish/v1/EventService/Subscriptions',
      );
      api.delete
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('fail'));

      const destinations = [{ id: 'sub-1' }, { id: 'sub-2' }];

      const result =
        await capturedDeleteMultipleConfig.mutationFn(destinations);

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
    });

    it('onSuccess invalidates the subscriptions query', () => {
      capturedDeleteMultipleConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: SNMP_QUERY_KEY,
      });
    });
  });

  // ── mutation state passthrough ───────────────────────────────────────────

  describe('mutation state passthrough', () => {
    it('exposes isAddingDestination isPending', () => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation(() => {
        callCount++;
        return makeMockMutation({
          isPending: callCount === 1 ? ref(true) : ref(false),
        });
      });

      const { isAddingDestination } = useSnmpAlerts();

      expect(isAddingDestination.value).toBe(true);
    });

    it('exposes isDeletingDestination isPending', () => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation(() => {
        callCount++;
        return makeMockMutation({
          isPending: callCount === 2 ? ref(true) : ref(false),
        });
      });

      const { isDeletingDestination } = useSnmpAlerts();

      expect(isDeletingDestination.value).toBe(true);
    });

    it('exposes isDeletingMultiple isPending', () => {
      useNavigatedCollection.mockReturnValue(makeNavigatedQuery());
      let callCount = 0;
      useMutation.mockImplementation(() => {
        callCount++;
        return makeMockMutation({
          isPending: callCount === 3 ? ref(true) : ref(false),
        });
      });

      const { isDeletingMultiple } = useSnmpAlerts();

      expect(isDeletingMultiple.value).toBe(true);
    });
  });
});
