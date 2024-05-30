<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.power')" :description="$t('pagePower.description')" />
    <b-row v-if="safeMode">
      <b-col md="9" xl="6">
        <alert variant="danger" class="mb-4">
          <p>
            {{ $t('pagePower.alert.message') }}
          </p>
          <p>
            {{ $t('pagePower.alert.message2') }}
            <b-link to="/logs/event-logs"> {{ $t('pagePower.alert.message2Link') }}</b-link>
          </p>
          <p>
            {{ $t('pagePower.alert.message3') }}
            <b-link to="/operations/server-power-operations">
              {{ $t('pagePower.alert.message3Link') }}</b-link
            >
          </p>
        </alert>
      </b-col>
    </b-row>
    <power-cap :safe-mode="safeMode" />
    <power-performance-modes :safe-mode="safeMode" />
    <power-idle-saver :safe-mode="safeMode" />
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import PowerCap from './PowerCap';
import PowerPerformanceModes from './PowerPerformanceModes';
import PowerIdleSaver from './PowerIdleSaver';
import Alert from '@/components/Global/Alert';

export default {
  name: 'Power',
  components: {
    PageTitle,
    PowerCap,
    PowerPerformanceModes,
    PowerIdleSaver,
    Alert,
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
  computed: {
    safeMode() {
      return this.$store.getters['global/safeMode'];
    },
  },
  created() {
    this.$store.dispatch('global/getSystemInfo');
  },
};
</script>
