import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import useLoadingBarComposable from './useLoadingBarComposable';

/**
 * Manages the page loading bar for TanStack Query-backed pages.
 *
 * Rules:
 *  1. On navigation (mount), show the bar if the page needs to fetch data.
 *     We defer the check by one tick so TanStack Query has time to mark
 *     queries as fetching before we decide whether a bar is needed.
 *  2. After the mount-fetch completes, stop tracking isFetching entirely —
 *     interval polls must never retrigger the bar.
 *  3. Always show the bar for user-triggered mutations (isPending).
 *  4. Always hide the bar on route leave / unmount.
 *
 * @param {import('vue').Ref<boolean>} isFetching  TanStack isFetching ref
 * @param {import('vue').Ref<boolean>} [isError]   TanStack isError ref (optional)
 * @param {import('vue').Ref<boolean>} [isPending] Mutation isPending ref (optional)
 */
export function usePageLoadingBar(
  isFetching,
  isError = null,
  isPending = null,
) {
  const { startLoader, endLoader, hideLoader } = useLoadingBarComposable();

  // true while we are waiting for the mount-fetch to complete.
  const awaitingMountFetch = ref(false);

  // Once true, all further isFetching changes are from interval polls — ignored.
  const mountFetchDone = ref(false);

  onMounted(async () => {
    // Wait one tick so TanStack Query can set isFetching=true for stale data
    // before we decide whether a loading bar is needed.
    await nextTick();

    if (mountFetchDone.value) {
      // The watcher already handled everything (isFetching was true synchronously
      // even before the tick — e.g. a brand-new query with no cache at all).
      return;
    }

    if (isFetching.value) {
      // Fetch is in-flight after the tick — show the bar.
      awaitingMountFetch.value = true;
      startLoader();
    } else {
      // No fetch started even after the tick — data is fresh, no bar needed.
      // Lock out interval polls.
      mountFetchDone.value = true;
      endLoader();
    }
  });

  watch(isFetching, (fetching) => {
    if (mountFetchDone.value) {
      // Mount-fetch already completed (or was skipped).
      // Any subsequent isFetching change is an interval poll — ignore.
      return;
    }

    if (fetching) {
      // isFetching became true — start the bar if not already started.
      if (!awaitingMountFetch.value) {
        awaitingMountFetch.value = true;
        startLoader();
      }
    } else {
      // isFetching became false — mount-fetch is done.
      if (awaitingMountFetch.value) {
        awaitingMountFetch.value = false;
        mountFetchDone.value = true;
        endLoader();
      }
    }
  });

  // Hide the bar immediately if a fetch errors out during the mount cycle.
  if (isError) {
    watch(isError, (hasError) => {
      if (hasError && awaitingMountFetch.value) {
        awaitingMountFetch.value = false;
        mountFetchDone.value = true;
        endLoader();
      }
    });
  }

  // User-triggered mutations always show the bar regardless of mount state.
  if (isPending) {
    watch(isPending, (pending) => {
      if (pending) {
        startLoader();
      } else {
        endLoader();
      }
    });
  }

  onBeforeUnmount(() => {
    hideLoader();
  });

  return { startLoader, endLoader, hideLoader };
}
