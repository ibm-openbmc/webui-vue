<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.network')"
      :description="$t('pageNetwork.pageDescription')"
    />
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
import ModalDns from './ModalDns.vue';
import NetworkGlobalSettings from './NetworkGlobalSettings.vue';
import NetworkInterfaceSettings from './NetworkInterfaceSettings.vue';
import PageSection from '@/components/Global/PageSection';
import PageTitle from '@/components/Global/PageTitle';
import TableIpv4 from './TableIpv4.vue';
import TableDns from './TableDns.vue';

export default {
  name: 'Network',
  components: {
    ModalHostname,
    ModalIpv4,
    ModalDns,
    NetworkGlobalSettings,
    NetworkInterfaceSettings,
    PageSection,
    PageTitle,
    TableDns,
    TableIpv4,
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
      subnet: '',
      loading,
      tabIndex: 0,
    };
  },
  computed: {
    network() {
      return this.$store.getters['network/networkSettings'];
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
      this.ipAddress = item.Address;
    });
  },
  created() {
    this.startLoader();
    this.$store
      .dispatch('network/getEthernetData')
      .finally(() => this.endLoader());
  },
  methods: {
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
          .then((message) => {
            this.startLoader();
            this.successToast(message);
            setTimeout(() => {
              this.endLoader();
            }, 10000);
          })
          .catch(({ message }) => {
            this.errorToast(message);
            this.endLoader();
          });
      } else {
        // Add new address
        this.$store
          .dispatch('network/updateIpv4Address', modalData)
          .then((message) => {
            this.startLoader();
            this.successToast(message);
            setTimeout(() => {
              this.endLoader();
            }, 10000);
          })
          .catch(({ message }) => {
            this.errorToast(message);
            this.endLoader();
          });
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
        .then(this.$store.dispatch('authentication/logout'))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
  },
};
</script>
