// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
import i18n from '@/i18n';

/**
 * Composable for Key Clear operations
 * Replaces the KeyClearStore with a simple composable
 */
export function useKeyClear() {
    async function clearEncryptionKeys(selectedKey: string): Promise<string> {
        const selectedKeyForClearing = {
            Attributes: { hb_key_clear_request: selectedKey },
        };
        return await api
            .patch(
                '/redfish/v1/Systems/system/Bios/Settings',
                selectedKeyForClearing,
            )
            .then(() =>
                i18n.global.t('pageKeyClear.toast.selectedKeyClearedSuccess'),
            )
            .catch((error: Error) => {
                console.log('Key clear', error);
                throw new Error(
                    i18n.global.t('pageKeyClear.toast.selectedKeyClearedError'),
                );
            });
    }

    return {
        clearEncryptionKeys,
    };
}
