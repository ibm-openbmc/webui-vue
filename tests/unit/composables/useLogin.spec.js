import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// ---------------------------------------------------------------------------
// Module mocks — declared before any imports that trigger module evaluation
// ---------------------------------------------------------------------------

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

// useRedfishResource is the only thing useLogin pulls from useAllSubResources
vi.mock('@/api/composables/useAllSubResources', () => ({
  useRedfishResource: vi.fn(),
}));

vi.mock('@/api/composables/shared/queryConfig', () => ({
  RedfishQueryPresets: {
    config: { staleTime: 60_000, gcTime: 10 * 60_000 },
  },
}));

import { useMutation, useQueryClient } from '@tanstack/vue-query';
import api from '@/store/api';
import { useRedfishResource } from '@/api/composables/useAllSubResources';
import { useLogin } from '@/api/composables/useLogin';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  ...overrides,
});

const makeServiceRoot = (ibm = {}) => ({
  '@odata.id': '/redfish/v1/',
  Oem: { IBM: ibm },
});

// Default stub for useRedfishResource — returns a ref that can be replaced
function stubRedfishResource(data = null) {
  const dataRef = ref(data);
  useRedfishResource.mockReturnValue({
    data: dataRef,
    isLoading: ref(false),
    refetch: vi.fn(),
  });
  return dataRef;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLogin', () => {
  let mockQueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = { invalidateQueries: vi.fn() };
    useQueryClient.mockReturnValue(mockQueryClient);
    useMutation.mockReturnValue(makeMockMutation());
    stubRedfishResource(null);
  });

  // ── return shape ───────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('exposes loginPageDetails, isGlobalMfaEnabled, isLoading, isLoggingIn, login, refetch', () => {
      const result = useLogin();

      expect(result).toHaveProperty('loginPageDetails');
      expect(result).toHaveProperty('isGlobalMfaEnabled');
      expect(result).toHaveProperty('isLoading');
      expect(result).toHaveProperty('isLoggingIn');
      expect(typeof result.login).toBe('function');
      expect(typeof result.refetch).toBe('function');
    });

    it('does not expose raw mutation object', () => {
      const result = useLogin();
      expect(result.loginMutation).toBeUndefined();
    });
  });

  // ── loginPageDetails — derived from service root ───────────────────────────

  describe('loginPageDetails', () => {
    it('defaults to null/false when service root is not yet loaded', () => {
      stubRedfishResource(null);

      const { loginPageDetails } = useLogin();

      expect(loginPageDetails.value.dateTime).toBeNull();
      expect(loginPageDetails.value.model).toBeNull();
      expect(loginPageDetails.value.serial).toBeNull();
      expect(loginPageDetails.value.acfWindowActive).toBe(false);
    });

    it('populates from IBM OEM fields when data arrives', () => {
      // Stub with data already present so the immediate watch fires with it
      stubRedfishResource(
        makeServiceRoot({
          DateTime: '2024-06-01T12:00:00Z',
          Model: 'IBM 9009-42A',
          SerialNumber: 'SN12345',
          ACFWindowActive: true,
        }),
      );

      const { loginPageDetails } = useLogin();

      expect(loginPageDetails.value.dateTime).toBeInstanceOf(Date);
      expect(loginPageDetails.value.dateTime.toISOString()).toBe(
        '2024-06-01T12:00:00.000Z',
      );
      expect(loginPageDetails.value.model).toBe('IBM 9009-42A');
      expect(loginPageDetails.value.serial).toBe('SN12345');
      expect(loginPageDetails.value.acfWindowActive).toBe(true);
    });

    it('sets dateTime to null when DateTime is absent', () => {
      stubRedfishResource(makeServiceRoot({ Model: 'IBM' }));

      const { loginPageDetails } = useLogin();

      expect(loginPageDetails.value.dateTime).toBeNull();
    });

    it('sets acfWindowActive to false when ACFWindowActive is absent', () => {
      stubRedfishResource(makeServiceRoot({ Model: 'IBM' }));

      const { loginPageDetails } = useLogin();

      expect(loginPageDetails.value.acfWindowActive).toBe(false);
    });

    it('handles missing Oem.IBM gracefully', () => {
      stubRedfishResource({ '@odata.id': '/redfish/v1/' }); // no Oem at all

      const { loginPageDetails, isGlobalMfaEnabled } = useLogin();

      expect(loginPageDetails.value.model).toBeNull();
      expect(isGlobalMfaEnabled.value).toBe(false);
    });
  });

  // ── isGlobalMfaEnabled ─────────────────────────────────────────────────────

  describe('isGlobalMfaEnabled', () => {
    it('is false by default', () => {
      const { isGlobalMfaEnabled } = useLogin();
      expect(isGlobalMfaEnabled.value).toBe(false);
    });

    it('is true when MultiFactorAuthEnabled is true', () => {
      stubRedfishResource(makeServiceRoot({ MultiFactorAuthEnabled: true }));

      const { isGlobalMfaEnabled } = useLogin();

      expect(isGlobalMfaEnabled.value).toBe(true);
    });

    it('is false when MultiFactorAuthEnabled is false', () => {
      stubRedfishResource(makeServiceRoot({ MultiFactorAuthEnabled: false }));

      const { isGlobalMfaEnabled } = useLogin();

      expect(isGlobalMfaEnabled.value).toBe(false);
    });
  });

  // ── isLoggingIn ────────────────────────────────────────────────────────────

  describe('isLoggingIn', () => {
    it('is false when mutation is not pending', () => {
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(false) }));

      const { isLoggingIn } = useLogin();

      expect(isLoggingIn.value).toBe(false);
    });

    it('is true when mutation is pending', () => {
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(true) }));

      const { isLoggingIn } = useLogin();

      expect(isLoggingIn.value).toBe(true);
    });
  });

  // ── login mutationFn ───────────────────────────────────────────────────────

  describe('login mutationFn', () => {
    let capturedConfig;

    beforeEach(() => {
      useMutation.mockImplementation((config) => {
        capturedConfig = config;
        return makeMockMutation();
      });
      useLogin();
    });

    it('posts to /redfish/v1/SessionService/Sessions', async () => {
      api.post.mockResolvedValue({ data: {} });

      await capturedConfig.mutationFn({
        username: 'admin',
        password: 's3cr3t',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/SessionService/Sessions',
        { UserName: 'admin', Password: 's3cr3t' },
      );
    });

    it('includes Token in body when otpInfo is provided', async () => {
      api.post.mockResolvedValue({ data: {} });

      await capturedConfig.mutationFn({
        username: 'admin',
        password: 's3cr3t',
        otpInfo: '123456',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/SessionService/Sessions',
        { UserName: 'admin', Password: 's3cr3t', Token: '123456' },
      );
    });

    it('omits Token when otpInfo is an empty string', async () => {
      api.post.mockResolvedValue({ data: {} });

      await capturedConfig.mutationFn({
        username: 'admin',
        password: 's3cr3t',
        otpInfo: '',
      });

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/SessionService/Sessions',
        { UserName: 'admin', Password: 's3cr3t' },
      );
    });

    it('returns isGenerateOtpRequired: false when not required', async () => {
      api.post.mockResolvedValue({ data: {} });

      const result = await capturedConfig.mutationFn({
        username: 'admin',
        password: 's3cr3t',
      });

      expect(result).toEqual({ isGenerateOtpRequired: false });
    });

    it('returns isGenerateOtpRequired: true when server signals GenerateSecretKeyRequired', async () => {
      api.post.mockResolvedValue({
        data: {
          '@Message.ExtendedInfo': [
            { MessageId: 'Base.1.0.GenerateSecretKeyRequired' },
          ],
        },
      });

      const result = await capturedConfig.mutationFn({
        username: 'admin',
        password: 's3cr3t',
      });

      expect(result).toEqual({ isGenerateOtpRequired: true });
    });

    it('propagates errors thrown by api.post', async () => {
      api.post.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        capturedConfig.mutationFn({ username: 'admin', password: 'wrong' }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  // ── onSuccess — cache invalidation ────────────────────────────────────────

  describe('onSuccess', () => {
    it('invalidates the service-root cache after a successful login', () => {
      let capturedOnSuccess;
      useMutation.mockImplementation((config) => {
        capturedOnSuccess = config.onSuccess;
        return makeMockMutation();
      });

      useLogin();
      capturedOnSuccess();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['redfish', 'resource', '/redfish/v1/'],
      });
    });
  });

  // ── useRedfishResource integration ────────────────────────────────────────

  describe('useRedfishResource', () => {
    it('is called with /redfish/v1/ and the config preset', () => {
      useLogin();

      expect(useRedfishResource).toHaveBeenCalledWith(
        '/redfish/v1/',
        expect.objectContaining({
          queryConfig: expect.objectContaining({ staleTime: 60_000 }),
        }),
      );
    });
  });
});
