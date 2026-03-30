<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.network')"
      :description="$t('pageNetwork.pageDescription')"
    />
    <!-- Global settings for all interfaces -->
    <network-global-settings />
    <!-- Interface tabs -->
    <page-section>
      <BRow>
        <BCol>
          <BCard no-body>
            <BTabs content-class="mt-3 p-4">
              <BTab
                v-for="(data, index) in network"
                :key="data.id"
                :title="data.id"
                @click="getTabIndex(index)"
              >
                <!-- Interface settings -->
                <network-interface-settings :tab-index="tabIndex" />
                <!-- IPV4 table -->
                <table-ipv-4 :tab-index="tabIndex" />
                <!-- IPV6 table -->
                <div v-if="isIpv6Valid">
                  <table-ipv-6 :tab-index="tabIndex" />
                </div>
                <!-- IPV6 Static Default gateways table -->
                <table-ipv6-static-default-gateway :tab-index="tabIndex" />
                <!-- Static DNS table -->
                <table-dns :tab-index="tabIndex" />
                <!-- LLDP -->
                <page-section :section-title="$t('pageNetwork.lldp')">
                  <BRow>
                    <BCol lg="2" md="6">
                      <dl>
                        <dd>
                          <BFormCheckbox
                            v-model="lldpState"
                            data-test-id="networkSettings-switch-useNtp"
                            switch
                            @update:model-value="changeLLDPState"
                          >
                            <span v-if="lldpState">
                              {{ $t('global.status.enabled') }}
                            </span>
                            <span v-else>{{
                              $t('global.status.disabled')
                            }}</span>
                          </BFormCheckbox>
                        </dd>
                      </dl>
                    </BCol>
                  </BRow>
                </page-section>
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
    <modal-ipv4
      :default-gateway="defaultGateway"
      :subnet="subnet"
      :ip-address="ipAddress"
      :edit-modal="ipAddress !== ''"
      @ok="saveIpv4Address"
    />
    <modal-ipv6
      :prefix-length="prefixLength"
      :ip-address="ipAddressIpv6"
      :edit-modal="ipAddressIpv6 !== ''"
      @ok="saveIpv6Address"
    />
    <modal-ipv6-static-default-gateway
      :ip-address="ipAddressIpv6StaticDefaultGateway"
      :edit-modal="ipAddressIpv6StaticDefaultGateway !== ''"
      @ok="saveIpv6StaticDefaultGatewayAddress"
    />
    <modal-dns @ok="saveDnsAddress" />
    <modal-hostname :hostname="currentHostname" @ok="saveHostname" />
  </BContainer>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageSection from '@/components/Global/PageSection.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import ModalHostname from './ModalHostname.vue';
import ModalIpv4 from './ModalIpv4.vue';
import ModalIpv6 from './ModalIpv6.vue';
import ModalIpv6StaticDefaultGateway from './ModalIpv6StaticDefaultGateway.vue';
import ModalDns from './ModalDns.vue';
import NetworkGlobalSettings from './NetworkGlobalSettings.vue';
import NetworkInterfaceSettings from './NetworkInterfaceSettings.vue';
import TableIpv4 from './TableIpv4.vue';
import TableDns from './TableDns.vue';
import TableIpv6 from './TableIpv6.vue';
import TableIpv6StaticDefaultGateway from './TableIpv6StaticDefaultGateway.vue';
import { useNetwork } from '@/api/composables/useNetwork';
import stores from '@/store';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();

const authenticationStore = stores.AuthenticationStore();

const {
  networkSettings,
  lldpEnabledState,
  isLoading,
  isFetching,
  refetchEthernet,
  refetchLLDP,
  setSelectedTabIndex,
  setSelectedTabId,
  updateIpv4Address,
  updateIpv6Address,
  updateIpv6StaticDefaultGatewayAddress,
  saveDnsAddress: saveDnsAddressAction,
  saveHostname: saveHostnameAction,
  saveLLDPState,
} = useNetwork();

