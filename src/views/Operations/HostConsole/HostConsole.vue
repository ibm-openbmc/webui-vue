<template>
  <BContainer fluid="xl">
    <page-title
      class="mb-4"
      :title="$t('appPageTitle.hostConsole')"
      :description="$t('pageHostConsole.subTitle')"
    />

    <page-section class="mb-0">
      <host-console-console :is-full-window="false" />
    </page-section>
  </BContainer>
</template>

<script setup>
import { onMounted } from 'vue';
import eventBus from '@/eventBus';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import HostConsoleConsole from './HostConsoleConsole.vue';

onMounted(() => {
  eventBus.emit('loading-bar-status', true);
});
</script>
