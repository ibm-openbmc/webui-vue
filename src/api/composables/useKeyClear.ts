import { useMutation } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

/**
 * Composable for Key Clear operations
 * Replaces the KeyClearStore with a simple composable
 */
export function useKeyClear() {
    const clearKeysMutation = useMutation({
        mutationFn: async (selectedKey: string): Promise<string> => {
            try {
                const selectedKeyForClearing = {
                    Attributes: { hb_key_clear_request: selectedKey },
                };
                await api.patch(
                    '/redfish/v1/Systems/system/Bios/Settings',
                    selectedKeyForClearing,
                );
                return i18n.global.t('pageKeyClear.toast.selectedKeyClearedSuccess');
            } catch (error) {
                console.error('Key clear error:', error);
                throw new Error(
                    i18n.global.t('pageKeyClear.toast.selectedKeyClearedError'),
                );
            }
        },
        onSuccess: () => {
            // Key clear successful
        },
    });

    async function clearEncryptionKeys(selectedKey: string): Promise<string> {
        return await clearKeysMutation.mutateAsync(selectedKey);
    }

    return {
        clearEncryptionKeys,
        isClearing: clearKeysMutation.isPending,
    };
}
