<template>
  <BContainer fluid="xl">
    <BRow>
      <BCol md="8" xl="6">
        <page-title :title="$t('appPageTitle.systemParameters')" />
      </BCol>
    </BRow>
    <lateral-cast-out :is-server-off="isServerOff" />
    <frequency-cap :is-server-off="isServerOff" />
    <aggressive-prefetch :is-server-off="isServerOff" />
    <runtime-processor-diagnostic :is-server-off="isServerOff" />
  </BContainer>
</template>

<script setup>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import LateralCastOut from './LateralCastOut.vue';
import FrequencyCap from './FrequencyCap.vue';
import AggressivePrefetch from './AggressivePrefetch.vue';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import { useSystemParameters } from '@/api/composables/useSystemParameters';

const global = stores.GlobalStore();
const { isFetching, isError } = useSystemParameters();
const { startLoader, endLoader, hideLoader } = useLoadingBar();

// The BIOS query is shared with child components so it may already be
// in-flight (or even done) before onMounted fires. Watch isFetching from
// script-setup time — before any lifecycle hook — so we never miss the
// true→false transition of the very first fetch on this navigation.
let mountFetchDone = false;
let awaitingFetch = false;

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
      awaitingFetch = false;
      mountFetchDone = true;
      endLoader();
    }
  },
  { immediate: true },
);

// If data was already fresh and isFetching never became true, lock out
// after mount so interval polls are ignored.
onMounted(() => {
  if (!awaitingFetch) mountFetchDone = true;
});

onBeforeUnmount(() => {
  hideLoader();
});

const serverStatus = computed(() => {
  return global.serverStatus;
});
const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});
</script>
