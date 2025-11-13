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
import PageTitle from '@/components/Global/PageTitle.vue';
import LateralCastOut from './LateralCastOut.vue';
import FrequencyCap from './FrequencyCap.vue';
import AggressivePrefetch from './AggressivePrefetch.vue';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import { onBeforeMount, computed } from 'vue';

const { startLoader, endLoader } = useLoadingBar();

const systemParametersStore = stores.SystemParametersStore();
const global = stores.GlobalStore();

onBeforeMount(() => {
  startLoader();
  systemParametersStore.getBiosAttributesRegistry().finally(() => endLoader());
});

const serverStatus = computed(() => {
  return global.serverStatus;
});
const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});
</script>
