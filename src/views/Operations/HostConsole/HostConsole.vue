<template>
  <b-container fluid="xl">
    <page-title
      class="mb-4"
      :title="$t('appPageTitle.hostConsole')"
      :description="$t('pageHostConsole.subTitle')"
    />

    <page-section class="mb-0">
      <host-console-console :is-full-window="false" />
    </page-section>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import HostConsoleConsole from './HostConsoleConsole';

export default {
  name: 'HostConsole',
  components: {
    PageSection,
    PageTitle,
    HostConsoleConsole,
  },
  mounted() {
    this.$root.$emit('loading-bar-status', true);
  },
};
</script>
