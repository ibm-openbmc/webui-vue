import { ref, onBeforeUnmount } from 'vue';
import { useServerPowerControl } from './useServerPowerOperations';
import { fetchServerStatus } from './useDelayedPowerOff';

// Phase 1: wait for the server to go off. The reboot command was just
// accepted but the server is still on for a few seconds, so only a status of
// 'off' counts (the same approach as the BMC reboot, which waits for the BMC
// to go offline before waiting for it to come back).
const WAIT_OFF_INTERVAL_MS = 1_000;
const WAIT_OFF_MAX_ATTEMPTS = 60;
// Phase 2: wait for the server to be on again.
const WAIT_ON_INTERVAL_MS = 5_000;
const WAIT_ON_MAX_ATTEMPTS = 60;

interface RebootCallbacks {
  onRebooted?: () => void;
  // reason: the phase that did not complete in time
  onFailed?: (reason: 'notOff' | 'notOn') => void;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Server reboot that tracks the power off and the power on.
 *
 * - isRebootInProgress turns true as soon as requestReboot() is called and
 *   goes back to false when the server is on again, when a phase times out,
 *   or when the reboot request fails.
 * - requestReboot() resolves once the reboot request has been accepted; the
 *   tracking continues in the background and reports through the callbacks.
 *   It rejects if the request fails.
 * - Tracking stops when the calling component unmounts.
 */
export function useServerReboot() {
  const isRebootInProgress = ref(false);
  const { serverSoftReboot } = useServerPowerControl();

  let cancelled = false;

  // Polls until the server reaches `target`. Returns false on timeout/cancel.
  const waitForStatus = async (
    target: string,
    maxAttempts: number,
    intervalMs: number,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (cancelled) return false;
      if ((await fetchServerStatus()) === target) return !cancelled;
      await sleep(intervalMs);
    }
    return false;
  };

  const trackReboot = async ({ onRebooted, onFailed }: RebootCallbacks) => {
    const wentOff = await waitForStatus(
      'off',
      WAIT_OFF_MAX_ATTEMPTS,
      WAIT_OFF_INTERVAL_MS,
    );
    if (cancelled) return;
    if (!wentOff) {
      isRebootInProgress.value = false;
      onFailed?.('notOff');
      return;
    }

    const cameBack = await waitForStatus(
      'on',
      WAIT_ON_MAX_ATTEMPTS,
      WAIT_ON_INTERVAL_MS,
    );
    if (cancelled) return;
    isRebootInProgress.value = false;
    if (cameBack) onRebooted?.();
    else onFailed?.('notOn');
  };

  const requestReboot = async (
    callbacks: RebootCallbacks = {},
  ): Promise<void> => {
    // Disable immediately, before the request completes
    isRebootInProgress.value = true;
    try {
      await serverSoftReboot();
    } catch (error) {
      isRebootInProgress.value = false;
      throw error;
    }
    trackReboot(callbacks);
  };

  onBeforeUnmount(() => {
    cancelled = true;
  });

  return { isRebootInProgress, requestReboot };
}
