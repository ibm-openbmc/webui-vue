// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
import i18n from '@/i18n';

/**
 * Composable for Factory Reset page operations
 * Replaces FactoryResetStore with a simple composable
 */
export function useFactoryReset() {
    async function resetToDefaults(): Promise<string> {
        return await api
            .post(
                '/redfish/v1/Managers/bmc/Actions/Manager.ResetToDefaults',
                {
                    ResetType: 'ResetAll',
                },
            )
            .then(() => {
                return i18n.global.t(
                    'pageFactoryReset.toast.resetToDefaultsSuccess',
                );
            })
            .catch((error: Error) => {
                console.log('Factory Reset: ', error);
                throw new Error(
                    i18n.global.t(
                        'pageFactoryReset.toast.resetToDefaultsError',
                    ),
                );
            });
    }

    async function resetBios(): Promise<string> {
        return await api
            .post('/redfish/v1/Systems/system/Bios/Actions/Bios.ResetBios')
            .then(() =>
                i18n.global.t('pageFactoryReset.toast.resetBiosSuccess'),
            )
            .catch((error: Error) => {
                console.log('Factory Reset: ', error);
                throw new Error(
                    i18n.global.t('pageFactoryReset.toast.resetBiosError'),
                );
            });
    }

    return {
        resetToDefaults,
        resetBios,
    };
}
