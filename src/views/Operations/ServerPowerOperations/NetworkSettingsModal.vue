<template>
  <b-modal
    id="modal-network-settings"
    ref="modal"
    size="xl"
    :title="$t('pageServerPowerOperations.modal.networkSettings.header')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
  >
    <h3>
      {{
        $t('pageServerPowerOperations.modal.networkSettings.settingsHeading')
      }}
    </h3>
    <span>
      {{
        $t(
          'pageServerPowerOperations.modal.networkSettings.settingsDescription'
        )
      }}
    </span>
    <!-- network-install-type -->
    <b-row v-if="attributesList !== null" class="mt-3 mb-3">
      <b-col sm="6" xl="6">
        <h5>
          {{
            $t(
              'pageServerPowerOperations.modal.networkSettings.networkTypeHeading'
            )
          }}
        </h5>
        <b-form-select
          id="network-install-type"
          v-model="attributesList['pvm_ibmi_network_install_type']"
          :options="networkValuesArr"
        >
        </b-form-select>
      </b-col>
    </b-row>
    <!-- ipaddress-protocol -->
    <template
      v-if="
        attributesList !== null &&
        attributesList['pvm_ibmi_network_install_type'] !== 'Disabled'
      "
    >
      <b-row class="mt-3 mb-3">
        <b-col sm="6" xl="6">
          <h5>
            {{
              $t(
                'pageServerPowerOperations.modal.networkSettings.ipAddressProtocolHeading'
              )
            }}
          </h5>
          <b-form-select
            id="ipaddress-protocol"
            v-model="attributesList['pvm_ibmi_ipaddress_protocol']"
            :options="computedIPAddressProtocolList"
          >
          </b-form-select>
        </b-col>
      </b-row>
    </template>
    <template #modal-footer>
      <div class="w-100">
        <b-button variant="light" size="sm">{{
          $t('pageServerPowerOperations.modal.networkSettings.cancel')
        }}</b-button>
        <b-button variant="primary" size="sm">{{
          $t('pageServerPowerOperations.modal.networkSettings.submit')
        }}</b-button>
      </div>
    </template>
  </b-modal>
</template>
<script>
export default {
  data() {
    return {
      networkValuesArr: ['Disabled', 'NFS', 'iSCSI'],
    };
  },
  computed: {
    attributesList() {
      return this.$store.getters['networkSettings/biosAttributes'];
    },
    computedIPAddressProtocolList() {
      if (this.attributesList['pvm_ibmi_network_install_type'] === 'NFS')
        return ['IPv4', 'IPv6'];
      else return ['IPv4'];
    },
  },
  watch: {},
  created() {
    this.$store.dispatch('networkSettings/getBiosAttributes');
  },
  methods: {},
};
</script>
