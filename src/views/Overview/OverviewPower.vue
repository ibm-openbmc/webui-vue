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
      <BCol sm="6">
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
          <dd v-else-if="powerPerformanceMode === 'MaximumPerformance'">
            {{ $t('pageOverview.powerPerformanceModes.maximumPerformance') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'EfficiencyFavorPower'">
            {{ $t('pagePower.selectMode.energyEfficient.primary') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'PowerSaving'">
            {{ $t('pagePower.selectMode.maximumEnergySaver.primary') }}
          </dd>
          <dd v-else-if="powerPerformanceMode === 'OEM'">
            {{ $t('pagePower.oemMode.primary') }}
          </dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed } from 'vue';
import OverviewCard from './OverviewCard.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import stores from '@/store';
import {
  usePowerControl,
  usePowerPerformanceMode,
  useIdlePowerSaver,
} from '@/api/composables/usePowerControl';

const global = stores.GlobalStore();

// Use VueQuery composables for power data
const { powerConsumption, isPowerCapEnabled, powerCap } = usePowerControl();
const { powerPerformanceMode } = usePowerPerformanceMode();
const { idlePowerSaverData } = useIdlePowerSaver();

const powerConsumptionValue = computed(() => powerConsumption.value);
const powerCapValue = computed(() => powerCap.value);

const safeMode = computed(() => {
  return global.safeMode;
});
</script>
