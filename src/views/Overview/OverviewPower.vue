<template>
  <overview-card
    :title="$t('pageOverview.powerInformation')"
    :to="`/resource-management/power`"
  >
    <b-row class="mt-3">
      <b-col sm="6">
        <dl>
          <dt>{{ $t('pageOverview.powerConsumption') }}</dt>
          <dd v-if="!powerConsumptionValue">
            {{ $t('global.status.notAvailable') }}
          </dd>
          <dd v-else>{{ powerConsumptionValue }} W</dd>
          <dt>{{ $t('pageOverview.powerCap') }}</dt>
          <dd v-if="!powerCapValue">
            {{ $t('global.status.disabled') }}
          </dd>
          <dd v-else>{{ powerCapValue }} W</dd>
        </dl>
      </b-col>
      <b-col sm="6">
        <dl>
          <dt>{{ $t('pagePower.idlePower') }}</dt>
          <dd v-if="idlePowerSaverData">
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
    </b-row>
  </overview-card>
</template>

<script>
import OverviewCard from './OverviewCard';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import StatusIcon from '@/components/Global/StatusIcon';
import { mapGetters } from 'vuex';

export default {
  name: 'Power',
  components: {
    OverviewCard,
    StatusIcon,
  },
  mixins: [DataFormatterMixin],
  computed: {
    ...mapGetters({
      idlePowerSaverData: 'powerControl/idlePowerSaverData',
      powerCapValue: 'powerControl/powerCap',
      powerConsumptionValue: 'powerControl/powerConsumption',
      powerPerformanceMode: 'powerControl/powerPerformanceMode',
      safeMode: 'global/safeMode',
    }),
    isIdlePowerSaverDataEnabled() {
      return this.idlePowerSaverData?.Enabled;
    },
  },
  created() {
    Promise.all([
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
      this.$store.dispatch('powerControl/getPowerControl'),
      this.$store.dispatch('powerControl/getPowerPerformanceMode'),
      this.$store.dispatch('powerControl/getIdlePowerSaverData'),
    ]).finally(() => {
      this.$root.$emit('overview-power-complete');
    });
  },
};
</script>
