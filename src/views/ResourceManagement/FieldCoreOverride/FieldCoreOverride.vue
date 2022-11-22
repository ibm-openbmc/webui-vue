<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.fieldCoreOverride')"
      :description="$t('pageFieldCoreOverride.pageDescription')"
    />
    <b-row>
      <b-col md="8" xl="6">
        <alert variant="info" class="mb-5">
          <p class="mb-0 font-weight-bold">
            {{ $t('pageFieldCoreOverride.alert.title') }}
          </p>
          <p>
            {{ $t('pageFieldCoreOverride.alert.description') }}
          </p>
        </alert>
      </b-col>
    </b-row>

    <current-configuration />
    <change-configuration />
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import Alert from '@/components/Global/Alert';

import FieldCoreOverrideInfo from './FieldCoreOverrideInfo.vue';
import FieldCoreOverrideConfiguration from './FieldCoreOverrideConfiguration.vue';

export default {
  name: 'FieldCoreOverride',
  components: {
    PageTitle,
    Alert,
    CurrentConfiguration: FieldCoreOverrideInfo,
    ChangeConfiguration: FieldCoreOverrideConfiguration,
  },
  mixins: [LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      loading,
    };
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('licenses/getLicenses'),
      this.$store.dispatch('system/getSystem'),
      this.$store.dispatch('fieldCoreOverride/getBiosAttributes'),
    ]).finally(() => this.endLoader());
  },
};
</script>
