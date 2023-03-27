<template>
  <div>
    <page-section :section-title="$t('pageNetwork.interfaceSection')">
      <b-row>
        <b-col md="3">
          <dl class="text-nowrap">
            <dt>
              {{ $t('pageNetwork.macAddress') }}
            </dt>
            <dd>
              {{ dataFormatter(macAddress) }}
            </dd>
          </dl>
        </b-col>
      </b-row>
      <b-row class="mb-4">
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.useDomainName') }}</dt>
            <dd>
              <b-form-checkbox
                id="useDomainNameSwitch"
                v-model="useDomainNameState"
                data-test-id="networkSettings-switch-useDomainName"
                switch
                :disabled="!dhcpState"
                @change="changeDomainNameState"
              >
                <span v-if="useDomainNameState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.useDns') }}</dt>
            <dd>
              <b-form-checkbox
                id="useDnsSwitch"
                v-model="useDnsState"
                data-test-id="networkSettings-switch-useDns"
                switch
                :disabled="!dhcpState"
                @change="changeDnsState"
              >
                <span v-if="useDnsState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
        <b-col md="3">
          <dl>
            <dt>{{ $t('pageNetwork.useNtp') }}</dt>
            <dd>
              <b-form-checkbox
                id="useNtpSwitch"
                v-model="useNtpState"
                data-test-id="networkSettings-switch-useNtp"
                switch
                :disabled="!dhcpState"
                @change="changeNtpState"
              >
                <span v-if="useNtpState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
      </b-row>
    </page-section>
  </div>
</template>
<script>
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import PageSection from '@/components/Global/PageSection';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
export default {
  name: 'Ipv4Table',
  components: {
    PageSection,
  },
  mixins: [BVToastMixin, DataFormatterMixin],
  props: {
    tabIndex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      selectedInterface: '',
      macAddress: '',
    };
  },
  computed: {
    network() {
      return this.$store.getters['network/networkSettings'];
    },
    dhcpState() {
      const ipv4Dhcp = this.$store.getters['network/networkSettings'][
        this.selectedInterface
      ].dhcpEnabled;
      const ipv6Dhcp =
        this.$store.getters['network/networkSettings'][this.selectedInterface]
          .ipv6OperatingMode === 'Enabled'
          ? true
          : false;
      return ipv4Dhcp || ipv6Dhcp ? true : false;
    },
    useDomainNameState: {
      get() {
        return this.$store.getters['network/networkSettings'][
          this.selectedInterface
        ].useDomainNameEnabled;
      },
      set(newValue) {
        return newValue;
      },
    },
    useDnsState: {
      get() {
        return this.$store.getters['network/networkSettings'][
          this.selectedInterface
        ].useDnsEnabled;
      },
      set(newValue) {
        return newValue;
      },
    },
    useNtpState: {
      get() {
        return this.$store.getters['network/networkSettings'][
          this.selectedInterface
        ].useNtpEnabled;
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  watch: {
    // Watch for change in tab index
    tabIndex() {
      this.getSettings();
    },
  },
  created() {
    this.getSettings();
  },
  methods: {
    getSettings() {
      this.selectedInterface = this.tabIndex;
      this.macAddress = this.network[this.selectedInterface].macAddress;
    },
    changeDomainNameState(state) {
      this.$store
        .dispatch('network/saveDomainNameState', state)
        .then((success) => {
          this.successToast(success);
        })
        .catch(({ message }) => this.errorToast(message));
    },
    changeDnsState(state) {
      this.$store
        .dispatch('network/saveDnsState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeNtpState(state) {
      this.$store
        .dispatch('network/saveNtpState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
