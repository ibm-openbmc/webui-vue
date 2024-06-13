<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.capacityOnDemand')" />
    <b-row v-if="serverStatus === 'off'">
      <b-col md="8" xl="6">
        <alert variant="info" class="mb-5">
          <p class="mb-0 font-weight-bold">
            {{ $t('pageCapacityOnDemand.alert.title') }}
          </p>
          <p>
            {{ $t('pageCapacityOnDemand.alert.description') }}
          </p>
        </alert>
      </b-col>
    </b-row>

    <!-- Quick links -->
    <page-section :section-title="$t('pageCapacityOnDemand.quickLinks')">
      <div v-for="item in quickLinks" :key="item.id">
        <b-link
          :href="item.href"
          :data-ref="item.dataRef"
          @click.prevent="scrollToOffset"
        >
          <icon-jump-link /> {{ item.linkText }}
        </b-link>
      </div>
    </page-section>

    <!-- Order activation section -->
    <capacity-on-demand-acvitation ref="activation" />

    <!-- Order info section -->
    <capacity-on-demand-order-info ref="orderInfo" />

    <!-- VET capabilities section -->
    <capacity-on-demand-table ref="vetCapabilities" />
  </b-container>
</template>

<script>
import JumpLink16 from '@carbon/icons-vue/es/jump-link/16';

import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import Alert from '@/components/Global/Alert';

import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import JumpLinkMixin from '@/components/Mixins/JumpLinkMixin';

import CapacityOnDemandOrderInfo from './CapacityOnDemandOrderInfo.vue';
import CapacityOnDemandAcvitation from './CapacityOnDemandActivation.vue';
import CapacityOnDemandTable from './CapacityOnDemandTable.vue';

export default {
  name: 'CapacityOnDemand',
  components: {
    PageTitle,
    Alert,
    CapacityOnDemandOrderInfo,
    CapacityOnDemandAcvitation,
    CapacityOnDemandTable,
    PageSection,
    IconJumpLink: JumpLink16,
  },
  mixins: [LoadingBarMixin, JumpLinkMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      loading,
      quickLinks: [
        {
          id: 'activation',
          dataRef: 'activation',
          href: '#activation',
          linkText: this.$t('pageCapacityOnDemand.activation.sectionTitle'),
        },
        {
          id: 'orderInfo',
          dataRef: 'orderInfo',
          href: '#orderInfo',
          linkText: this.$t('pageCapacityOnDemand.orderInfo.title'),
        },
        {
          id: 'vetCapabilities',
          dataRef: 'vetCapabilities',
          href: '#vetCapabilities',
          linkText: this.$t('pageCapacityOnDemand.vetCapabilities'),
        },
      ],
    };
  },
  computed: {
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('licenses/getLicenses'),
      this.$store.dispatch('system/getSystem'),
    ]).finally(() => this.endLoader());
  },
};
</script>
