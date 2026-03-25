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
const { isPowerControlFetching, isPowerControlMutating, isPowerControlError } =
  usePowerControl();

const {
  oemMode,
  isPowerPerformanceFetching,
  isPowerPerformanceMutating,
  isPowerPerformanceError,
} = usePowerPerformanceMode();

const {
  idlePowerSaverData,
  isIdlePowerSaverFetching,
  isIdlePowerSaverMutating,
  isIdlePowerSaverError,
} = useIdlePowerSaver();

onBeforeRouteLeave(() => {
  hideLoader();
});

const safeMode = computed(() => {
  return globalStore.safeModeGetter;
});

const nonIdlePowerSaverMode = computed(() => {
  return idlePowerSaverData.value ? false : true;
});

// Manage loading bar for fetching state (initial data load)
watch(
  [
    isPowerControlFetching,
    isPowerPerformanceFetching,
    isIdlePowerSaverFetching,
  ],
  ([controlFetching, performanceFetching, idleFetching]) => {
    if (controlFetching || performanceFetching || idleFetching) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

// Stop the loading bar when any fetch fails
watch(
  [isPowerControlError, isPowerPerformanceError, isIdlePowerSaverError],
  ([controlError, performanceError, idleError]) => {
    if (controlError || performanceError || idleError) {
      endLoader();
    }
  },
);

// Manage loading bar for mutation/update state (separate from fetching)
watch(
  [
    isPowerControlMutating,
    isPowerPerformanceMutating,
    isIdlePowerSaverMutating,
  ],
  ([controlMutating, performanceMutating, idleMutating]) => {
    if (controlMutating || performanceMutating || idleMutating) {
      startLoader();
    } else {
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
