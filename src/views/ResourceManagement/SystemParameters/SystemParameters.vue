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
import { computed } from 'vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import LateralCastOut from './LateralCastOut.vue';
import FrequencyCap from './FrequencyCap.vue';
import AggressivePrefetch from './AggressivePrefetch.vue';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic.vue';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import stores from '@/store';
import { useSystemParameters } from '@/api/composables/useSystemParameters';

const global = stores.GlobalStore();
const { isFetching, isError } = useSystemParameters();

usePageLoadingBar(isFetching, isError);

const serverStatus = computed(() => {
  return global.serverStatus;
});
const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});
</script>
