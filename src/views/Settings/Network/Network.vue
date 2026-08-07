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
                v-for="(data, index) in networkSettings"
                :key="data.id"
                :title="data.id"
                @click="getTabIndex(index)"
              >
                <!-- Interface settings -->
                <network-interface-settings :tab-index="tabIndex" />
                <!-- IPV4 table -->
                <table-ipv-4 :tab-index="tabIndex" />
                <!-- IPV6 table -->
                <div v-if="isIpv6Valid(index)">
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
import { ref, computed, watch, onMounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import eventBus from '@/eventBus';
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
import { useRouter } from 'vue-router';

const router = useRouter();
const { startLoader, endLoader, hideLoader } = useLoadingBar();
const queryClient = useQueryClient();
const authenticationStore = stores.AuthenticationStore();

const {
  networkSettings,
  lldpEnabledState,
  isLoading,
  setSelectedTabIndex,
  setSelectedTabId,
  refetchEthernet,
  refetchLldp,
  saveLLDPState,
  updateIpv4Address,
  updateIpv6Address,
  updateIpv6StaticDefaultGatewayAddress,
  saveDnsAddress: saveDnsAddressApi,
  saveHostname: saveHostnameApi,
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

// Manage loading bar based on query state
watch(
  isLoading,
  (loading) => {
    if (loading) {
      startLoader();
    } else {
      endLoader();
    }
  },
  { immediate: true },
);

onMounted(() => {
  refetchEthernet();
  refetchLldp();

  eventBus.on('edit-address', (item) => {
    subnet.value = item.SubnetMask ?? '';
    ipAddressIpv6.value = item.Address ?? '';
    ipAddress.value = item.Address ?? '';
    ipAddressIpv6StaticDefaultGateway.value = item.Address ?? '';
    prefixLength.value = item.PrefixLength ?? 0;
  });

  setSelectedTabIndex(0);
});

const isIpv6Valid = (index) => {
  if (!networkSettings.value.length) return false;
  const ipv6 = networkSettings.value[index]?.ipv6;
  return !!(ipv6 && ipv6.length > 0);
};

const lldpState = computed({
  get() {
    return lldpEnabledState.value?.[tabIndex.value]?.lldpEnabled ?? false;
  },
  set(newValue) {
    return newValue;
  },
});

watch(networkSettings, () => {
  getModalInfo();
});

const getModalInfo = () => {
  if (!networkSettings.value.length) return;
  defaultGateway.value =
    networkSettings.value[tabIndex.value]?.defaultGateway ?? '';
  currentHostname.value = networkSettings.value[tabIndex.value]?.hostname ?? '';
};

const getTabIndex = (selectedIndex) => {
  tabIndex.value = selectedIndex;
  setSelectedTabIndex(tabIndex.value);
  const id = networkSettings.value[tabIndex.value]?.id ?? '';
  setSelectedTabId(id);
  getModalInfo();
};

const saveIpv4Address = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress.value, Subnet: '' };
    const editRow = modalData.concat(selectedRow);
    updateIpv4Address(editRow).finally(() => setEndLoaderAfterDelay());
  } else {
    // Add new address
    updateIpv4Address(modalData).finally(() => setEndLoaderAfterDelay());
  }
};

const saveIpv6Address = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress.value, PrefixLength: 0 };
    const editRow = modalData.concat(selectedRow);
    updateIpv6Address(editRow).finally(() => setEndLoaderAfterDelay());
  } else {
    // Add new address
    updateIpv6Address(modalData).finally(() => setEndLoaderAfterDelay());
  }
};

const saveIpv6StaticDefaultGatewayAddress = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddressIpv6StaticDefaultGateway.value !== '') {
    //Edit selected row
    const selectedRow = {
      Address: ipAddressIpv6StaticDefaultGateway.value,
    };
    const editRow = modalData.concat(selectedRow);
    updateIpv6StaticDefaultGatewayAddress(editRow).finally(() =>
      setEndLoaderAfterDelay(),
    );
  } else {
    // Add new address
    updateIpv6StaticDefaultGatewayAddress(modalData).finally(() =>
      setEndLoaderAfterDelay(),
    );
  }
};

const saveDnsAddress = (modalFormData) => {
  startLoader();
  saveDnsAddressApi(modalFormData).finally(() => endLoader());
};

const saveHostname = (modalFormData) => {
  startLoader();
  saveHostnameApi(modalFormData)
    .then(() => {
      authenticationStore.logout().then(() => {
        router.push('/login');
      });
    })
    .finally(() => endLoader());
};

const setEndLoaderAfterDelay = () => {
  setTimeout(() => {
    endLoader();
  }, 15000);
};

const changeLLDPState = (state) => {
  saveLLDPState(state);
};
</script>
