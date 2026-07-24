import { useMutation } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

/**
 * Composable for Factory Reset page operations
 * Replaces FactoryResetStore with TanStack Query mutations
 */
export function useFactoryReset() {
  const resetToDefaultsMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      try {
        await api.post(
          '/redfish/v1/Managers/bmc/Actions/Manager.ResetToDefaults',
          { ResetType: 'ResetAll' },
        );
        return i18n.global.t('pageFactoryReset.toast.resetToDefaultsSuccess');
      } catch (error) {
        console.log('Factory Reset: ', error);
        throw new Error(
          i18n.global.t('pageFactoryReset.toast.resetToDefaultsError'),
        );
      }
    },
  });

  const resetBiosMutation = useMutation({
    mutationFn: async (): Promise<string> => {
      try {
        await api.post(
          '/redfish/v1/Systems/system/Bios/Actions/Bios.ResetBios',
        );
        return i18n.global.t('pageFactoryReset.toast.resetBiosSuccess');
      } catch (error) {
        console.log('Factory Reset: ', error);
        throw new Error(i18n.global.t('pageFactoryReset.toast.resetBiosError'));
      }
    },
  });

  return {
    resetToDefaults: resetToDefaultsMutation.mutateAsync,
    resetBios: resetBiosMutation.mutateAsync,
    isResetting:
      resetToDefaultsMutation.isPending || resetBiosMutation.isPending,
  };
}
