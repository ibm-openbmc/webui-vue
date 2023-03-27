<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6')">
      <b-row class="mb-4">
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.dhcp') }}</dt>
            <dd>
              <b-form-checkbox
                id="dhcpIpv6Switch"
                v-model="dhcpEnabledState"
                switch
                @change="changeIpv6DhcpEnabledState"
              >
                <span v-if="dhcpEnabledState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.ipv6AutoConfig') }}</dt>
            <dd>
              <b-form-checkbox
                id="ipv6AutoConfigSwitch"
                v-model="ipv6AutoConfigState"
                switch
                @change="changeIpv6AutoConfigState"
              >
                <span v-if="ipv6AutoConfigState">
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
          <b-button variant="primary" @click="initIpv6Modal()">
            <icon-add />
            {{ $t('pageNetwork.table.addIpv6Address') }}
          </b-button>
        </b-col>
      </b-row>
      <b-table
        responsive="md"
        hover
        :fields="ipv6TableFields"
        :items="form.ipv6TableItems"
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
            @click-table-action="onIpv6TableAction(action, $event, item)"
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
  name: 'Ipv6Table',
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
        ipv6TableItems: [],
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
      ipv6TableFields: [
        {
          key: 'Address',
          label: this.$t('pageNetwork.table.ipAddress'),
        },
        {
          key: 'PrefixLength',
          label: this.$t('pageNetwork.table.prefixLength'),
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
        ].ipv6OperatingMode === 'Enabled'
          ? true
          : false;
      },
      set(newValue) {
        return newValue;
      },
    },
    ipv6AutoConfigState: {
      get() {
        return this.$store.getters['network/networkSettings'][
          this.selectedInterface
        ].ipv6AutoConfigEnabled;
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  watch: {
    // Watch for change in tab index
    tabIndex() {
      this.getipv6TableItems();
    },
    network() {
      this.getipv6TableItems();
    },
  },
  created() {
    this.getipv6TableItems();
  },
  methods: {
    getipv6TableItems() {
      const index = this.tabIndex;
      const addresses = this.network[index].ipv6 || [];
      this.form.ipv6TableItems = addresses.map((ipv6) => {
        return {
          Address: ipv6.Address,
          PrefixLength: ipv6.PrefixLength,
          AddressOrigin: ipv6.AddressOrigin,
          actions: [
            {
              value: 'edit',
              enabled:
                ipv6.AddressOrigin !== 'LinkLocal' &&
                ipv6.AddressOrigin !== 'DHCPv6' &&
                ipv6.AddressOrigin !== 'SLAAC',
              title: this.$t('pageNetwork.table.editIpv6'),
            },
            {
              value: 'delete',
              enabled:
                ipv6.AddressOrigin !== 'LinkLocal' &&
                ipv6.AddressOrigin !== 'DHCPv6' &&
                ipv6.AddressOrigin !== 'SLAAC',
              title: this.$t('pageNetwork.table.deleteIpv6'),
            },
          ],
        };
      });
    },
    onIpv6TableAction(action, $event, item) {
      if ($event === 'edit') {
        this.$root.$emit('edit-address', item);
        this.initIpv6Modal();
      }
      if ($event === 'delete') {
        this.deleteIpv6TableRow(item);
      }
    },
    deleteIpv6TableRow(item) {
      const newIpv6Array = this.form.ipv6TableItems
        .filter((row) => row.Address !== item.Address)
        .map((ipv6) => {
          const { Address, PrefixLength } = ipv6;
          return {
            Address,
            PrefixLength,
          };
        });
      const addressIp = item.Address;
      this.$bvModal
        .msgBoxConfirm(
          this.$t('pageNetwork.modal.confirmDeleteIpv6', {
            address: addressIp,
          }),
          {
            title: this.$t('pageNetwork.modal.deleteIpv6'),
            okTitle: this.$t('global.action.delete'),
            okVariant: 'danger',
            cancelTitle: this.$t('global.action.cancel'),
          }
        )
        .then((deleteConfirmed) => {
          if (deleteConfirmed) {
            this.$store
              .dispatch('network/deleteIpv6Address', newIpv6Array)
              .then((message) => this.successToast(message))
              .catch(({ message }) => this.errorToast(message));
          }
        });
    },
    initIpv6Modal() {
      this.$bvModal.show('modal-add-ipv6');
    },
    changeIpv6DhcpEnabledState(state) {
      this.$store
        .dispatch('network/saveIpv6DhcpEnabledState', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    changeIpv6AutoConfigState(state) {
      this.$store
        .dispatch('network/saveIpv6AutoConfigState', state)
        .then((success) => {
          this.successToast(success);
        })
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
