<template>
  <div>
    <page-section :section-title="$t('pageNetwork.ipv6')">
      <BRow class="mb-4">
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.dhcp') }}</dt>
            <dd>
              <BFormCheckbox
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
        :items="ipv6TableItems"
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

const {
  networkSettings,
  selectedInterfaceIndex,
  isTableBusy,
  saveIpv6DhcpEnabledState,
  saveIpv6AutoConfigState,
  deleteIpv6Address,
} = useNetwork();

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

const ipv6TableFields = [
  {
    key: 'Address',
    label: i18n.global.t('pageNetwork.table.ipAddress'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'PrefixLength',
    label: i18n.global.t('pageNetwork.table.prefixLength'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'AddressOrigin',
    label: i18n.global.t('pageNetwork.table.addressOrigin'),
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

const isTablesDisabled = computed(() => {
  return isTableBusy.value;
});

const ipv6TableItems = computed(() => {
  const addresses = networkSettings.value[props.tabIndex]?.ipv6 ?? [];
  return addresses.map((ipv6) => {
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
});

const ipv6DefaultGateway = computed(() => {
  return (
    networkSettings.value[selectedInterfaceIndex.value]?.ipv6DefaultGateway ??
    ''
  );
});

const dhcpEnabledState = computed({
  get() {
    return (
      networkSettings.value[selectedInterfaceIndex.value]?.ipv6OperatingMode ===
      'Enabled'
    );
  },
  set(newValue) {
    return newValue;
  },
});

const ipv6AutoConfigState = computed({
  get() {
    return (
      networkSettings.value[selectedInterfaceIndex.value]
        ?.ipv6AutoConfigEnabled ?? false
    );
  },
  set(newValue) {
    return newValue;
  },
});

watch(
  () => ipv6TableItems.value,
  (item) => {
    if (!item.length) {
      document
        .querySelector('tr.b-table-empty-slot td[scope]')
        ?.removeAttribute('scope');
    }
  },
);

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
  const newIpv6Array = ipv6TableItems.value
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
  startLoader();
  deleteIpv6Address(modalPayload.value.newIpv6Array).finally(() => {
    setTimeout(() => {
      endLoader();
    }, 15000);
  });
};

const changeIpv6DhcpEnabledState = (state) => {
  startLoader();
  saveIpv6DhcpEnabledState(state).finally(() => {
    setTimeout(() => {
      endLoader();
    }, 15000);
  });
};

const changeIpv6AutoConfigState = (state) => {
  startLoader();
  saveIpv6AutoConfigState(state).finally(() => {
    setTimeout(() => {
      endLoader();
    }, 15000);
  });
};
</script>

<style lang="scss" scoped>
.text-right {
  text-align: right;
}
</style>
