<template>
  <BContainer fluid="xl">
    <page-title 
      :title="$t('appPageTitle.pageNotFound')"
      :description="$t('pagePageNotFound.description')"
    />
  </BContainer>
</template>
<script setup>
import PageTitle from '@/components/Global/PageTitle.vue';
</script>
