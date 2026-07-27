import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@tanstack/vue-query', () => ({
  useMutation: vi.fn(),
}));

vi.mock('@/store/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('@/i18n', () => ({
  default: {
    global: {
      t: vi.fn((key) => key),
    },
  },
}));

import { useMutation } from '@tanstack/vue-query';
import api from '@/store/api';
import i18n from '@/i18n';
import { useFactoryReset } from '@/api/composables/useFactoryReset';
import { ref } from 'vue';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockMutation = (overrides = {}) => ({
  mutateAsync: vi.fn(),
  isPending: ref(false),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFactoryReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── return shape ─────────────────────────────────────────────────────────

  describe('return shape', () => {
    it('exposes resetToDefaults, resetBios, and isResetting', () => {
      useMutation.mockReturnValue(makeMockMutation());

      const result = useFactoryReset();

      expect(typeof result.resetToDefaults).toBe('function');
      expect(typeof result.resetBios).toBe('function');
      expect('isResetting' in result).toBe(true);
    });

    it('does not expose raw mutation objects', () => {
      useMutation.mockReturnValue(makeMockMutation());

      const result = useFactoryReset();

      expect(result.resetToDefaultsMutation).toBeUndefined();
      expect(result.resetBiosMutation).toBeUndefined();
    });
  });

  // ── isResetting ──────────────────────────────────────────────────────────

  describe('isResetting', () => {
    it('is false when neither mutation is pending', () => {
      useMutation.mockReturnValue(makeMockMutation({ isPending: ref(false) }));

      const { isResetting } = useFactoryReset();

      expect(isResetting.value).toBe(false);
    });

    it('is true when resetToDefaults mutation is pending', () => {
      useMutation
        .mockReturnValueOnce(makeMockMutation({ isPending: ref(true) })) // resetToDefaults
        .mockReturnValueOnce(makeMockMutation({ isPending: ref(false) })); // resetBios

      const { isResetting } = useFactoryReset();

      expect(isResetting.value).toBe(true);
    });

    it('is true when resetBios mutation is pending', () => {
      useMutation
        .mockReturnValueOnce(makeMockMutation({ isPending: ref(false) })) // resetToDefaults
        .mockReturnValueOnce(makeMockMutation({ isPending: ref(true) })); // resetBios

      const { isResetting } = useFactoryReset();

      expect(isResetting.value).toBe(true);
    });
  });

  // ── resetToDefaults mutationFn ────────────────────────────────────────────

  describe('resetToDefaults mutationFn', () => {
    let capturedResetToDefaultsConfig;

    beforeEach(() => {
      let callCount = 0;
      useMutation.mockImplementation((config) => {
        if (callCount === 0) capturedResetToDefaultsConfig = config;
        callCount++;
        return makeMockMutation();
      });
      useFactoryReset();
    });

    it('posts to the correct ResetToDefaults endpoint', async () => {
      api.post.mockResolvedValue({});
      i18n.global.t.mockReturnValue('success');

      await capturedResetToDefaultsConfig.mutationFn();

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/Managers/bmc/Actions/Manager.ResetToDefaults',
        { ResetType: 'ResetAll' },
      );
    });

    it('returns the translated success message on success', async () => {
      const successMsg = 'pageFactoryReset.toast.resetToDefaultsSuccess';
      api.post.mockResolvedValue({});
      i18n.global.t.mockReturnValue(successMsg);

      const result = await capturedResetToDefaultsConfig.mutationFn();

      expect(result).toBe(successMsg);
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageFactoryReset.toast.resetToDefaultsSuccess',
      );
    });

    it('throws a translated error when the API call fails', async () => {
      const errMsg = 'pageFactoryReset.toast.resetToDefaultsError';
      api.post.mockRejectedValue(new Error('Network error'));
      i18n.global.t.mockReturnValue(errMsg);

      await expect(capturedResetToDefaultsConfig.mutationFn()).rejects.toThrow(
        errMsg,
      );
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageFactoryReset.toast.resetToDefaultsError',
      );
    });

    it('logs the raw error before throwing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const rawError = new Error('Network error');
      api.post.mockRejectedValue(rawError);
      i18n.global.t.mockReturnValue('error');

      await expect(
        capturedResetToDefaultsConfig.mutationFn(),
      ).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Factory Reset: ', rawError);
      consoleSpy.mockRestore();
    });
  });

  // ── resetBios mutationFn ─────────────────────────────────────────────────

  describe('resetBios mutationFn', () => {
    let capturedResetBiosConfig;

    beforeEach(() => {
      let callCount = 0;
      useMutation.mockImplementation((config) => {
        if (callCount === 1) capturedResetBiosConfig = config;
        callCount++;
        return makeMockMutation();
      });
      useFactoryReset();
    });

    it('posts to the correct ResetBios endpoint', async () => {
      api.post.mockResolvedValue({});
      i18n.global.t.mockReturnValue('success');

      await capturedResetBiosConfig.mutationFn();

      expect(api.post).toHaveBeenCalledWith(
        '/redfish/v1/Systems/system/Bios/Actions/Bios.ResetBios',
      );
    });

    it('returns the translated success message on success', async () => {
      const successMsg = 'pageFactoryReset.toast.resetBiosSuccess';
      api.post.mockResolvedValue({});
      i18n.global.t.mockReturnValue(successMsg);

      const result = await capturedResetBiosConfig.mutationFn();

      expect(result).toBe(successMsg);
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageFactoryReset.toast.resetBiosSuccess',
      );
    });

    it('throws a translated error when the API call fails', async () => {
      const errMsg = 'pageFactoryReset.toast.resetBiosError';
      api.post.mockRejectedValue(new Error('Network error'));
      i18n.global.t.mockReturnValue(errMsg);

      await expect(capturedResetBiosConfig.mutationFn()).rejects.toThrow(
        errMsg,
      );
      expect(i18n.global.t).toHaveBeenCalledWith(
        'pageFactoryReset.toast.resetBiosError',
      );
    });

    it('logs the raw error before throwing', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const rawError = new Error('BIOS error');
      api.post.mockRejectedValue(rawError);
      i18n.global.t.mockReturnValue('error');

      await expect(capturedResetBiosConfig.mutationFn()).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Factory Reset: ', rawError);
      consoleSpy.mockRestore();
    });
  });

  // ── integration ──────────────────────────────────────────────────────────

  describe('integration', () => {
    it('resetBios and resetToDefaults call their respective mutateAsync', async () => {
      const biosAsync = vi.fn().mockResolvedValue('bios success');
      const defaultsAsync = vi.fn().mockResolvedValue('defaults success');

      let callCount = 0;
      useMutation.mockImplementation(() => {
        callCount++;
        return makeMockMutation({
          mutateAsync: callCount === 1 ? defaultsAsync : biosAsync,
        });
      });

      const { resetToDefaults, resetBios } = useFactoryReset();

      await resetToDefaults();
      expect(defaultsAsync).toHaveBeenCalled();

      await resetBios();
      expect(biosAsync).toHaveBeenCalled();
    });
  });
});
