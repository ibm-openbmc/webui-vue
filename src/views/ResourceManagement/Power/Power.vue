<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.power')"
      :description="$t('pagePower.description')"
    />
    <BRow v-if="safeMode">
      <BCol md="9" xl="6">
        <alert variant="danger" class="mb-4">
          <p>
            {{ $t('pagePower.alert.message') }}
          </p>
          <p>
            {{ $t('pagePower.alert.message2') }}
            <BLink to="/logs/event-logs">
              {{ $t('pagePower.alert.message2Link') }}</BLink
            >
          </p>
          <p>
            {{ $t('pagePower.alert.message3') }}
            <BLink to="/operations/server-power-operations">
              {{ $t('pagePower.alert.message3Link') }}</BLink
            >
          </p>
        </alert>
      </BCol>
    </BRow>
    <power-cap :safe-mode="safeMode" />
    <power-performance-modes :safe-mode="safeMode" />
    <power-idle-saver :safe-mode="safeMode" />
  </BContainer>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import PowerCap from './PowerCap.vue';
import PowerPerformanceModes from './PowerPerformanceModes.vue';
import PowerIdleSaver from './PowerIdleSaver.vue';
import { GlobalStore } from '@/store';

const { hideLoader } = useLoadingBar();

const globalStore = GlobalStore();

const safeMode = computed(() => {
  return globalStore.safeModeGetter;
});

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  globalStore.getSystemInfo();
});
</script>
