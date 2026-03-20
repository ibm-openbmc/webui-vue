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
import { watch, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import PageTitle from '@/components/Global/PageTitle.vue';
import LateralCastOut from './LateralCastOut.vue';
import FrequencyCap from './FrequencyCap.vue';
import AggressivePrefetch from './AggressivePrefetch.vue';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import { useSystemParameters } from '@/api/composables/useSystemParameters';

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const global = stores.GlobalStore();
const { isFetching, isError } = useSystemParameters();

// Manage loading bar for query fetching state
watch(
  isFetching,
  (fetching) => {
    if (fetching) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

// Stop the loading bar when the fetch fails
watch(isError, (hasError) => {
  if (hasError) {
    endLoader();
  }
});

onBeforeRouteLeave(() => {
  hideLoader();
});

const serverStatus = computed(() => {
  return global.serverStatus;
});
const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});
</script>
