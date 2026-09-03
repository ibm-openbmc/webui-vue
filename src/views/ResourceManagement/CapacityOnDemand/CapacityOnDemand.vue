<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.capacityOnDemand')" />
    <BRow v-if="serverStatus === 'off'">
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-5">
          <h5 class="mb-0 fw-bold">
            {{ $t('pageCapacityOnDemand.alert.title') }}
          </h5>
          <p>
            {{ $t('pageCapacityOnDemand.alert.description') }}
          </p>
        </alert>
      </BCol>
    </BRow>

    <!-- Quick links -->
    <page-section :section-title="$t('pageCapacityOnDemand.quickLinks')">
      <div v-for="item in quickLinks" :key="item.id">
        <BLink
          :href="item.href"
          :data-ref="item.dataRef"
          @click.prevent="scrollToOffset(refs, $event)"
        >
          <icon-jump-link /> {{ item.linkText }}
        </BLink>
      </div>
    </page-section>

    <!-- Order activation section -->
    <capacity-on-demand-acvitation ref="activation" />

    <!-- Order info section -->
    <capacity-on-demand-order-info ref="orderInfo" />

    <!-- VET capabilities section -->
    <capacity-on-demand-table
      ref="vetCapabilitiesRef"
      :is-busy="isBusy"
      :vet-capabilities="vetCapabilities"
    />
  </BContainer>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import i18n from '@/i18n';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import Alert from '@/components/Global/Alert.vue';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useJumpLinkComposable from '@/components/Composables/useJumpLinkComposable';
import { default as IconJumpLink } from '@carbon/icons-vue/es/jump-link/16';
import CapacityOnDemandOrderInfo from './CapacityOnDemandOrderInfo.vue';
import CapacityOnDemandAcvitation from './CapacityOnDemandActivation.vue';
import CapacityOnDemandTable from './CapacityOnDemandTable.vue';
import stores from '@/store';
import { useCapacityOnDemand } from '@/api/composables/useCapacityOnDemand';

const { scrollToOffset } = useJumpLinkComposable();

const global = stores.GlobalStore();
const systemStore = stores.SystemStore();

// Use the new VueQuery composable
const { isFetching, isLoading, isError, vetCapabilities, refetch } =
  useCapacityOnDemand();

// Expose refetch for parent components
defineExpose({
  refetch,
});

const activation = ref(null);
const orderInfo = ref(null);
const vetCapabilitiesRef = ref(null);
const refs = {
  activation,
  orderInfo,
  vetCapabilities: vetCapabilitiesRef,
};
const quickLinks = reactive([
  {
    id: 'activation',
    dataRef: 'activation',
    href: '#activation',
    linkText: i18n.global.t('pageCapacityOnDemand.activation.sectionTitle'),
  },
  {
    id: 'orderInfo',
    dataRef: 'orderInfo',
    href: '#orderInfo',
    linkText: i18n.global.t('pageCapacityOnDemand.orderInfo.title'),
  },
  {
    id: 'vetCapabilities',
    dataRef: 'vetCapabilities',
    href: '#vetCapabilities',
    linkText: i18n.global.t('pageCapacityOnDemand.vetCapabilities'),
  },
]);

// 1120-vue3 waited for getLicenses() + getSystem(). Track the Vuex getSystem()
// call as an extra loading flag and combine with licenses isFetching.
const isExtraLoading = ref(true);
const isPageFetching = computed(() => isFetching.value || isExtraLoading.value);

// CapacityOnDemand has no children sharing its query so usePageLoadingBar is safe
usePageLoadingBar(isPageFetching, isError);

// Also fetch system data (not part of licenses composable)
systemStore.getSystem().finally(() => {
  isExtraLoading.value = false;
});

const serverStatus = computed(() => {
  return global.serverStatusGetter;
});

const isBusy = computed(() => isLoading.value);
</script>
<style lang="scss" scoped>
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
