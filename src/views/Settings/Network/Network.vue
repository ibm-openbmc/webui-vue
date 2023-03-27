<template>
  <b-container fluid="xl">
    <page-title :description="$t('pageNetwork.pageDescription')" />
    <!-- Global settings for all interfaces -->
    <network-global-settings />
    <!-- Interface tabs -->
    <page-section>
      <b-row>
        <b-col>
          <b-card no-body>
            <b-tabs content-class="mt-3 p-4">
              <b-tab
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
                <!-- Static DNS table -->
                <table-dns :tab-index="tabIndex" />
              </b-tab>
              <template #empty>
                <div class="text-center text-muted">
                  {{ $t('global.table.emptyMessage') }}
                </div>
              </template>
            </b-tabs>
          </b-card>
        </b-col>
      </b-row>
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
    <modal-dns @ok="saveDnsAddress" />
    <modal-hostname :hostname="currentHostname" @ok="saveHostname" />
  </b-container>
</template>

<script>
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import ModalHostname from './ModalHostname.vue';
import ModalIpv4 from './ModalIpv4.vue';
import ModalIpv6 from './ModalIpv6.vue';
import ModalDns from './ModalDns.vue';
import NetworkGlobalSettings from './NetworkGlobalSettings.vue';
import NetworkInterfaceSettings from './NetworkInterfaceSettings.vue';
import PageSection from '@/components/Global/PageSection';
import PageTitle from '@/components/Global/PageTitle';
import TableIpv4 from './TableIpv4.vue';
import TableDns from './TableDns.vue';
import TableIpv6 from './TableIpv6.vue';

export default {
  name: 'Network',
  components: {
    ModalHostname,
    ModalIpv4,
    ModalIpv6,
    ModalDns,
    NetworkGlobalSettings,
    NetworkInterfaceSettings,
    PageSection,
    PageTitle,
    TableDns,
    TableIpv4,
    TableIpv6,
  },
  mixins: [BVToastMixin, DataFormatterMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      currentHostname: '',
      defaultGateway: '',
      ipAddress: '',
      ipAddressIpv6: '',
      prefixLength: 0,
      subnet: '',
      loading,
      tabIndex: 0,
    };
  },
  computed: {
    network() {
      return this.$store.getters['network/networkSettings'];
    },
    isIpv6Valid() {
      const ipv6 = this.network[this.tabIndex].ipv6;
      if (ipv6 === undefined || ipv6 === null || ipv6.length === 0)
        return false;
      else return true;
    },
  },
  watch: {
    network() {
      this.getModalInfo();
    },
  },
  mounted() {
    this.$root.$on('edit-address', (item) => {
      this.subnet = item.SubnetMask;
      this.ipAddressIpv6 = item.Address;
      this.ipAddress = item.Address;
      this.prefixLength = item.PrefixLength;
    });
  },
  created() {
    this.startLoader();
    this.$store
      .dispatch('network/getEthernetData')
      .finally(() => this.endLoader());
  },
  methods: {
    // isIpv6Valid() {
    //   const ipv6 = this.network[this.tabIndex].ipv6;
    //   if (ipv6 == 'undefined' || 'null') return false;
    //   else return true;
    // },
    getModalInfo() {
      this.defaultGateway = this.$store.getters['network/networkSettings'][
        this.tabIndex
      ].defaultGateway;

      this.currentHostname = this.$store.getters['network/networkSettings'][
        this.tabIndex
      ].hostname;

      this.currentMacAddress = this.$store.getters['network/networkSettings'][
        this.tabIndex
      ].macAddress;
    },
    getTabIndex(selectedIndex) {
      this.tabIndex = selectedIndex;
      this.$store.dispatch('network/setSelectedTabIndex', this.tabIndex);
      this.$store.dispatch(
        'network/setSelectedTabId',
        this.network[this.tabIndex].id
      );
      this.getModalInfo();
    },
    saveIpv4Address(modalFormData) {
      const modalData = [modalFormData];
      this.startLoader();
      if (this.ipAddress !== '') {
        //Edit selected row
        const selectedRow = { Address: this.ipAddress, Subnet: '' };
        const editRow = modalData.concat(selectedRow);
        this.$store
          .dispatch('network/updateIpv4Address', editRow)
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      } else {
        // Add new address
        this.$store
          .dispatch('network/updateIpv4Address', modalData)
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      }
    },
    saveIpv6Address(modalFormData) {
      const modalData = [modalFormData];
      this.startLoader();
      if (this.ipAddress !== '') {
        //Edit selected row
        const selectedRow = { Address: this.ipAddress, PrefixLength: 0 };
        const editRow = modalData.concat(selectedRow);
        this.$store
          .dispatch('network/updateIpv6Address', editRow)
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      } else {
        // Add new address
        this.$store
          .dispatch('network/updateIpv6Address', modalData)
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      }
    },
    saveDnsAddress(modalFormData) {
      this.startLoader();
      this.$store
        .dispatch('network/saveDnsAddress', modalFormData)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
    saveHostname(modalFormData) {
      this.startLoader();
      this.$store
        .dispatch('network/saveHostname', modalFormData)
        .then((message) => this.successToast(message))
        .then(
          setTimeout(() => {
            this.$store.dispatch('authentication/logout');
          }, 3000 /* 3 seconds */)
        )
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
  },
};
</script>
