<!-- TODO: Work Requird -->
<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.network')"
      :description="$t('pageNetwork.pageDescription')"
    />
    <label for="example-datepicker" class="mb-2">Choose a date</label>
    <!-- <b-form-datepicker id="example-datepicker" v-model="value" class="mb-2"></b-form-datepicker> -->
    <BFormInput :id="`type-${type}`" :type="type" button-only class="mb-4" />
    <BBadge v-for="(tag, index) in tags" :key="index" pill>
      {{ tag }}
      <!-- <BButtonCclose
          :disabled="false"
          :aria-hidden="true"
        /> -->
    </BBadge>
    <!-- Global settings for all interfaces -->
    <!-- <network-global-settings /> -->
    <!-- Interface tabs -->
    <page-section>
      <BRow>
        <BCol>
          <BCard no-body>
            <BTabs v-model="tabIndex" content-class="mt-3 p-4">
              <BTab v-for="data in network" :key="data.id" :title="data.id">
                tabs data
                <!-- Interface settings -->
                <!-- <network-interface-settings :tab-index="tabIndex" /> -->
                <!-- IPV4 table -->
                <!-- <table-ipv-4 v-if="data.ipv4" :tab-index="tabIndex" /> -->
                <!-- IPV6 table -->
                <!-- <table-ipv-6 v-if="data.ipv6" :tab-index="tabIndex" /> -->
                <!-- Static DNS table -->
                <!-- <table-dns :tab-index="tabIndex" /> -->
              </BTab>
              <template #empty>
                <div class="text-center text-muted">
                  {{ $t('global.table.emptyMessage') }}
                </div>
              </template>
            </BTabs>
          </BCard>
        </BCol>
      </BRow>
    </page-section>
    <!-- Modals -->
    <!-- <modal-ipv4
      v-if="ipAddress !== ''"
      :default-gateway="defaultGateway"
      :subnet="subnet"
      :ip-address="ipAddress"
      :edit-modal="true"
      @ok="saveIpv4Address"
    />
    <modal-ipv6
      v-if="ipAddressIpv6 !== ''"
      :prefix-length="prefixLength"
      :ip-address="ipAddressIpv6"
      :edit-modal="true"
      @ok="saveIpv6Address"
    />
    <modal-dns @ok="saveDnsAddress" />
    <modal-hostname :hostname="currentHostname" @ok="saveHostname" /> -->
  </BContainer>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
// import { useRoute } from 'vue-router';
// import { BVToastMixin, DataFormatterMixin, LoadingBarMixin } from '@/components/Mixins';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import NetworkStore from '../../store/modules/Settings/NetworkStore';

// const route = useRoute();

const tabIndex = ref(0);
const currentHostname = ref('');
const defaultGateway = ref('');
// const ipAddress = ref('');
// const ipAddressIpv6 = ref('');
// const prefixLength = ref(0);
// const subnet = ref('');
// const loading = ref(false);
const networkStore = NetworkStore();
const type = ref('date');
const tags = ref(['ok', 'critical', 'warning']);

const network = computed(() => networkStore.getGlobalNetworkSettings);
console.log('network....', network);
// const isIpv6Valid = computed(() => {
//   const ipv6 = network.value[tabIndex.value].ipv6;
//   return ipv6 && ipv6.length > 0;
// });

const getModalInfo = () => {
  defaultGateway.value = network.value[tabIndex.value].defaultGateway;
  currentHostname.value = network.value[tabIndex.value].hostname;
};

// const getTabIndex = (selectedIndex) => {
//   tabIndex.value = selectedIndex;
//   networkStore.setSelectedTabIndex(tabIndex.value);
//   networkStore.setSelectedTabId(network.value[tabIndex.value].id);
//   getModalInfo();
// };

// const saveIpv4Address = (modalFormData) => {
//   const modalData = [modalFormData];
//   loading.value = true;
//   if (ipAddress.value !== '') {
//     const selectedRow = { Address: ipAddress.value, Subnet: '' };
//     const editRow = modalData.concat(selectedRow);
//     store.dispatch('network/updateIpv4Address', editRow)
//       .then((message) => successToast(message))
//       .catch(({ message }) => errorToast(message))
//       .finally(() => loading.value = false);
//   } else {
//     store.dispatch('network/updateIpv4Address', modalData)
//       .then((message) => successToast(message))
//       .catch(({ message }) => errorToast(message))
//       .finally(() => loading.value = false);
//   }
// };

// const saveIpv6Address = (modalFormData) => {
//   const modalData = [modalFormData];
//   loading.value = true;
//   if (ipAddressIpv6.value !== '') {
//     const selectedRow = { Address: ipAddressIpv6.value, PrefixLength: 0 };
//     const editRow = modalData.concat(selectedRow);
//     store.dispatch('network/updateIpv6Address', editRow)
//       .then((message) => successToast(message))
//       .catch(({ message }) => errorToast(message))
//       .finally(() => loading.value = false);
//   } else {
//     store.dispatch('network/updateIpv6Address', modalData)
//       .then((message) => successToast(message))
//       .catch(({ message }) => errorToast(message))
//       .finally(() => loading.value = false);
//   }
// };

// const saveDnsAddress = (modalFormData) => {
//   loading.value = true;
//   store.dispatch('network/saveDnsAddress', modalFormData)
//     .then((message) => successToast(message))
//     .catch(({ message }) => errorToast(message))
//     .finally(() => loading.value = false);
// };

// const saveHostname = (modalFormData) => {
//   loading.value = true;
//   store.dispatch('network/saveHostname', modalFormData)
//     .then(() => store.dispatch('authentication/logout'))
//     .catch(({ message }) => errorToast(message))
//     .finally(() => loading.value = false);
// };

// const { successToast, errorToast } = BVToastMixin;
// const { startLoader, networkStore, hideLoader } = LoadingBarMixin;

watch(network, () => getModalInfo());

onMounted(() => {
  //   startLoader();
  networkStore.getEthernetData();
});

// beforeRouteLeave((to, from, next) => {
// //   hideLoader();
//   next();
// });

// const getTabIndexWrapper = (index) => () => getTabIndex(index);
</script>
<style lang="scss" scoped>
.btn-icon-only svg {
  margin-right: 0;
}
.btn-datepicker {
  //   position: absolute;
  right: 0;
  top: 0;
  z-index: $zindex-dropdown + 1;
}
</style>
