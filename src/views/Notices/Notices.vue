<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.notices')" />
    <notices-text class="notice"></notices-text>
  </BContainer>
</template>

<script setup>
import { onMounted } from 'vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import NoticesText from '@/views/Notices/NoticesText.vue';
import PageTitle from '@/components/Global/PageTitle.vue';

const { hideLoader } = useLoadingBar();

onMounted(() => {
  hideLoader();
});
</script>

<style scoped>
.notice {
  overflow-x: hidden;
  white-space: break-spaces;
  text-align: justify;
}
</style>