const currentHostname = ref('');
const defaultGateway = ref('');
const ipAddress = ref('');
const ipAddressIpv6 = ref('');
const ipAddressIpv6StaticDefaultGateway = ref('');
const prefixLength = ref(0);
const subnet = ref('');
const tabIndex = ref(0);

onBeforeRouteLeave(() => {
  hideLoader();
});

// Loading bar automatically shows/hides based on fetch state
watch(
  () => isLoading.value || isFetching.value,
  (loading) => {
    if (loading) startLoader();
    else endLoader();
  },
  { immediate: true },
);

onBeforeMount(() => {
  refetchEthernet();
});

onMounted(() => {
  eventBus.on('edit-address', (item) => {
    subnet.value = item.SubnetMask;
    ipAddressIpv6.value = item.Address;
    ipAddress.value = item.Address;
    ipAddressIpv6StaticDefaultGateway.value = item.Address;
    prefixLength.value = item.PrefixLength;
  });
  setSelectedTabIndex(0);
  // Set the initial tab ID when network settings are available
  if (network.value.length > 0) {
    setSelectedTabId(network.value[0].id);
  }
  refetchLLDP();
});

const network = computed(() => {
  return networkSettings.value;
});

const isIpv6Valid = computed(() => {
  const ipv6 = network.value[tabIndex.value]?.ipv6;
  if (ipv6 === undefined || ipv6 === null || ipv6.length === 0) return false;
  else return true;
});

const lldpState = computed({
  get() {
    return lldpEnabledState.value?.[tabIndex.value]?.lldpEnabled;
  },
  set(newValue) {
    if (lldpEnabledState.value?.[tabIndex.value]) {
      lldpEnabledState.value[tabIndex.value].lldpEnabled = newValue;
    }
  },
});

watch(network, (newNetwork) => {
  getModalInfo();
  // Set the initial tab ID when network settings first become available
  if (newNetwork.length > 0 && tabIndex.value === 0) {
    setSelectedTabId(newNetwork[0].id);
  }
});

const getModalInfo = () => {
  defaultGateway.value = network.value[tabIndex.value]?.defaultGateway || '';
  currentHostname.value = network.value[tabIndex.value]?.hostname || '';
};

const getTabIndex = (selectedIndex) => {
  tabIndex.value = selectedIndex;
  setSelectedTabIndex(tabIndex.value);
  setSelectedTabId(network.value[tabIndex.value].id);
  getModalInfo();
};

const saveIpv4Address = (modalFormData) => {
  const modalData = [modalFormData];
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress.value, Subnet: '' };
    const editRow = modalData.concat(selectedRow);
    updateIpv4Address(editRow);
  } else {
    // Add new address
    updateIpv4Address(modalData);
  }
};

const saveIpv6Address = (modalFormData) => {
  const modalData = [modalFormData];
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress.value, PrefixLength: 0 };
    const editRow = modalData.concat(selectedRow);
    updateIpv6Address(editRow);
  } else {
    // Add new address
    updateIpv6Address(modalData);
  }
};

const saveIpv6StaticDefaultGatewayAddress = (modalFormData) => {
  const modalData = [modalFormData];
  if (ipAddressIpv6StaticDefaultGateway.value !== '') {
    //Edit selected row
    const selectedRow = {
      Address: ipAddressIpv6StaticDefaultGateway.value,
    };
    const editRow = modalData.concat(selectedRow);
    updateIpv6StaticDefaultGatewayAddress(editRow);
  } else {
    // Add new address
    updateIpv6StaticDefaultGatewayAddress(modalData);
  }
};

const saveDnsAddress = (modalFormData) => {
  saveDnsAddressAction(modalFormData);
};

const saveHostname = (modalFormData) => {
  saveHostnameAction(modalFormData).then(() => authenticationStore.logout());
};

const changeLLDPState = (state) => {
  saveLLDPState(state);
};
</script>
