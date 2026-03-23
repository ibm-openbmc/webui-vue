<template>
  <overview-card
    :data="eventLogData"
    :disabled="eventLogData.length === 0"
    :export-button="true"
    :file-name="exportFileNameByDate()"
    :title="$t('pageOverview.eventLogs')"
    :to="`/logs/event-logs`"
  >
    <BRow class="mt-3">
      <BCol sm="6">
        <dl>
          <dt>{{ $t('pageOverview.criticalEvents') }}</dt>
          <dd class="h3">
            {{ dataFormatter(criticalEvents.length) }}
            <status-icon status="danger" />
          </dd>
        </dl>
      </BCol>
      <BCol sm="6">
        <dl>
          <dt>{{ $t('pageOverview.warningEvents') }}</dt>
          <dd class="h3">
            {{ dataFormatter(warningEvents.length) }}
            <status-icon status="warning" />
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
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { useOverviewEvents } from '@/api/composables/useOverview';

const { dataFormatter } = useDataFormatterGlobal();

// Use VueQuery composable
const { allEvents, criticalEvents, warningEvents } = useOverviewEvents();

const eventLogData = computed(() => allEvents.value);

const exportFileNameByDate = () => {
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  let fileName = 'all_event_logs_';
  return fileName + date;
};
</script>

<style lang="scss" scoped>
.status-icon {
  vertical-align: text-top;
}
</style>
