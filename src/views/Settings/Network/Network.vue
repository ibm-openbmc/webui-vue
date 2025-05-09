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
                <!-- Static DNS table -->
                <div v-if="isIpv6Valid">
                  <table-ipv-6 :tab-index="tabIndex" />
                </div>
                <!-- IPV6 Static Default gateways table -->
                <table-ipv6-static-default-gateway :tab-index="tabIndex" />
                <!-- Static DNS table -->
                <table-dns :tab-index="tabIndex" />
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
      :prefix-length="prefixLengthIpv6StaticDefaultGateway"
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
import { NetworkStore, AuthenticationStore } from '@/store';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();

const networkStore = NetworkStore();
const authenticationStore = AuthenticationStore();

const currentHostname = ref('');
const defaultGateway = ref('');
const ipAddress = ref('');
const ipAddressIpv6 = ref('');
const ipAddressIpv6StaticDefaultGateway = ref('');
const prefixLengthIpv6StaticDefaultGateway = ref(0);
const prefixLength = ref(0);
const subnet = ref('');
const tabIndex = ref(0);

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  networkStore.getEthernetData().finally(() => endLoader());
});

onMounted(() => {
  eventBus.on('edit-address', (item) => {
    subnet.value = item.SubnetMask;
    ipAddressIpv6.value = item.Address;
    ipAddress.value = item.Address;
    ipAddressIpv6StaticDefaultGateway.value = item.Address;
    prefixLength.value = item.PrefixLength;
    prefixLengthIpv6StaticDefaultGateway.value = item.PrefixLength;
  });
  networkStore.setSelectedTabIndex(0);
});

const network = computed(() => {
  return networkStore.networkSettingsGetter;
});

const isIpv6Valid = computed(() => {
  const ipv6 = network.value[tabIndex.value].ipv6;
  if (ipv6 === undefined || ipv6 === null || ipv6.length === 0) return false;
  else return true;
});

watch(network, () => {
  getModalInfo();
});

const getModalInfo = () => {
  defaultGateway.value =
    networkStore.networkSettingsGetter[tabIndex.value].defaultGateway;

  currentHostname.value =
    networkStore.networkSettingsGetter[tabIndex.value].hostname;
};

const getTabIndex = (selectedIndex) => {
  tabIndex.value = selectedIndex;
  networkStore.setSelectedTabIndex(tabIndex.value);
  networkStore.setSelectedTabId(network.value[tabIndex.value].id);
  getModalInfo();
};

const saveIpv4Address = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress.value, Subnet: '' };
    const editRow = modalData.concat(selectedRow);
    networkStore
      .updateIpv4Address(editRow)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  } else {
    // Add new address
    networkStore
      .updateIpv4Address(modalData)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  }
};

const saveIpv6Address = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddress.value !== '') {
    //Edit selected row
    const selectedRow = { Address: ipAddress, PrefixLength: 0 };
    const editRow = modalData.concat(selectedRow);
    networkStore
      .updateIpv6Address(editRow)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  } else {
    // Add new address
    networkStore
      .updateIpv6Address(modalData)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  }
};

const saveIpv6StaticDefaultGatewayAddress = (modalFormData) => {
  const modalData = [modalFormData];
  startLoader();
  if (ipAddressIpv6StaticDefaultGateway.value !== '') {
    //Edit selected row
    const selectedRow = {
      Address: ipAddressIpv6StaticDefaultGateway.value,
      PrefixLength: 0,
    };
    const editRow = modalData.concat(selectedRow);
    networkStore
      .updateIpv6StaticDefaultGatewayAddress(editRow)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  } else {
    // Add new address
    networkStore
      .updateIpv6StaticDefaultGatewayAddress(modalData)
      .then((message) => {
        successToast(message);
        setEndLoaderAfterDelay();
      })
      .catch(({ message }) => {
        errorToast(message);
        endLoader();
      });
  }
};

const saveDnsAddress = (modalFormData) => {
  startLoader();
  networkStore
    .saveDnsAddress(modalFormData)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => endLoader());
};

const saveHostname = (modalFormData) => {
  startLoader();
  networkStore
    .saveHostname(modalFormData)
    .then(() => authenticationStore.logout())
    .catch(({ message }) => errorToast(message))
    .finally(() => endLoader());
};

const setEndLoaderAfterDelay = () => {
  setTimeout(() => {
    endLoader();
  }, 15000);
};
</script>
