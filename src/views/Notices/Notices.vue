<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.notices')" />
    <notices-text class="notice"></notices-text>
  </b-container>
</template>

<script>
import NoticesText from './NoticesText';
import PageTitle from '@/components/Global/PageTitle';
export default {
  name: 'Notices',
  components: { NoticesText, PageTitle },
  mounted() {
    this.$root.$emit('loading-bar-status', true);
  },
};
</script>

<style scoped>
.notice {
  overflow-x: hidden;
  white-space: break-spaces;
}
</style>
