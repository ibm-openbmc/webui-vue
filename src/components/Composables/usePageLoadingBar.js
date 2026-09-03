import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import useLoadingBarComposable from './useLoadingBarComposable';

/**
 * Manages the page loading bar for TanStack Query-backed pages.
 *
 * Rules:
 *  1. On navigation (mount), show the bar if the page needs to fetch data.
 *     We watch isFetching with { immediate: true } from script-setup time so
 *     we catch fetches that start synchronously in child composables — before
 *     any lifecycle hook fires. onMounted locks out interval polls if no fetch
 *     was needed (data already fresh).
 *  2. After the mount-fetch completes, stop tracking isFetching entirely —
 *     interval polls must never retrigger the bar.
 *  3. Always show the bar for user-triggered mutations (isPending). Accepts a
 *     single ref or an array of refs.
 *  4. Always hide the bar on route leave / unmount.
 *
 * Works in both <script setup> and Options API setup() — no onMounted/
 * onBeforeUnmount dependency on timing relative to query evaluation.
 *
 * @param {import('vue').Ref<boolean>} isFetching  TanStack isFetching ref
 * @param {import('vue').Ref<boolean>} [isError]   TanStack isError ref (optional)
 * @param {import('vue').Ref<boolean>|import('vue').Ref<boolean>[]} [isPending]
 *   Mutation isPending ref or array of refs (optional)
 */
export function usePageLoadingBar(
  isFetching,
  isError = null,
  isPending = null,
) {
  const { startLoader, endLoader, hideLoader } = useLoadingBarComposable();

  // Bail out gracefully if no isFetching ref was provided.
  if (!isFetching) {
    onBeforeUnmount(() => hideLoader());
    return { startLoader, endLoader, hideLoader };
  }

  // Plain variables — only read inside watcher/lifecycle callbacks, never in
  // templates, so refs are not needed.
  let awaitingFetch = false;
  let mountFetchDone = false;

  // Watch with { immediate: true } so we catch a fetch that starts
  // synchronously in a child composable before any lifecycle hook fires.
  watch(
    isFetching,
    (fetching) => {
      if (mountFetchDone) return;
      if (fetching) {
        if (!awaitingFetch) {
          awaitingFetch = true;
          startLoader();
        }
      } else if (awaitingFetch) {
        // Fetch completed — end the bar.
        awaitingFetch = false;
        mountFetchDone = true;
        endLoader();
      } else {
        // isFetching was already false on mount (data cached) — signal done.
        mountFetchDone = true;
        endLoader();
      }
    },
    { immediate: true },
  );

  // If data was already fresh and isFetching never became true, lock out after
  // mount so interval polls are ignored.
  onMounted(() => {
    if (!awaitingFetch) mountFetchDone = true;
  });

  // Hide the bar immediately if a fetch errors out during the mount cycle.
  if (isError) {
    watch(isError, (hasError) => {
      if (hasError && awaitingFetch) {
        awaitingFetch = false;
        mountFetchDone = true;
        endLoader();
      }
    });
  }

  // User-triggered mutations always show the bar regardless of mount state.
  // Accepts a single ref or an array of refs.
  if (isPending) {
    const pendingRefs = Array.isArray(isPending) ? isPending : [isPending];
    const anyPending = computed(() => pendingRefs.some((r) => r.value));
    if (anyPending.value) startLoader();
    watch(anyPending, (pending) => {
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
