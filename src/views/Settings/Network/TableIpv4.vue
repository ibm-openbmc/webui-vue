<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv4')">
      <BRow class="mb-4">
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.dhcp') }}</dt>
            <dd>
              <BFormCheckbox
                id="dhcpSwitch"
                :key="componentKey"
                v-model="dhcpEnabledState"
                data-test-id="networkSettings-switch-dhcpEnabled"
                switch
                :disabled="isTablesDisabled"
                @update:model-value="openChangeDhcpEnabledStateModal"
              >
                <span v-if="dhcpEnabledState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
      </BRow>
      <BRow>
        <BCol class="text-right">
          <BButton
            variant="primary"
            :disabled="isTablesDisabled"
            data-test-id="add-static-ipv4"
            @click="initIpv4Modal()"
          >
            <icon-add />
            {{ $t('pageNetwork.table.addIpv4Address') }}
          </BButton>
        </BCol>
      </BRow>
      <BTable
        responsive="md"
        hover
        selectable
        no-select-on-click
        sort-icon-left
        sticky-header="75vh"
        :fields="ipv4TableFields"
        :items="form.ipv4TableItems"
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
              <icon-edit
                v-if="action.value === 'edit'"
                data-test-id="edit-static-ipv4"
              />
              <icon-trashcan
                v-if="action.value === 'delete'"
                data-test-id="delete-static-ipv4"
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
    </page-section>
    <BModal
      v-model="openModal"
      hide-header-close
      :title="modalOptions.title"
      :ok-title="modalOptions.okTitle"
      :ok-variant="modalOptions.okVariant"
      :cancel-title="modalOptions.cancelTitle"
      @ok="operationConfirm"
      @hidden="operationCancel"
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

const componentKey = ref(0);

const openModal = ref(false);

const modalMessage = ref('');
const modalPayload = ref({
  state: null,
  newIpv4Array: null,
});
const modalOptions = ref({
  title: '',
  okVariant: '',
  okTitle: '',
  cancelTitle: '',
});
const modalValue = ref('');

const form = ref({
  ipv4TableItems: [],
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

const ipv4TableFields = ref([
  {
    key: 'Address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
  },
  {
    key: 'Gateway',
    label: i18n.global.t('pageNetwork.table.gateway'),
  },
  {
    key: 'SubnetMask',
    label: i18n.global.t('pageNetwork.table.subnet'),
  },
  {
    key: 'AddressOrigin',
    label: i18n.global.t('pageNetwork.table.addressOrigin'),
  },
  { key: 'actions', label: '', tdClass: 'text-right' },
]);

onBeforeMount(() => {
  getIpv4TableItems();
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

const dhcpEnabledState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .dhcpEnabled;
  },
  set(newValue) {
    return newValue;
  },
});

// Watch for change in tab index
watch(
  () => props.tabIndex,
  () => {
    getIpv4TableItems();
  },
);

watch(network, () => {
  getIpv4TableItems();
});

const getIpv4TableItems = () => {
  const index = props.tabIndex;
  const addresses = network.value[index].ipv4 || [];
  form.value.ipv4TableItems = addresses.map((ipv4) => {
    return {
      Address: ipv4.Address,
      SubnetMask: ipv4.SubnetMask,
      Gateway: ipv4.Gateway,
      AddressOrigin: ipv4.AddressOrigin,
      actions: [
        {
          value: 'edit',
          enabled:
            ipv4.AddressOrigin !== 'IPv4LinkLocal' &&
            ipv4.AddressOrigin !== 'DHCP',
          title: i18n.global.t('pageNetwork.table.editIpv4'),
        },
        {
          value: 'delete',
          enabled:
            ipv4.AddressOrigin !== 'IPv4LinkLocal' &&
            ipv4.AddressOrigin !== 'DHCP',
          title: i18n.global.t('pageNetwork.table.deleteIpv4'),
        },
      ],
    };
  });
};

const onIpv4TableAction = (action, $event, item) => {
  if (!isTablesDisabled.value) {
    if ($event === 'edit') {
      eventBus.emit('edit-address', item);
      initIpv4Modal();
    }
    if ($event === 'delete') {
      openDeleteIpv4TableRowModal(item);
    }
  }
};

const openDeleteIpv4TableRowModal = (item) => {
  const newIpv4Array = form.value.ipv4TableItems
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

  modalValue.value = 'DeleteIpv4TableRow';

  modalPayload.value.newIpv4Array = newIpv4Array;

  modalMessage.value = i18n.global.t('pageNetwork.modal.confirmDeleteIpv4', {
    address: addressIp,
  });

  modalOptions.value.title = i18n.global.t('pageNetwork.modal.deleteIpv4');
  modalOptions.value.okVariant = 'danger';
  modalOptions.value.okTitle = i18n.global.t('global.action.delete');
  modalOptions.value.cancelTitle = i18n.global.t('global.action.cancel');

  openModal.value = true;
};

const initIpv4Modal = () => {
  eventBus.emit('modal-add-ipv4');
};

const openChangeDhcpEnabledStateModal = (state) => {
  modalValue.value = 'ChangeDhcpEnabledState';

  modalPayload.value.state = state;

  modalMessage.value = state
    ? i18n.global.t('pageNetwork.modal.confirmEnableDhcp')
    : i18n.global.t('pageNetwork.modal.confirmDisableDhcp');

  modalOptions.value.title = i18n.global.t(
    'pageNetwork.modal.dhcpConfirmTitle',
    {
      dhcpState: state
        ? i18n.global.t('global.action.enable')
        : i18n.global.t('global.action.disable'),
    },
  );
  modalOptions.value.okVariant = 'danger';
  modalOptions.value.okTitle = state
    ? i18n.global.t('global.action.enable')
    : i18n.global.t('global.action.disable');
  modalOptions.value.cancelTitle = i18n.global.t('global.action.cancel');

  openModal.value = true;
};

const operationConfirm = () => {
  if (modalValue.value === 'DeleteIpv4TableRow') {
    networkStore
      .deleteIpv4Address(modalPayload.value.newIpv4Array)
      .then((message) => {
        successToast(message);
        startLoader();
        setTimeout(() => {
          endLoader();
        }, 15000);
      })
      .catch(({ message }) => errorToast(message));
  } else if (modalValue.value === 'ChangeDhcpEnabledState') {
    networkStore
      .saveDhcpEnabledState(modalPayload.value.state)
      .then((message) => {
        successToast(message);
        startLoader();
        setTimeout(() => {
          endLoader();
        }, 15000);
      })
      .catch(({ message }) => errorToast(message));
  }
};

const operationCancel = () => {
  if (modalValue.value === 'ChangeDhcpEnabledState') {
    let onDhcpCancel = document.getElementById('dhcpSwitch');
    onDhcpCancel.checked = !modalPayload.value.state;
    // Manually refresh the checkbox in DOM
    componentKey.value += 1;
  }
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}
</style>
