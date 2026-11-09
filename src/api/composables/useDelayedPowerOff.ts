import { ref, onBeforeUnmount } from 'vue';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';
import { serverStateMapper } from './useSystemInfo';
import { useServerPowerControl } from './useServerPowerOperations';

// The first status check starts this long after the power off request
export const POWER_OFF_CHECK_DELAY_MS = 60_000;
// Checking stops after this long, counted from the first check
export const POWER_OFF_CHECK_DURATION_MS = 300_000;
const POWER_OFF_CHECK_INTERVAL_MS = 5_000;

/**
 * Current server status mapped to 'on' | 'off' | 'error' | 'diagnosticMode',
 * or 'unreachable' when it cannot be read (a failed request included).
 */
export const fetchServerStatus = async (): Promise<string> => {
  try {
    const { data } = await api.get<{
      PowerState?: string;
      Status?: { State?: string };
    }>('/redfish/v1/Systems/system');
    const state =
      data.Status?.State === 'Quiesced' || data.Status?.State === 'InTest'
        ? data.Status.State
        : (data.PowerState ?? '');
    return serverStateMapper(state);
  } catch {
    return 'unreachable';
  }
};

interface PowerOffCallbacks {
  onPoweredOff?: () => void;
  onTimeout?: () => void;
}

/**
 * Orderly power off that verifies the result.
 *
 * - isPowerOffRequested turns true as soon as requestPowerOff() is called.
 * - It resets to false only when the request fails or the server is still not
 *   off after the checking window. If the server is confirmed off it stays
 *   true until the page is loaded again.
 * - Checking starts POWER_OFF_CHECK_DELAY_MS after the request and ends when
 *   the server is off or after POWER_OFF_CHECK_DURATION_MS.
 */
export function useDelayedPowerOff() {
  const isPowerOffRequested = ref(false);
  const { serverSoftPowerOff } = useServerPowerControl();

  let active = false;
  let delayTimer: ReturnType<typeof setTimeout> | undefined;
  let intervalTimer: ReturnType<typeof setInterval> | undefined;
  let durationTimer: ReturnType<typeof setTimeout> | undefined;

  const clearTimers = () => {
    clearTimeout(delayTimer);
    clearInterval(intervalTimer);
    clearTimeout(durationTimer);
  };

  // A failed poll counts as "not off yet"
  const isServerOff = async (): Promise<boolean> =>
    (await fetchServerStatus()) === 'off';

  const startChecking = ({ onPoweredOff, onTimeout }: PowerOffCallbacks) => {
    active = true;
    delayTimer = setTimeout(() => {
      let inFlight = false;

      const check = async () => {
        if (inFlight) return;
        inFlight = true;
        const isOff = await isServerOff();
        inFlight = false;
        if (!active || !isOff) return;
        active = false;
        clearTimers();
        onPoweredOff?.();
      };

      durationTimer = setTimeout(() => {
        if (!active) return;
        active = false;
        clearTimers();
        isPowerOffRequested.value = false;
        onTimeout?.();
      }, POWER_OFF_CHECK_DURATION_MS);
      intervalTimer = setInterval(check, POWER_OFF_CHECK_INTERVAL_MS);
      check();
    }, POWER_OFF_CHECK_DELAY_MS);
  };

  const requestPowerOff = async (
    callbacks: PowerOffCallbacks = {},
  ): Promise<void> => {
    // Disable immediately, before the request completes
    isPowerOffRequested.value = true;
    try {
      await serverSoftPowerOff();
    } catch (error) {
      isPowerOffRequested.value = false;
      throw error;
    }
    startChecking(callbacks);
  };

  onBeforeUnmount(() => {
    active = false;
    clearTimers();
  });

  return { isPowerOffRequested, requestPowerOff };
}
