<template>
  <b-container fluid="xl">
    <b-row>
      <b-col md="8" xl="6">
        <page-title :title="$t('appPageTitle.systemParameters')" />
      </b-col>
    </b-row>
    <lateral-cast-out :is-server-off="isServerOff" />
    <frequency-cap :is-server-off="isServerOff" />
    <aggressive-prefetch :is-server-off="isServerOff" />
    <runtime-processor-diagnostic :is-server-off="isServerOff" />
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import LateralCastOut from './LateralCastOut';
import FrequencyCap from './FrequencyCap';
import AggressivePrefetch from './AggressivePrefetch';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic';

export default {
  name: 'SystemParameters',
  components: {
    PageTitle,
    LateralCastOut,
    FrequencyCap,
    AggressivePrefetch,
    RuntimeProcessorDiagnostic,
  },
  mixins: [LoadingBarMixin, BVToastMixin],
  computed: {
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
    isServerOff() {
      return this.serverStatus === 'off' ? true : false;
    },
  },
  created() {
    this.startLoader();
    this.$store
      .dispatch('systemParameters/getBiosAttributesRegistry')
      .finally(() => this.endLoader());
  },
};
</script>
