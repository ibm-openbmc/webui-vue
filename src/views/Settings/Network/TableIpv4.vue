<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv4')">
      <b-row class="mb-4">
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.dhcp') }}</dt>
            <dd>
              <b-form-checkbox
                id="dhcpSwitch"
                v-model="dhcpEnabledState"
                data-test-id="networkSettings-switch-dhcpEnabled"
                switch
                @change="changeDhcpEnabledState"
              >
                <span v-if="dhcpEnabledState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="3">
          <dl>
            <dt>{{ $t('pageNetwork.useDomainName') }}</dt>
            <dd>
              <b-form-checkbox
                id="useDomainNameSwitch"
                v-model="useDomainNameState"
                data-test-id="networkSettings-switch-useDomainName"
                switch
                :disabled="!dhcpEnabledState"
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
        <b-col md="3">
          <dl>
            <dt>{{ $t('pageNetwork.useDns') }}</dt>
            <dd>
              <b-form-checkbox
                id="useDnsSwitch"
                v-model="useDnsState"
                data-test-id="networkSettings-switch-useDns"
                switch
                :disabled="!dhcpEnabledState"
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
                :disabled="!dhcpEnabledState"
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
      <b-row>
        <b-col class="text-right">
          <b-button variant="primary" @click="initIpv4Modal()">
            <icon-add />
            {{ $t('pageNetwork.table.addIpv4Address') }}
          </b-button>
        </b-col>
      </b-row>
      <b-table
        responsive="md"
        hover
        :fields="ipv4TableFields"
        :items="form.ipv4TableItems"
        :empty-text="$t('global.table.emptyMessage')"
        class="mb-0"
        show-empty
      >
        <template #cell(actions)="{ item }">
          <table-row-action
            v-for="(action, actionIndex) in item.actions"
            :key="actionIndex"
            :value="action.value"
            :title="action.title"
            :enabled="action.enabled"
            @click-table-action="onIpv4TableAction(action, $event, item)"
          >
            <template #icon>
              <icon-edit v-if="action.value === 'edit'" />
              <icon-trashcan v-if="action.value === 'delete'" />
            </template>
          </table-row-action>
        </template>
      </b-table>
    </page-section>
  </div>
</template>

<script>
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import PageSection from '@/components/Global/PageSection';
import TableRowAction from '@/components/Global/TableRowAction';

export default {
  name: 'Ipv4Table',
  components: {
    IconAdd,
    IconEdit,
    IconTrashcan,
    PageSection,
    TableRowAction,
  },
  mixins: [BVToastMixin, LoadingBarMixin],
  props: {
    tabIndex: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      form: {
        ipv4TableItems: [],
      },
      actions: [
        {
          value: 'edit',
          title: this.$t('global.action.edit'),
        },
        {
          value: 'delete',
          title: this.$t('global.action.delete'),
        },
      ],
      ipv4TableFields: [
        {
          key: 'Address',
          label: this.$t('pageNetwork.table.ipAddress'),
        },
        {
          key: 'Gateway',
          label: this.$t('pageNetwork.table.gateway'),
        },
        {
          key: 'SubnetMask',
          label: this.$t('pageNetwork.table.subnet'),
        },
        {
          key: 'AddressOrigin',
          label: this.$t('pageNetwork.table.addressOrigin'),
        },
        { key: 'actions', label: '', tdClass: 'text-right' },
      ],
    };
  },
  computed: {
    network() {
      return this.$store.getters['network/networkSettings'];
    },
    selectedInterface() {
      return this.$store.getters['network/selectedInterfaceIndex'];
    },
    dhcpEnabledState: {
      get() {
        return this.$store.getters['network/networkSettings'][
          this.selectedInterface
        ].dhcpEnabled;
      },
      set(newValue) {
        return newValue;
      },
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
      this.getIpv4TableItems();
    },
    network() {
      this.getIpv4TableItems();
    },
  },
  created() {
    this.getIpv4TableItems();
  },
  methods: {
    getIpv4TableItems() {
      const index = this.tabIndex;
      const addresses = this.network[index].ipv4 || [];
      this.form.ipv4TableItems = addresses.map((ipv4) => {
        return {
          Address: ipv4.Address,
          SubnetMask: ipv4.SubnetMask,
          Gateway: ipv4.Gateway,
          AddressOrigin: ipv4.AddressOrigin,
          actions: [
            {
              value: 'edit',
              enabled: ipv4.AddressOrigin !== 'DHCP',
              title: this.$t('pageNetwork.table.editIpv4'),
            },
            {
              value: 'delete',
              enabled: ipv4.AddressOrigin !== 'DHCP',
              title: this.$t('pageNetwork.table.deleteIpv4'),
            },
          ],
        };
      });
    },
    onIpv4TableAction(action, $event, item) {
      if ($event === 'edit') {
        this.$root.$emit('edit-address', item);
        this.initIpv4Modal();
      }
      if ($event === 'delete') {
        this.deleteIpv4TableRow(item);
      }
    },
    deleteIpv4TableRow(item) {
      const newIpv4Array = this.form.ipv4TableItems
        .filter((row) => row.Address !== item.Address)
        .map((ipv4) => {
          const { Address, SubnetMask, Gateway } = ipv4;
          return {
            Address,
            SubnetMask,
            Gateway,
          };
        });
      const addressIp = item.Address;
      this.$bvModal
        .msgBoxConfirm(
          this.$t('pageNetwork.modal.confirmDeleteIpv4', {
            address: addressIp,
          }),
          {
            title: this.$t('pageNetwork.modal.deleteIpv4'),
            okTitle: this.$t('global.action.delete'),
            okVariant: 'danger',
            cancelTitle: this.$t('global.action.cancel'),
          }
        )
        .then((deleteConfirmed) => {
          if (deleteConfirmed) {
            this.$store
              .dispatch('network/deleteIpv4Address', newIpv4Array)
              .then((message) => this.successToast(message))
              .catch(({ message }) => this.errorToast(message));
          }
        });
    },
    initIpv4Modal() {
      this.$bvModal.show('modal-add-ipv4');
    },
    changeDhcpEnabledState(state) {
      this.$bvModal
        .msgBoxConfirm(
          state
            ? this.$t('pageNetwork.modal.confirmEnableDhcp')
            : this.$t('pageNetwork.modal.confirmDisableDhcp'),
          {
            title: this.$t('pageNetwork.modal.dhcpConfirmTitle', {
              dhcpState: state
                ? this.$t('global.action.enable')
                : this.$t('global.action.disable'),
            }),
            okTitle: state
              ? this.$t('global.action.enable')
              : this.$t('global.action.disable'),
            okVariant: 'danger',
            cancelTitle: this.$t('global.action.cancel'),
          }
        )
        .then((dhcpEnableConfirmed) => {
          if (dhcpEnableConfirmed) {
            this.$store
              .dispatch('network/saveDhcpEnabledState', state)
              .then((message) => this.successToast(message))
              .catch(({ message }) => this.errorToast(message));
          } else {
            let onDhcpCancel = document.getElementById('dhcpSwitch');
            onDhcpCancel.checked = !state;
          }
        });
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
