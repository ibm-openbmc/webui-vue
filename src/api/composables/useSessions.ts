import { computed } from 'vue';
import { useRedfishCollection } from './useRedfishCollection';
// @ts-ignore - api.js is a JavaScript module
import api, { getResponseCount } from '@/store/api';
import type { Session } from '@/types/redfish';
import i18n from '@/i18n';

export interface SessionDisplay {
    clientID: string;
    username: string;
    ipAddress: string;
    uri: string;
    actions: { value: string; title: string }[];
}

function transformSessionData(session: Session): SessionDisplay {
    // Filter IP address to IPv4 (strip ::ffff: prefix)
    const ipAddress =
        session.ClientOriginIPAddress?.split('::ffff:').pop() || '--';

    return {
        clientID: session.Context || '--',
        username: session.UserName || '--',
        ipAddress,
        uri: session['@odata.id'],
        actions: [
            {
                value: 'disconnect',
                title: i18n.global.t('pageSessions.action.disconnect'),
            },
        ],
    };
}

/**
 * Composable for fetching all sessions from SessionService
 * Replaces the SessionsStore with TanStack Query
 */
export function useSessions() {
    const {
        data: sessionsData,
        isLoading,
        isFetching,
        error,
        isError,
        refetch,
    } = useRedfishCollection<Session>('/redfish/v1/SessionService/Sessions', {
        expand: false,
    });

    const sessions = computed<SessionDisplay[]>(() => {
        if (!sessionsData.value) {
            return [];
        }
        return sessionsData.value.map(transformSessionData);
    });

    async function disconnectSessions(uris: string[]) {
        const promises = uris.map((uri) =>
            api.delete(uri).catch((error: Error) => {
                console.log(error);
                return error;
            }),
        );

        const responses = await api.all(promises);
        refetch();

        const { successCount, errorCount } = getResponseCount(responses);
        const toastMessages: { type: string; message: string }[] = [];

        if (successCount) {
            const message = i18n.global.t(
                'pageSessions.toast.successDelete',
                successCount,
            );
            toastMessages.push({ type: 'success', message });
        }

        if (errorCount) {
            const message = i18n.global.t(
                'pageSessions.toast.errorDelete',
                errorCount,
            );
            toastMessages.push({ type: 'error', message });
        }

        return toastMessages;
    }

    return {
        sessions,
        isLoading,
        isFetching,
        error,
        isError,
        refetch,
        disconnectSessions,
    };
}