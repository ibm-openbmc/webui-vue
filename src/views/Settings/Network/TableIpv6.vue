<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6')">
      <BRow class="mb-4">
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.dhcp') }}</dt>
            <dd>
              <BFormCheckbox
                id="dhcpIpv6Switch"
                v-model="dhcpEnabledState"
                switch
                :disabled="isTablesDisabled"
                @update:model-value="changeIpv6DhcpEnabledState"
              >
                <span v-if="dhcpEnabledState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.ipv6AutoConfig') }}</dt>
            <dd>
              <BFormCheckbox
                id="ipv6AutoConfigSwitch"
                v-model="ipv6AutoConfigState"
                switch
                :disabled="isTablesDisabled"
                @update:model-value="changeIpv6AutoConfigState"
              >
                <span v-if="ipv6AutoConfigState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <b-col lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.ipv6DefaultGateway') }}</dt>
            <dd>{{ ipv6DefaultGateway }}</dd>
          </dl>
        </b-col>
      </BRow>
      <BRow>
        <BCol class="text-right">
          <BButton
            variant="primary"
            :disabled="isTablesDisabled"
            data-test-id="add-static-ipv6"
            @click="initIpv6Modal()"
          >
            <icon-add />
            {{ $t('pageNetwork.table.addIpv6Address') }}
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
        :fields="ipv6TableFields"
        :items="form.ipv6TableItems"
        :empty-text="
          isTablesDisabled
            ? $t('global.table.loading')
            : $t('global.table.emptyMessage')
        "
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
              <icon-edit
                v-if="action.value === 'edit'"
                data-test-id="edit-static-ipv6"
              />
              <icon-trashcan
                v-if="action.value === 'delete'"
                data-test-id="delete-static-ipv6"
              />
            </template>
          </table-row-action>
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
  ipv6TableItems: [],
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

const ipv6TableFields = ref([
  {
    key: 'Address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
  },
  {
    key: 'PrefixLength',
    label: i18n.global.t('pageNetwork.table.prefixLength'),
  },
  {
    key: 'AddressOrigin',
    label: i18n.global.t('pageNetwork.table.addressOrigin'),
  },
  { key: 'actions', label: '', tdClass: 'text-right' },
]);

onBeforeMount(() => {
  getipv6TableItems();
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

const ipv6DefaultGateway = computed(() => {
  return networkStore.networkSettingsGetter[selectedInterface.value]
    .ipv6DefaultGateway;
});

const dhcpEnabledState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .ipv6OperatingMode === 'Enabled'
      ? true
      : false;
  },
  set(newValue) {
    return newValue;
  },
});

const ipv6AutoConfigState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .ipv6AutoConfigEnabled;
  },
  set(newValue) {
    return newValue;
  },
});

// Watch for change in tab index
watch(
  () => props.tabIndex,
  () => {
    getipv6TableItems();
  },
);

watch(network, () => {
  getipv6TableItems();
});

const getipv6TableItems = () => {
  const index = props.tabIndex;
  const addresses = network.value[index].ipv6 || [];
  form.value.ipv6TableItems = addresses.map((ipv6) => {
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
          title: i18n.global.t('pageNetwork.table.editIpv6'),
        },
        {
          value: 'delete',
          enabled:
            ipv6.AddressOrigin !== 'LinkLocal' &&
            ipv6.AddressOrigin !== 'DHCPv6' &&
            ipv6.AddressOrigin !== 'SLAAC',
          title: i18n.global.t('pageNetwork.table.deleteIpv6'),
        },
      ],
    };
  });
};

const onIpv6TableAction = (action, $event, item) => {
  if (!isTablesDisabled.value) {
    if ($event === 'edit') {
      eventBus.emit('edit-address', item);
      initIpv6Modal();
    }
    if ($event === 'delete') {
      openDeleteIpv6TableRowModal(item);
    }
  }
};

const openDeleteIpv6TableRowModal = (item) => {
  const newIpv6Array = form.value.ipv6TableItems
    .filter((row) => row.Address !== item.Address)
    .map((ipv6) => {
      const { Address, PrefixLength } = ipv6;
      return {
        Address,
        PrefixLength,
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

const initIpv6Modal = () => {
  eventBus.emit('modal-add-ipv6');
};

const operationConfirm = () => {
  networkStore
    .deleteIpv6Address(modalPayload.value.newIpv6Array)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};

const changeIpv6DhcpEnabledState = (state) => {
  networkStore
    .saveIpv6DhcpEnabledState(state)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};

const changeIpv6AutoConfigState = (state) => {
  networkStore
    .saveIpv6AutoConfigState(state)
    .then((success) => {
      startLoader();
      successToast(success);
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}
</style>
