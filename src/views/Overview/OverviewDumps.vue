<template>
  <overview-card
    :data="dumps"
    :file-name="exportFileNameByDate()"
    :title="$t('pageOverview.dumps')"
    :to="`/logs/dumps`"
  >
    <BRow class="mt-3">
      <BCol sm="6">
        <dl>
          <dt>{{ $t('pageOverview.total') }}</dt>
          <dd class="h3">{{ dataFormatter(dumps.length) }}</dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { DumpsStore } from '@/store';
import eventBus from '@/eventBus';

const { dataFormatter } = useDataFormatterGlobal();

const dumpsStore = DumpsStore();

onBeforeMount(() => {
  dumpsStore.getAllDumps().finally(() => {
    eventBus.emit('overview-dumps-complete');
  });
});

const dumps = computed(() => {
  return dumpsStore.allDumpsGetter;
});

const exportFileNameByDate = () => {
  // Create export file name based on date
  let date = new Date();
  date =
    date.toISOString().slice(0, 10) +
    '_' +
    date.toString().split(':').join('-').split(' ')[4];
  let fileName = 'all_dumps_';
  return fileName + date;
};
</script>
