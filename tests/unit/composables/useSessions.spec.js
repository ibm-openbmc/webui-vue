import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref } from 'vue';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishCollection: vi.fn(),
}));

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('@/store/api', () => ({
  default: {
    delete: vi.fn(),
    all: vi.fn(),
  },
  getResponseCount: vi.fn(),
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

vi.mock('@/api/composables/shared/queryConfig', () => ({
  RedfishQueryPresets: {
    sensors: { staleTime: 0 },
  },
}));

import { useRedfishCollection } from '@/api/composables/useAllSubResources';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import api, { getResponseCount } from '@/store/api';
import i18n from '@/i18n';
import { useSessions } from '@/api/composables/useSessions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCollectionQuery = (overrides = {}) => ({
  data: ref(null),
  isLoading: ref(false),
  isFetching: ref(false),
  error: ref(null),
  isError: ref(false),
  refetch: vi.fn(),
  ...overrides,
});

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  ...overrides,
});

const SESSION_A = {
  '@odata.id': '/redfish/v1/SessionService/Sessions/1',
  Context: 'ctx-1',
  UserName: 'alice',
  ClientOriginIPAddress: '::ffff:192.168.1.1',
};

const SESSION_B = {
  '@odata.id': '/redfish/v1/SessionService/Sessions/2',
  Context: 'ctx-2',
  UserName: 'bob',
  ClientOriginIPAddress: '10.0.0.2',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSessions', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── sessions computed ────────────────────────────────────────────────────

  describe('sessions computed', () => {
    it('returns empty array when data is null', () => {
      useRedfishCollection.mockReturnValue(makeCollectionQuery({ data: ref(null) }));
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value).toEqual([]);
    });

    it('maps raw Redfish session data to SessionDisplay shape', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([SESSION_A]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value).toHaveLength(1);
      expect(sessions.value[0]).toMatchObject({
        clientID: 'ctx-1',
        username: 'alice',
        ipAddress: '192.168.1.1',
        uri: '/redfish/v1/SessionService/Sessions/1',
      });
    });

    it('strips ::ffff: prefix from IPv4-mapped IPv6 addresses', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([SESSION_A]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].ipAddress).toBe('192.168.1.1');
    });

    it('keeps plain IPv4 address unchanged', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([SESSION_B]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].ipAddress).toBe('10.0.0.2');
    });

    it('falls back to "--" for missing Context', () => {
      const session = { ...SESSION_A, Context: undefined };
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([session]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].clientID).toBe('--');
    });

    it('falls back to "--" for missing UserName', () => {
      const session = { ...SESSION_A, UserName: undefined };
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([session]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].username).toBe('--');
    });

    it('falls back to "--" for missing ClientOriginIPAddress', () => {
      const session = { ...SESSION_A, ClientOriginIPAddress: undefined };
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([session]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].ipAddress).toBe('--');
    });

    it('includes a disconnect action for each session', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([SESSION_A]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value[0].actions).toHaveLength(1);
      expect(sessions.value[0].actions[0].value).toBe('disconnect');
    });

    it('maps multiple sessions correctly', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ data: ref([SESSION_A, SESSION_B]) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { sessions } = useSessions();

      expect(sessions.value).toHaveLength(2);
      expect(sessions.value[1].username).toBe('bob');
    });
  });

  // ── isLoading / isFetching / isError ────────────────────────────────────

  describe('query state passthrough', () => {
    it('exposes isLoading from the collection query', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ isLoading: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isLoading } = useSessions();

      expect(isLoading.value).toBe(true);
    });

    it('exposes isFetching from the collection query', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ isFetching: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isFetching } = useSessions();

      expect(isFetching.value).toBe(true);
    });

    it('exposes isError from the collection query', () => {
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ isError: ref(true) }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { isError } = useSessions();

      expect(isError.value).toBe(true);
    });

    it('exposes refetch from the collection query', () => {
      const refetchFn = vi.fn();
      useRedfishCollection.mockReturnValue(
        makeCollectionQuery({ refetch: refetchFn }),
      );
      useMutation.mockReturnValue(makeMockMutation());

      const { refetch } = useSessions();

      expect(refetch).toBe(refetchFn);
    });

    it('exposes isDisconnecting from the mutation isPending', () => {
      useRedfishCollection.mockReturnValue(makeCollectionQuery());
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isDisconnecting } = useSessions();

      expect(isDisconnecting.value).toBe(true);
    });
  });

  // ── query config ─────────────────────────────────────────────────────────

  describe('query configuration', () => {
    it('queries the Sessions collection endpoint', () => {
      useMutation.mockReturnValue(makeMockMutation());

      useSessions();

      expect(useRedfishCollection).toHaveBeenCalledWith(
        '/redfish/v1/SessionService/Sessions',
        expect.objectContaining({ expand: false }),
      );
    });

    it('uses the sensors query preset', () => {
      useMutation.mockReturnValue(makeMockMutation());

      useSessions();

      expect(useRedfishCollection).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ queryConfig: expect.any(Object) }),
      );
    });
  });

  // ── disconnectSessions mutation ──────────────────────────────────────────

  describe('disconnectSessions mutation fn', () => {
    let capturedConfig;

    beforeEach(() => {
      useRedfishCollection.mockReturnValue(makeCollectionQuery());
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });
      useSessions();
    });

    it('deletes other sessions before the current session', async () => {
      const currentUri = '/redfish/v1/SessionService/Sessions/current';
      const otherUri = '/redfish/v1/SessionService/Sessions/other';
      localStorage.setItem('currentSessionUri', currentUri);

      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}]);
      getResponseCount.mockReturnValue({ successCount: 2, errorCount: 0 });
      i18n.global.t.mockReturnValue('success');

      await capturedConfig.mutationFn([currentUri, otherUri]);

      // api.all receives promises array — verify both URIs were deleted
      expect(api.delete).toHaveBeenCalledWith(otherUri);
      expect(api.delete).toHaveBeenCalledWith(currentUri);

      // otherUri must appear before currentUri in the promises list
      const deleteCallOrder = api.delete.mock.calls.map(([uri]) => uri);
      expect(deleteCallOrder.indexOf(otherUri)).toBeLessThan(
        deleteCallOrder.indexOf(currentUri),
      );
    });

    it('does not separate sessions when no current session URI is stored', async () => {
      localStorage.removeItem('currentSessionUri');
      const uris = [
        '/redfish/v1/SessionService/Sessions/1',
        '/redfish/v1/SessionService/Sessions/2',
      ];

      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}, {}]);
      getResponseCount.mockReturnValue({ successCount: 2, errorCount: 0 });
      i18n.global.t.mockReturnValue('success');

      await capturedConfig.mutationFn(uris);

      expect(api.delete).toHaveBeenCalledTimes(2);
    });

    it('returns success toast message when all deletes succeed', async () => {
      const successMsg = 'pageSessions.toast.successDelete';
      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}]);
      getResponseCount.mockReturnValue({ successCount: 1, errorCount: 0 });
      i18n.global.t.mockReturnValue(successMsg);

      const result = await capturedConfig.mutationFn([
        '/redfish/v1/SessionService/Sessions/1',
      ]);

      expect(result).toContainEqual({ type: 'success', message: successMsg });
    });

    it('returns error toast message when a delete fails', async () => {
      const errorMsg = 'pageSessions.toast.errorDelete';
      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([new Error('fail')]);
      getResponseCount.mockReturnValue({ successCount: 0, errorCount: 1 });
      i18n.global.t.mockReturnValue(errorMsg);

      const result = await capturedConfig.mutationFn([
        '/redfish/v1/SessionService/Sessions/1',
      ]);

      expect(result).toContainEqual({ type: 'error', message: errorMsg });
    });

    it('returns both success and error messages when partially failing', async () => {
      api.delete.mockResolvedValue({});
      api.all.mockResolvedValue([{}, new Error('fail')]);
      getResponseCount.mockReturnValue({ successCount: 1, errorCount: 1 });
      i18n.global.t.mockImplementation((key) => key);

      const result = await capturedConfig.mutationFn([
        '/redfish/v1/SessionService/Sessions/1',
        '/redfish/v1/SessionService/Sessions/2',
      ]);

      expect(result.some((m) => m.type === 'success')).toBe(true);
      expect(result.some((m) => m.type === 'error')).toBe(true);
    });

    it('onSuccess invalidates the sessions collection query', () => {
      capturedConfig.onSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: [
          'redfish',
          'collection',
          '/redfish/v1/SessionService/Sessions',
        ],
      });
    });
  });

  // ── disconnectSessions wrapper ───────────────────────────────────────────

  describe('disconnectSessions', () => {
    it('calls mutateAsync with the provided URIs', async () => {
      useRedfishCollection.mockReturnValue(makeCollectionQuery());
      const mutateAsync = vi.fn().mockResolvedValue([]);
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { disconnectSessions } = useSessions();
      await disconnectSessions(['/redfish/v1/SessionService/Sessions/1']);

      expect(mutateAsync).toHaveBeenCalledWith([
        '/redfish/v1/SessionService/Sessions/1',
      ]);
    });

    it('returns the toast messages from mutateAsync', async () => {
      useRedfishCollection.mockReturnValue(makeCollectionQuery());
      const messages = [{ type: 'success', message: 'ok' }];
      const mutateAsync = vi.fn().mockResolvedValue(messages);
      useMutation.mockReturnValue(makeMockMutation({ mutateAsync }));

      const { disconnectSessions } = useSessions();
      const result = await disconnectSessions([
        '/redfish/v1/SessionService/Sessions/1',
      ]);

      expect(result).toEqual(messages);
    });
  });
});
