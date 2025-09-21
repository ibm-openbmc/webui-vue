<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.snmpAlerts')"
      :description="$t('pageSnmpAlerts.pageDescription')"
    />
    <BRow>
      <BCol xl="9" class="text-end">
        <BButton variant="primary" @click="initModalAddDestination">
          <icon-add />
          {{ $t('pageSnmpAlerts.addDestination') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="9">
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsValue.length"
          :actions="tableToolbarActions"
          @clear-selected="clearSelectedRows(tableRef)"
          @batch-action="onBatchAction"
        />
        <BTable
          ref="tableRef"
          responsive="md"
          selectable
          show-empty
          no-select-on-click
          sticky-header="75vh"
          hover
          :fields="fields"
          :items="tableItems"
          :empty-text="$t('global.table.emptyMessage')"
          @row-selected="onRowSelected($event, tableItems.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckboxModelValue"
              data-test-id="snmpAlerts-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminateValue"
              @change="
                onChangeHeaderCheckbox(tableRef, tableHeaderCheckboxModel)
              "
              @update:model-value="toggleAll"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="
                snmpAlertsStore.allSnmpDetailsGetter[row.index].isSelected
              "
              :data-test-id="`snmpAlerts-checkbox-selectRow-${row.index}`"
              @change="
                toggleSelectRowByIpAddress(
                  tableRef,
                  row.index,
                  snmpAlertsStore.allSnmpDetailsGetter[row.index].isSelected,
                  row.item,
                )
              "
            >
            </BFormCheckbox>
          </template>
          <!-- table actions column -->
          <template #cell(actions)="{ item }">
            <table-row-action
              v-for="(action, index) in item.actions"
              :key="index"
              :value="action.value"
              :enabled="action.enabled"
              :title="action.title"
              :data-test-id="`snmpAlerts-button-deleteRow-${item.index}`"
              @click-table-action="onTableRowAction($event, item)"
            >
              <template #icon>
                <icon-trashcan v-if="action.value === 'delete'" />
              </template>
            </table-row-action>
          </template>
        </BTable>
      </BCol>
    </BRow>
    <!-- Modals -->
    <modal-add-destination @ok="onModalOk" />
    <BModal
      v-model="openDeleteModal"
      :title="deleteTitle"
      :ok-title="okTitle"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOk(deleteType)"
    >
      <p>
        {{ deleteMessage }}
      </p>
    </BModal>
  </BContainer>
</template>
<script setup>
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import i18n from '@/i18n';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import ModalAddDestination from './ModalAddDestination.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import stores from '../../../store';
import eventBus from '@/eventBus';

const snmpToDelete = ref('');
const openDeleteModal = ref(false);
const okTitle = ref('');
const deleteTitle = ref('');
const deleteType = ref('');
const deleteMessage = ref('');
const tableRef = ref(null);
const isAllSelected = ref(false);
const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, errorToast } = useToastComposable();
const {
  clearSelectedRows,
  toggleSelectRowByIpAddress,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();
const snmpAlertsStore = stores.SnmpAlertsStore();

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    snmpAlertsStore?.allSnmpDetailsGetter?.map((singleConnection) => {
      singleConnection.isSelected = false;
    });
    clearSelectedRows(tableRef);
  });
});

