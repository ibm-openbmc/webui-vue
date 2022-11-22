<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.pageNotFound')"
      :description="$t('pagePageNotFound.description')"
    />
  </b-container>
</template>
<script>
import PageTitle from '@/components/Global/PageTitle';
export default {
  name: 'PageNotFound',
  components: { PageTitle },
};
</script>
