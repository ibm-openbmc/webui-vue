<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6StaticDefaultGateway')">
      <BRow>
        <BCol lg="6">
          <div class="text-right">
            <BButton
              variant="primary"
              :disabled="isTablesDisabled"
              @click="initIpv6DefaultGatewayModal()"
            >
              <icon-add />
              {{ $t('pageNetwork.table.addIpv6StaticDefaultGateway') }}
            </BButton>
          </div>
          <BTable
            responsive="md"
            hover
            sticky-header="75vh"
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
          </BTable>
        </BCol>
      </BRow>
      
    </page-section>
    <BModal
      v-model="openModal"
      hide-header-close
      :title="modalOptions.title"
      :ok-title="modalOptions.okTitle"
      :ok-variant="modalOptions.okVariant"
      :cancel-title="modalOptions.cancelTitle"
      @ok="operationConfirm"
    >
      <p>
        {{ modalMessage }}
      </p>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import PageSection from '@/components/Global/PageSection.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import stores from '@/store';

const { successToast, errorToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();

const networkStore = stores.NetworkStore();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const openModal = ref(false);

const modalMessage = ref('');
const modalPayload = ref({
  newIpv6Array: null,
});
const modalOptions = ref({
  title: '',
  okVariant: '',
  okTitle: '',
  cancelTitle: '',
});

const form = ref({
  ipv6DefaultGatewayTableItems: [],
});

const actions = ref([
  {
    value: 'edit',
    title: i18n.global.t('global.action.edit'),
  },
  {
    value: 'delete',
    title: i18n.global.t('global.action.delete'),
  },
]);

const ipv6DefaultGatewayTableFields = ref([
  {
    key: 'Address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
  },
  { key: 'actions', label: '', tdClass: 'text-right' },
]);

onBeforeMount(() => {
  getipv6DefaultGatewayTableItems();
});

const isTablesDisabled = computed(() => {
  return networkStore.isTableBusyGetter;
});

const network = computed(() => {
  return networkStore.networkSettingsGetter;
});

const selectedInterface = computed(() => {
  return networkStore.selectedInterfaceIndexGetter;
});

// Watch for change in tab index
watch(
  () => props.tabIndex,
  () => {
    getipv6DefaultGatewayTableItems();
  },
);

watch(network, () => {
  getipv6DefaultGatewayTableItems();
});

const getipv6DefaultGatewayTableItems = () => {
  const index = props.tabIndex;
  const addresses = network.value[index].ipv6StaticDefaultGateways || [];
  form.value.ipv6DefaultGatewayTableItems = addresses.map((ipv6) => {
    return {
      Address: ipv6.Address,
      actions: [
        {
          value: 'edit',
          enabled: true,
          title: i18n.global.t(
            'pageNetwork.table.editIpv6StaticDefaultGateway',
          ),
        },
        {
          value: 'delete',
          enabled: true,
          title: i18n.global.t(
            'pageNetwork.table.deleteIpv6StaticDefaultGateway',
          ),
        },
      ],
    };
  });
};

const onIpv6DefaultGatewayTableAction = (action, $event, item) => {
  if (!isTablesDisabled.value) {
    if ($event === 'edit') {
      eventBus.emit('edit-address', item);
      initIpv6DefaultGatewayModal();
    }
    if ($event === 'delete') {
      openDeleteIpv6DefaultGatewayTableRowModal(item);
    }
  }
};

const openDeleteIpv6DefaultGatewayTableRowModal = (item) => {
  const newIpv6Array = form.value.ipv6DefaultGatewayTableItems
    .filter((row) => row.Address !== item.Address)
    .map((ipv6) => {
      const { Address } = ipv6;
      return {
        Address,
      };
    });
  const addressIp = item.Address;

  modalPayload.value.newIpv6Array = newIpv6Array;

  modalMessage.value = i18n.global.t('pageNetwork.modal.confirmDeleteIpv6', {
    address: addressIp,
  });

  modalOptions.value.title = i18n.global.t('pageNetwork.modal.deleteIpv6');
  modalOptions.value.okVariant = 'danger';
  modalOptions.value.okTitle = i18n.global.t('global.action.delete');
  modalOptions.value.cancelTitle = i18n.global.t('global.action.cancel');

  openModal.value = true;
};

const operationConfirm = () => {
  networkStore
    .deleteIpv6StaticDefaultGatewayAddress(modalPayload.value.newIpv6Array)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};

const initIpv6DefaultGatewayModal = () => {
  eventBus.emit('modal-add-ipv6-default-gateway');
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}
</style>
