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
            <router-link to="/logs/event-logs">
              {{ $t('pagePower.alert.message2Link') }}</router-link
            >
          </p>
          <p>
            {{ $t('pagePower.alert.message3') }}
            <router-link to="/operations/server-power-operations">
              {{ $t('pagePower.alert.message3Link') }}</router-link
            >
          </p>
        </alert>
      </BCol>
    </BRow>
    <power-cap :safe-mode="safeMode" />
    <power-performance-modes :safe-mode="safeMode" />
    <power-idle-saver
      :oem-mode="oemMode"
      :safe-mode="safeMode"
      :non-idle-power-saver-mode="nonIdlePowerSaverMode"
    />
  </BContainer>
</template>

<script setup>
import { computed, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import PowerCap from './PowerCap.vue';
import PowerPerformanceModes from './PowerPerformanceModes.vue';
import PowerIdleSaver from './PowerIdleSaver.vue';
import stores from '@/store';
import {
  usePowerControl,
  usePowerPerformanceMode,
  useIdlePowerSaver,
} from '@/api/composables/usePowerControl';

const { hideLoader, startLoader, endLoader } = useLoadingBar();

const globalStore = stores.GlobalStore();

// Use VueQuery composables for power data
const { isPowerControlFetching, isPowerControlError } = usePowerControl();

const { oemMode, isPowerPerformanceFetching, isPowerPerformanceError } =
  usePowerPerformanceMode();

const { idlePowerSaverData, isIdlePowerSaverFetching, isIdlePowerSaverError } =
  useIdlePowerSaver();

onBeforeRouteLeave(() => {
  hideLoader();
});

const safeMode = computed(() => {
  return globalStore.safeModeGetter;
});

const nonIdlePowerSaverMode = computed(() => {
  return idlePowerSaverData.value ? false : true;
});

// Manage loading bar for power control fetching
watch(isPowerControlFetching, (fetching) => {
  if (fetching) {
    startLoader();
  } else {
    endLoader();
  }
});

// Manage loading bar for power performance fetching
watch(isPowerPerformanceFetching, (fetching) => {
  if (fetching) {
    startLoader();
  } else {
    endLoader();
  }
});

// Manage loading bar for idle power saver fetching
watch(isIdlePowerSaverFetching, (fetching) => {
  if (fetching) {
    startLoader();
  } else {
    endLoader();
  }
});

// Stop the loading bar when any fetch fails
watch(
  [isPowerControlError, isPowerPerformanceError, isIdlePowerSaverError],
  ([controlError, performanceError, idleError]) => {
    if (controlError || performanceError || idleError) {
      endLoader();
    }
  },
);
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
