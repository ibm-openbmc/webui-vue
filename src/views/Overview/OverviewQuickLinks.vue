<!-- TODO: Work Requird -->
<template>
  <BCard bg-variant="light" border-variant="light">
    <BRow class="d-flex justify-content-between align-items-center">
      <BCol sm="6" lg="9" class="mb-2 mt-2">
        <dl>
          <dt>{{ $t('pageOverview.bmcTime') }}</dt>
          <dd v-if="bmcTime" data-test-id="overviewQuickLinks-text-bmcTime">
            {{ $filters.formatDate(bmcTime) }} {{ $filters.formatTime(bmcTime) }}
          </dd>
          <dd v-else>--</dd>
        </dl>
      </BCol>
      <BCol v-if="canUseHostConsole" sm="6" lg="3" class="mb-2 mt-2">
        <BButton
          to="/operations/host-console"
          variant="secondary"
          data-test-id="overviewQuickLinks-button-hostConsole"
          class="d-flex justify-content-between align-items-center"
        >
          {{ $t('pageOverview.hostConsole') }}
          <icon-arrow-right />
        </BButton>
      </BCol>
    </BRow>
  </BCard>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import stores from '@/store';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import eventBus from '@/eventBus';

const { dataFormatter } = useDataFormatterGlobal();

const global = stores.GlobalStore();

onBeforeMount(() => {
    Promise.all([global.getBmcTime(), global.getCurrentUser()]).finally(() => {
      eventBus.emit('overview-quicklinks-complete');
    });
});

const bmcTime = computed(() => {
  return global.bmcTime;
});
const currentUserRole = computed(() => {
      return global.currentUser?.RoleId;
});
const canUseHostConsole = computed(() => {
      return (
        currentUserRole.value === 'Administrator' ||
        currentUserRole.value === 'OemIBMServiceAgent'
      );
});
</script>
<style lang="scss" scoped>
dd,
dl {
  margin: 0;
}
</style>
