import { computed } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';

interface NTPData {
    NTPServers: string[];
    ProtocolEnabled: boolean;
    NetworkSuppliedServers?: string[];
}

interface NetworkProtocolResponse {
    NTP: NTPData;
}

export interface DateTimeFormData {
    ntpProtocolEnabled: boolean;
    ntpServersArray?: string[];
    updatedDateTime?: string;
}

/**
 * Composable for fetching and updating Date/Time settings
 * Replaces DateTimeStore with TanStack Query
 */
export function useDateTime() {
    const queryClient = useQueryClient();

    const {
        data: ntpData,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['redfish', 'managers', 'bmc', 'networkProtocol'],
        queryFn: async (): Promise<NTPData> => {
            const response = await api.get<NetworkProtocolResponse>(
                '/redfish/v1/Managers/bmc/NetworkProtocol',
            );
            return response.data.NTP;
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        // Don't retry client errors (4xx) — they won't succeed on retry.
        // Do retry transient server errors (5xx) and network failures.
        retry: (failureCount: number, err: any) => {
            const status = err?.response?.status;
            if (status && status >= 400 && status < 500) return false;
            return failureCount < 2;
        },
        retryDelay: (attemptIndex: number) =>
            Math.min(1000 * 2 ** attemptIndex, 10000),
    });

    const ntpServers = computed<string[]>(() => ntpData.value?.NTPServers || []);
    const isNtpProtocolEnabled = computed<boolean>(
        () => ntpData.value?.ProtocolEnabled || false,
    );
    const networkSuppliedServers = computed<string[]>(
        () => ntpData.value?.NetworkSuppliedServers || [],
    );

    const updateDateTimeMutation = useMutation({
        mutationFn: async (dateTimeForm: DateTimeFormData): Promise<string> => {
            const ntpPayload: {
                NTP: {
                    ProtocolEnabled: boolean;
                    NTPServers?: string[];
                };
            } = {
                NTP: {
                    ProtocolEnabled: dateTimeForm.ntpProtocolEnabled,
                },
            };

            if (dateTimeForm.ntpProtocolEnabled && dateTimeForm.ntpServersArray) {
                ntpPayload.NTP.NTPServers = dateTimeForm.ntpServersArray;
            }

            // Update NTP settings
            await api.patch('/redfish/v1/Managers/bmc/NetworkProtocol', ntpPayload);

            // If manual mode, update the date/time after NTP is disabled
            if (!dateTimeForm.ntpProtocolEnabled && dateTimeForm.updatedDateTime) {
                /**
                 * https://github.com/openbmc/phosphor-time-manager/blob/master/README.md#special-note-on-changing-ntp-setting
                 * When time mode is initially set to Manual from NTP,
                 * NTP service is disabled and the NTP service is
                 * stopping but not stopped, setting time will return an error.
                 * There are no responses from backend to notify when NTP is stopped.
                 * To work around, a timeout is set to allow NTP to fully stop
                 * TODO: remove timeout if backend solves
                 * https://github.com/openbmc/openbmc/issues/3459
                 */
                const timeoutVal = isNtpProtocolEnabled.value ? 20000 : 0;

                await new Promise<void>((resolve, reject) => {
                    setTimeout(() => {
                        const dateTimeData = {
                            DateTime: dateTimeForm.updatedDateTime,
                        };
                        api
                            .patch('/redfish/v1/Managers/bmc', dateTimeData)
                            .then(() => resolve())
                            .catch(() => reject());
                    }, timeoutVal);
                });
            }

            // Return success message
            if (dateTimeForm.ntpProtocolEnabled) {
                return i18n.global.t(
                    'pageDateTime.toast.successSaveDateTimeForNtpServer',
                );
            } else {
                return i18n.global.t('pageDateTime.toast.successSaveDateTime');
            }
        },
        onSuccess: () => {
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: ['redfish', 'managers', 'bmc', 'networkProtocol'],
            });
        },
        onError: (error: Error) => {
            console.error('Error updating date/time:', error);
            throw new Error(i18n.global.t('pageDateTime.toast.errorSaveDateTime'));
        },
    });

    async function updateDateTime(dateTimeForm: DateTimeFormData): Promise<string> {
        return await updateDateTimeMutation.mutateAsync(dateTimeForm);
    }

    return {
        ntpServers,
        isNtpProtocolEnabled,
        networkSuppliedServers,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
        updateDateTime,
        isUpdating: updateDateTimeMutation.isPending,
    };
}

// Made with Bob