const fields = ref([
  {
    key: 'checkbox',
  },
  {
    key: 'ip',
    label: i18n.global.t('pageSnmpAlerts.table.ipaddress'),
  },
  {
    key: 'port',
    label: i18n.global.t('pageSnmpAlerts.table.port'),
  },
  {
    key: 'actions',
    label: '',
    tdClass: 'text-end text-nowrap',
  },
]);
const tableToolbarActions = ref([
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);
const selectedRowsValue = ref(selectedRowsList);
const tableHeaderCheckboxModelValue = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminateValue = ref(
  tableHeaderCheckboxIndeterminate,
);

const allSnmpDetails = computed(() => {
  return snmpAlertsStore.allSnmpDetailsGetter;
});
const tableItems = computed(() => {
  // transform destination data to table data
  return allSnmpDetails.value.map((subscriptions) => {
    const [destination, dataWithProtocol, dataWithoutProtocol] = [
      subscriptions.Destination,
      subscriptions.Destination.split('/')[2].split(':'),
      subscriptions.Destination.split(':'),
    ];
    //condition to check if destination comes with protocol or not
    const conditionForProtocolCheck = destination.includes('://');
    const ip = conditionForProtocolCheck
      ? dataWithProtocol[0]
      : dataWithoutProtocol[0];
    const port = conditionForProtocolCheck
      ? dataWithProtocol[1]
      : dataWithoutProtocol[1];
    return {
      ip: ip,
      port: port,
      id: subscriptions.Id,
      actions: [
        {
          value: 'delete',
          enabled: true,
          title: i18n.global.t('pageSnmpAlerts.deleteDestination'),
        },
      ],
      ...subscriptions,
    };
  });
});
onMounted(() => {
  startLoader();
  snmpAlertsStore.getSnmpDetails().finally(() => endLoader());
});
const onModalOk = ({ ipAddress, port }) => {
  const protocolIpAddress = 'snmp://' + ipAddress;
  const destination = port ? protocolIpAddress + ':' + port : protocolIpAddress;
  const data = {
    Destination: destination,
    SubscriptionType: 'SNMPTrap',
    Protocol: 'SNMPv2c',
  };
  startLoader();
  snmpAlertsStore
    .addDestination({ data })
    .then((success) => successToast(success))
    .catch(({ message }) => errorToast(message))
    .finally(() => endLoader());
};
const initModalAddDestination = () => {
  eventBus.emit('add-destination');
};
const initModalDeleteDestination = (destination) => {
  snmpToDelete.value = destination;
  openDeleteModal.value = true;
  okTitle.value = i18n.global.t('pageSnmpAlerts.deleteDestination');
  deleteMessage.value = i18n.global.t(
    'pageSnmpAlerts.modal.deleteConfirmMessage',
    {
      destination: destination.id,
    },
  );
  deleteTitle.value = i18n.global.t(
    'pageSnmpAlerts.modal.deleteSnmpDestinationTitle',
  );
  deleteType.value = 'singleEntry';
};
const handleOk = (value) => {
  if (value === 'singleEntry') {
    deleteDestination(snmpToDelete.value);
  } else {
    startLoader();
    snmpAlertsStore
      .deleteMultipleDestinations(selectedRowsValue.value)
      .then((messages) => {
        messages.forEach(({ type, message }) => {
          if (type === 'success') successToast(message);
          if (type === 'error') errorToast(message);
        });
      })
      .finally(() => {
        openDeleteModal.value = false;
        eventBus.emit('clear-selected');
        endLoader();
      });
  }
};
const deleteDestination = ({ id }) => {
  startLoader();
  snmpAlertsStore
    .deleteDestination(id)
    .then((success) => successToast(success))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      openDeleteModal.value = false;
      snmpToDelete.value = '';
      endLoader();
    });
};
const onBatchAction = (action) => {
  if (action === 'delete') {
    openDeleteModal.value = true;
    okTitle.value = i18n.global.t(
      'pageSnmpAlerts.deleteDestination',
      selectedRowsValue.value.length,
    );
    deleteMessage.value = i18n.global.t(
      'pageSnmpAlerts.modal.batchDeleteConfirmMessage',
      selectedRowsValue.value.length,
    );
    deleteTitle.value = i18n.global.t(
      'pageSnmpAlerts.modal.deleteSnmpDestinationTitle',
      selectedRowsValue.value.length,
    );
    deleteType.value = 'selectedEntries';
  }
};
const onTableRowAction = (action, row) => {
  if (action === 'delete') {
    initModalDeleteDestination(row);
  }
};
const toggleAll = (checked) => {
  snmpAlertsStore?.allSnmpDetailsGetter?.map((singleConnection) => {
    singleConnection.isSelected = checked;
  });
  isAllSelected.value = checked;
};
</script>
