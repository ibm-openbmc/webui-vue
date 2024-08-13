<template>
  <b-card bg-variant="light" border-variant="light">
    <b-row class="d-flex justify-content-between align-items-center">
      <b-col sm="6" lg="9" class="mb-2 mt-2">
        <dl>
          <dt>{{ $t('pageOverview.bmcTime') }}</dt>
          <dd v-if="bmcTime" data-test-id="overviewQuickLinks-text-bmcTime">
            {{ bmcTime | formatDate }} {{ bmcTime | formatTime }}
          </dd>
          <dd v-else>--</dd>
        </dl>
      </b-col>
      <b-col v-if="canUseHostConsole" sm="6" lg="3" class="mb-2 mt-2">
        <b-button
          to="/operations/host-console"
          variant="secondary"
          data-test-id="overviewQuickLinks-button-solConsole"
          class="d-flex justify-content-between align-items-center"
        >
          {{ $t('pageOverview.hostConsole') }}
          <icon-arrow-right />
        </b-button>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
import ArrowRight16 from '@carbon/icons-vue/es/arrow--right/16';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  name: 'QuickLinks',
  components: {
    IconArrowRight: ArrowRight16,
  },
  mixins: [BVToastMixin],
  computed: {
    bmcTime() {
      return this.$store.getters['global/bmcTime'];
    },
    currentUserRole() {
      return this.$store?.getters['global/currentUser']?.RoleId;
    },
    canUseHostConsole() {
      return (
        this.currentUserRole === 'Administrator' ||
        this.currentUserRole === 'OemIBMServiceAgent'
      );
    },
  },
  created() {
    this.$store.dispatch('global/getBmcTime');
    this.$store.dispatch('global/getBmcTime');
    this.$store.dispatch('global/getBmcTime');
    Promise.all([this.$store.dispatch('global/getBmcTime')]).finally(() => {
      this.$root.$emit('overview-quicklinks-complete');
    });
  },
};
</script>

<style lang="scss" scoped>
dd,
dl {
  margin: 0;
}
</style>
