<template>
  <overview-card
    :title="$t('pageOverview.powerInformation')"
    :to="`/resource-management/power`"
  >
    <BRow class="mt-3">
      <BCol sm="6">
        <dl>
          <dt>{{ $t('pageOverview.powerConsumption') }}</dt>
          <dd v-if="!powerConsumptionValue">
            {{ $t('global.status.notAvailable') }}
          </dd>
          <dd v-else>{{ powerConsumptionValue }} W</dd>
          <dt>{{ $t('pageOverview.powerCap') }}</dt>
          <dd v-if="!isPowerCapEnabled || !powerCapValue">
            {{ $t('global.status.disabled') }}
          </dd>
          <dd v-else>{{ powerCapValue }} W</dd>
        </dl>
      </BCol>
      <b-col sm="6">
        <dl>
          <dt>{{ $t('pagePower.idlePower') }}</dt>
          <dd v-if="idlePowerSaverData && idlePowerSaverData.Enabled">
            {{ $t('global.status.enabled') }}
          </dd>
          <dd v-else>{{ $t('global.status.disabled') }}</dd>
          <dt>{{ $t('pageOverview.powerMode') }}</dt>
          <dd v-if="safeMode">
            <status-icon status="danger" />
            {{ $t('pageOverview.safeMode') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'Static'">
            {{ $t('pageOverview.powerPerformanceModes.static') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'MaximumPerformance'">
            {{ $t('pageOverview.powerPerformanceModes.maximumPerformance') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'PowerSaving'">
            {{ $t('pageOverview.powerPerformanceModes.powerSaving') }}
          </dd>
        </dl>
      </b-col>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import stores from '@/store';
import eventBus from '@/eventBus';

const powerControlStore = stores.PowerControlStore();
const global = stores.GlobalStore();

onBeforeMount(() => {
  Promise.all([
    powerControlStore.getPowerControl(),
    powerControlStore.getPowerPerformanceMode(),
    powerControlStore.getIdlePowerSaverData(),
  ]).finally(() => {
    eventBus.emit('overview-power-complete');
  });
});

const idlePowerSaverData = computed(() => {
  return powerControlStore.idlePowerSaverData;
});
const isPowerCapEnabled = computed(() => {
  return powerControlStore.isPowerCapEnabled;
});
const powerCapValue = computed(() => {
  return powerControlStore.powerCap;
});
const powerConsumptionValue = computed(() => {
  return powerControlStore.powerConsumption;
});
const powerPerformanceMode = computed(() => {
  return powerControlStore.powerPerformanceMode;
});
const safeMode = computed(() => {
  return global.safeMode;
});
</script>
