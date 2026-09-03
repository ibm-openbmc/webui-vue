import { computed } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { useRedfishCollection } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - api.js is a JavaScript module
import api, { getResponseCount } from '@/store/api';
import type { Session } from '@/types/redfish';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

/**
 * Returns the current session URI stored during login.
 * Kept as a function so it is read at call-time (not import-time).
 */
function getCurrentSessionUri(): string | null {
  return localStorage.getItem('currentSessionUri');
}

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
  const queryClient = useQueryClient();

  const {
    data: sessionsData,
    isLoading,
    isFetching,
    error,
    isError,
    refetch,
  } = useRedfishCollection<Session>('/redfish/v1/SessionService/Sessions', {
    expand: false,
    queryConfig: RedfishQueryPresets.sessions,
  });

  const sessions = computed<SessionDisplay[]>(() => {
    if (!sessionsData.value) {
      return [];
    }
    return sessionsData.value.map(transformSessionData);
  });

  const disconnectSessionsMutation = useMutation({
    mutationFn: async (
      uris: string[],
    ): Promise<{ type: string; message: string }[]> => {
      const currentSessionUri = getCurrentSessionUri();

      // Separate current session from others so it is disconnected last.
      // This prevents cutting off the network connection while other deletes
      // are still in-flight (fix from PR #664).
      let currentSession: string | null = null;
      const otherSessions: string[] = [];

      for (const uri of uris) {
        if (currentSessionUri && uri === currentSessionUri) {
          currentSession = uri;
        } else {
          otherSessions.push(uri);
        }
      }

      // Build promise list: others first, current session last
      const promises = otherSessions.map((uri) => {
        return api.delete(uri).catch((error: Error) => {
          console.log(error);
          return error;
        });
      });

      if (currentSession) {
        promises.push(
          api.delete(currentSession).catch((error: Error) => {
            console.log(error);
            return error;
          }),
        );
      }

      const responses = await api.all(promises);
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          'redfish',
          'collection',
          '/redfish/v1/SessionService/Sessions',
        ],
      });
    },
    onError: (error: Error) => {
      console.error('Error disconnecting sessions:', error);
    },
  });

  async function disconnectSessions(uris: string[]) {
    return await disconnectSessionsMutation.mutateAsync(uris);
  }

  return {
    sessions,
    isLoading,
    isFetching,
    error,
    isError,
    refetch,
    disconnectSessions,
    isDisconnecting: disconnectSessionsMutation.isPending,
  };
}
