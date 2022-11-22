<template>
  <b-container fluid="xl">
    <b-row>
      <b-col md="8" xl="6">
        <page-title :title="$t('appPageTitle.systemParameters')" />
      </b-col>
    </b-row>
    <b-row>
      <b-col md="8" xl="6">
        <alert v-if="!isServerOff" variant="info" class="mb-4">
          <div class="font-weight-bold">
            {{ $t('pageSystemParameters.alert.title') }}
          </div>
          <div>
            {{ $t('pageSystemParameters.alert.message') }}
          </div>
        </alert>
      </b-col>
    </b-row>
    <lateral-cast-out :is-server-off="isServerOff" />
    <frequency-cap :is-server-off="isServerOff" />
    <aggressive-prefetch :is-server-off="isServerOff" />
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import Alert from '@/components/Global/Alert';
import LateralCastOut from './LateralCastOut';
import FrequencyCap from './FrequencyCap';
import AggressivePrefetch from './AggressivePrefetch';

export default {
  name: 'SystemParameters',
  components: {
    PageTitle,
    Alert,
    LateralCastOut,
    FrequencyCap,
    AggressivePrefetch,
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
    Promise.all([
      this.$store.dispatch('systemParameters/getLateralCastOutMode'),
      this.$store.dispatch('systemParameters/getAggressivePrefetch'),
    ]).finally(() => this.endLoader());
  },
};
</script>
