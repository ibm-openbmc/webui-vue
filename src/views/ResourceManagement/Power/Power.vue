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
import { computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import PowerCap from './PowerCap.vue';
import PowerPerformanceModes from './PowerPerformanceModes.vue';
import PowerIdleSaver from './PowerIdleSaver.vue';
import stores from '@/store';

const { hideLoader } = useLoadingBar();

const globalStore = stores.GlobalStore();
const powerControlStore = stores.PowerControlStore();

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  globalStore.getSystemInfo();
});

const safeMode = computed(() => {
  return globalStore.safeModeGetter;
});

const oemMode = computed(() => {
  return powerControlStore.oemModeGetter;
});

const nonIdlePowerSaverMode = computed(() => {
  return powerControlStore.idlePowerSaverDataGetter ? false : true;
});
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
