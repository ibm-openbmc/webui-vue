import { computed, ref, watch } from 'vue';
import { useMutation, useQueryClient } from '@tanstack/vue-query';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
import { useRedfishResource } from './useAllSubResources';
import { RedfishQueryPresets } from './shared/queryConfig';
import type { ServiceRoot } from '@/types/redfish';
import type { UseQueryOptions } from '@tanstack/vue-query';

// ── Types ─────────────────────────────────────────────────────────────────────

// Extend ServiceRoot with the IBM OEM fields used on the login page
interface ServiceRootIBM extends ServiceRoot {
  Oem?: {
    IBM?: {
      DateTime?: string;
      Model?: string;
      SerialNumber?: string;
      ACFWindowActive?: boolean;
      MultiFactorAuthEnabled?: boolean;
    };
  };
}

export interface LoginPageDetails {
  dateTime: Date | null;
  model: string | null;
  serial: string | null;
  acfWindowActive: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
  /** Optional TOTP value — omit or pass empty string when not required */
  otpInfo?: string;
}

export interface LoginResult {
  /** True when the server requires the user to generate a new OTP secret */
  isGenerateOtpRequired: boolean;
}

// ── Composable ────────────────────────────────────────────────────────────────

/**
 * Composable for the login page.
 *
 * Follows the same pattern as useIBMiServiceFunctions and
 * useDeconfigurationRecords:
 *   - useRedfishResource fetches and caches the service-root
 *   - watch derives typed refs from the raw response
 *   - useMutation performs the session-creation (login) call
 */
export function useLogin() {
  const queryClient = useQueryClient();

  // Fetch /redfish/v1/ with the config preset — 1 min stale, no background poll
  const {
    data: serviceRootRaw,
    isLoading,
    refetch,
  } = useRedfishResource<ServiceRootIBM>('/redfish/v1/', {
    queryConfig: RedfishQueryPresets.config as Partial<
      UseQueryOptions<ServiceRootIBM>
    >,
  });

  // Derived reactive state — same pattern as availableFunctions in
  // useIBMiServiceFunctions
  const loginPageDetails = ref<LoginPageDetails>({
    dateTime: null,
    model: null,
    serial: null,
    acfWindowActive: false,
  });
  const isGlobalMfaEnabled = ref<boolean>(false);

  watch(
    serviceRootRaw,
    (root) => {
      const ibm = root?.Oem?.IBM;
      loginPageDetails.value = {
        dateTime: ibm?.DateTime ? new Date(ibm.DateTime) : null,
        model: ibm?.Model ?? null,
        serial: ibm?.SerialNumber ?? null,
        acfWindowActive: ibm?.ACFWindowActive ?? false,
      };
      isGlobalMfaEnabled.value = ibm?.MultiFactorAuthEnabled ?? false;
    },
    { immediate: true },
  );

  // ── Login mutation ────────────────────────────────────────────────────────

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResult> => {
      const { username, password, otpInfo } = credentials;

      const requestBody =
        otpInfo && otpInfo !== ''
          ? { UserName: username, Password: password, Token: otpInfo }
          : { UserName: username, Password: password };

      const response = await api.post(
        '/redfish/v1/SessionService/Sessions',
        requestBody,
      );

      const isGenerateOtpRequired =
        Array.isArray(response.data?.['@Message.ExtendedInfo']) &&
        response.data['@Message.ExtendedInfo'][0]?.MessageId?.endsWith(
          'GenerateSecretKeyRequired',
        );

      return { isGenerateOtpRequired };
    },
    onSuccess: () => {
      // Invalidate the cached service-root so it refetches fresh after login
      queryClient.invalidateQueries({
        queryKey: ['redfish', 'resource', '/redfish/v1/'],
      });
    },
  });

  return {
    // Data
    loginPageDetails,
    isGlobalMfaEnabled,

    // Loading state
    isLoading,

    // Actions
    refetch,
    login: loginMutation.mutateAsync,

    // Mutation state
    isLoggingIn: computed(() => loginMutation.isPending.value),
  };
}
