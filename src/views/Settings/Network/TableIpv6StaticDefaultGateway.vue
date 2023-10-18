<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6StaticDefaultGateway')">
      <b-row>
        <b-col class="text-right">
          <b-button
            variant="primary"
            :disabled="isTablesDisabled"
            @click="initIpv6DefaultGatewayModal()"
          >
            <icon-add />
            {{ $t('pageNetwork.table.addIpv6StaticDefaultGateway') }}
          </b-button>
        </b-col>
      </b-row>
      <b-table
        responsive="md"
        hover
        :fields="ipv6DefaultGatewayTableFields"
        :items="form.ipv6DefaultGatewayTableItems"
        :empty-text="$t('global.table.emptyMessage')"
        :busy="isTablesDisabled"
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
            @click-table-action="
              onIpv6DefaultGatewayTableAction(action, $event, item)
            "
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
        ipv6DefaultGatewayTableItems: [],
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
      ipv6DefaultGatewayTableFields: [
        {
          key: 'Address',
          label: this.$t('pageNetwork.table.ipAddress'),
        },
        {
          key: 'PrefixLength',
          label: this.$t('pageNetwork.table.prefixLength'),
        },
        { key: 'actions', label: '', tdClass: 'text-right' },
      ],
    };
  },
  computed: {
    isTablesDisabled() {
      return this.$store.getters['network/isTableBusy'];
    },
    network() {
      return this.$store.getters['network/networkSettings'];
    },
    selectedInterface() {
      return this.$store.getters['network/selectedInterfaceIndex'];
    },
  },
  watch: {
    // Watch for change in tab index
    tabIndex() {
      this.getipv6DefaultGatewayTableItems();
    },
    network() {
      this.getipv6DefaultGatewayTableItems();
    },
  },
  created() {
    this.getipv6DefaultGatewayTableItems();
  },
  methods: {
    getipv6DefaultGatewayTableItems() {
      const index = this.tabIndex;
      const addresses = this.network[index].ipv6StaticDefaultGateways || [];
      this.form.ipv6DefaultGatewayTableItems = addresses.map((ipv6) => {
        return {
          Address: ipv6.Address,
          PrefixLength: ipv6.PrefixLength,
          actions: [
            {
              value: 'edit',
              enabled: true,
              title: this.$t('pageNetwork.table.editIpv6StaticDefaultGateway'),
            },
            {
              value: 'delete',
              enabled: true,
              title: this.$t(
                'pageNetwork.table.deleteIpv6StaticDefaultGateway'
              ),
            },
          ],
        };
      });
    },
    onIpv6DefaultGatewayTableAction(action, $event, item) {
      if (!this.isTablesDisabled) {
        if ($event === 'edit') {
          this.$root.$emit('edit-address', item);
          this.initIpv6DefaultGatewayModal();
        }
        if ($event === 'delete') {
          this.deleteIpv6DefaultGatewayTableRow(item);
        }
      }
    },
    deleteIpv6DefaultGatewayTableRow(item) {
      const newIpv6Array = this.form.ipv6DefaultGatewayTableItems
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
              .dispatch(
                'network/deleteIpv6StaticDefaultGatewayAddress',
                newIpv6Array
              )
              .then((message) => {
                this.successToast(message);
                this.startLoader();
                setTimeout(() => {
                  this.endLoader();
                }, 15000);
              })
              .catch(({ message }) => this.errorToast(message));
          }
        });
    },
    initIpv6DefaultGatewayModal() {
      this.$bvModal.show('modal-add-ipv6-default-gateway');
    },
  },
};
</script>
