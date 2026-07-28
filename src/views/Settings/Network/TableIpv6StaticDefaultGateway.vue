<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6StaticDefaultGateway')">
      <BRow>
        <BCol lg="6">
          <div class="text-right">
            <BButton
              variant="primary"
              :disabled="isTablesDisabled"
              data-test-id="add-static-default-gateway"
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
            :items="ipv6DefaultGatewayTableItems"
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
                  <icon-edit
                    v-if="action.value === 'edit'"
                    data-test-id="edit-static-default-gateway"
                  />
                  <icon-trashcan
                    v-if="action.value === 'delete'"
                    data-test-id="delete-static-default-gateway"
                  />
                </template>
              </table-row-action>
            </template>
            <template #empty>
              <span v-if="isTablesDisabled">
                {{ $t('global.table.loading') }}
              </span>
              <span v-else>
                {{ $t('global.table.emptyMessage') }}
              </span>
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
import { ref, computed, watch } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import PageSection from '@/components/Global/PageSection.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import { useNetwork } from '@/api/composables/useNetwork';

const { startLoader, endLoader } = useLoadingBar();

const { networkSettings, isTableBusy, deleteIpv6StaticDefaultGatewayAddress } =
  useNetwork();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const openModal = ref(false);
const modalMessage = ref('');
const modalPayload = ref({ newIpv6Array: null });
const modalOptions = ref({
  title: '',
  okVariant: '',
  okTitle: '',
  cancelTitle: '',
});

const ipv6DefaultGatewayTableFields = [
  {
    key: 'Address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    label: '',
    tdClass: 'text-right',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
];

const isTablesDisabled = computed(() => isTableBusy.value);

const ipv6DefaultGatewayTableItems = computed(() => {
  const addresses =
    networkSettings.value[props.tabIndex]?.ipv6StaticDefaultGateways ?? [];
  return addresses.map((ipv6) => ({
    Address: ipv6.Address,
    actions: [
      {
        value: 'edit',
        enabled: true,
        title: i18n.global.t('pageNetwork.table.editIpv6StaticDefaultGateway'),
      },
      {
        value: 'delete',
        enabled: true,
        title: i18n.global.t(
          'pageNetwork.table.deleteIpv6StaticDefaultGateway',
        ),
      },
    ],
  }));
});

watch(
  () => ipv6DefaultGatewayTableItems.value,
  (items) => {
    if (!items.length) {
      document
        .querySelector('tr.b-table-empty-slot td[scope]')
        ?.removeAttribute('scope');
    }
  },
);

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
  const newIpv6Array = ipv6DefaultGatewayTableItems.value
    .filter((row) => row.Address !== item.Address)
    .map((ipv6) => ({ Address: ipv6.Address }));
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
  if (!modalPayload.value.newIpv6Array) return;
  startLoader();
  deleteIpv6StaticDefaultGatewayAddress(
    modalPayload.value.newIpv6Array,
  ).finally(() => {
    setTimeout(() => endLoader(), 15000);
  });
};

const initIpv6DefaultGatewayModal = () => {
  eventBus.emit('modal-add-ipv6-default-gateway');
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}

:deep(.table) {
  td {
    white-space: nowrap;
  }
}
</style>
