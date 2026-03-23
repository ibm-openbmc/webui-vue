<template>
  <BCard bg-variant="light" border-variant="light">
    <BRow class="d-flex justify-content-between align-items-center">
      <BCol sm="6" lg="9" class="mb-2 mt-2">
        <dl>
          <dt>{{ $t('pageOverview.bmcTime') }}</dt>
          <dd v-if="bmcTime" data-test-id="overviewQuickLinks-text-bmcTime">
            {{ $filters.formatDate(bmcTime) }}
            {{ $filters.formatTime(bmcTime) }}
          </dd>
          <dd v-else>--</dd>
        </dl>
      </BCol>
      <BCol v-if="canUseHostConsole" sm="6" lg="3" class="mb-2 mt-2">
        <router-link
          v-slot="{ href, navigate }"
          to="/operations/host-console"
          custom
        >
          <BButton
            :href="href"
            variant="secondary"
            data-test-id="overviewQuickLinks-button-hostConsole"
            class="d-flex justify-content-between align-items-center"
            @click="navigate"
          >
            {{ $t('pageOverview.hostConsole') }}
            <icon-arrow-right />
          </BButton>
        </router-link>
      </BCol>
    </BRow>
  </BCard>
</template>

<script setup>
import { useOverviewQuickLinks } from '@/api/composables/useOverview';
import IconArrowRight from '@carbon/icons-vue/es/arrow--right/16';

// Use VueQuery composable
const { bmcTime, canUseHostConsole } = useOverviewQuickLinks();
</script>

<style lang="scss" scoped>
dd,
dl {
  margin: 0;
}
</style>
