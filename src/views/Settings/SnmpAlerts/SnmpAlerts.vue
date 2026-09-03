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
          :table="tableRef"
          :selected-items-count="selectedRowsList.length"
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
          @row-selected="onRowSelected($event, tableItems.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckbox"
              aria-label="checkbox-head"
              data-test-id="snmpAlerts-checkbox-selectAll"
              :indeterminate="tableHeaderCheckboxIndeterminated"
              @change="onChangeHeaderCheckbox(tableRef, tableHeaderCheckbox)"
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              :model-value="row.item.isSelected"
              aria-label="checkbox"
              :data-test-id="`snmpAlerts-checkbox-selectRow-${row.index}`"
              @update:model-value="
                (checked) => {
                  if (checked) {
                    selectedSnmpAlerts.add(row.item.id);
                  } else {
                    selectedSnmpAlerts.delete(row.item.id);
                  }
                  toggleSelectRow(tableRef, row.index, checked, row.item);
                }
              "
            >
              <span class="visually-hidden">checkbox</span>
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
          <template #empty>
            <span v-if="isBusy">
              {{ $t('global.table.loading') }}
            </span>
            <span v-else>
              {{ $t('global.table.emptyMessage') }}
            </span>
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
import { ref, computed, onBeforeMount, watch, nextTick } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import i18n from '@/i18n';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import ModalAddDestination from './ModalAddDestination.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import { useSnmpAlerts } from '@/api/composables/useSnmpAlerts';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import eventBus from '@/eventBus';

const { successToast, errorToast } = useToastComposable();
const {
  clearSelectedRows,
  toggleSelectRow,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();

const {
  snmpAlerts: snmpAlertsFromQuery,
  isLoading: isSnmpAlertsLoading,
  isFetching: isSnmpAlertsFetching,
  isError,
  addDestination,
  deleteDestination,
  deleteMultipleDestinations,
  refetch: refetchSnmpAlerts,
} = useSnmpAlerts();

const { startLoader, endLoader } = usePageLoadingBar(
  isSnmpAlertsFetching,
  isError,
);

defineExpose({
  refetch: refetchSnmpAlerts,
});

// Track selection state separately to avoid circular dependencies
const selectedSnmpAlerts = ref(new Set());

// Computed property that merges SNMP data with selection state
const snmpAlertsData = computed(() => {
  if (!snmpAlertsFromQuery.value) {
    return [];
  }

  return snmpAlertsFromQuery.value.map((alert) => ({
    ...alert,
    isSelected: selectedSnmpAlerts.value.has(alert.id),
  }));
});

const snmpToDelete = ref(null);
const openDeleteModal = ref(false);
const okTitle = ref('');
const deleteTitle = ref('');
const deleteType = ref('');
const deleteMessage = ref('');
const tableRef = ref(null);
const isAllSelected = ref(false);
const isBusy = computed(() => isSnmpAlertsLoading.value);
const tableHeaderCheckbox = ref(tableHeaderCheckboxModel);
const tableHeaderCheckboxIndeterminated = ref(tableHeaderCheckboxIndeterminate);

const fields = ref([
  {
    key: 'checkbox',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'ip',
    label: i18n.global.t('pageSnmpAlerts.table.ipaddress'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'port',
    label: i18n.global.t('pageSnmpAlerts.table.port'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    label: '',
    tdClass: 'text-end text-nowrap',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

const tableToolbarActions = ref([
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);

const tableItems = computed(() => {
  return snmpAlertsData.value.map((alert) => ({
    ...alert,
    actions: [
      {
        value: 'delete',
        enabled: true,
        title: i18n.global.t('pageSnmpAlerts.deleteDestination'),
      },
    ],
  }));
});

onBeforeRouteLeave(() => {
  eventBus.emit('clear-selected');
});

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    selectedSnmpAlerts.value.clear();
    clearSelectedRows(tableRef);
  });
});

watch(
  () => tableItems.value,
  () => {
    nextTick(() => {
      if (!tableItems.value.length) {
        document
          .querySelector('tr.b-table-empty-slot td[scope]')
          ?.removeAttribute('scope');
      }
    });
  },
  { deep: true },
);

const onModalOk = async ({ ipAddress, port }) => {
  const protocolIpAddress = 'snmp://' + ipAddress;
  const destination = port ? protocolIpAddress + ':' + port : protocolIpAddress;
  const data = {
    Destination: destination,
    SubscriptionType: 'SNMPTrap',
    Protocol: 'SNMPv2c',
  };

  startLoader();
  try {
    await addDestination(data);
    successToast(i18n.global.t('pageSnmpAlerts.toast.successAddDestination'));
  } catch (error) {
    errorToast(i18n.global.t('pageSnmpAlerts.toast.errorAddDestination'));
  } finally {
    endLoader();
  }
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

const handleOk = async (value) => {
  if (value === 'singleEntry') {
    await deleteSingleDestination(snmpToDelete.value);
  } else {
    startLoader();
    try {
      const result = await deleteMultipleDestinations(selectedRowsList.value);

      if (result.successCount > 0) {
        successToast(
          i18n.global.t(
            'pageSnmpAlerts.toast.successBatchDelete',
            result.successCount,
          ),
        );
      }
      if (result.errorCount > 0) {
        errorToast(
          i18n.global.t(
            'pageSnmpAlerts.toast.errorBatchDelete',
            result.errorCount,
          ),
        );
      }
    } catch (error) {
      errorToast(i18n.global.t('pageSnmpAlerts.toast.errorBatchDelete'));
    } finally {
      openDeleteModal.value = false;
      // Clear selection and reset header checkbox after batch deletion
      clearSelectedRows(tableRef);
      eventBus.emit('clear-selected');
      endLoader();
    }
  }
};

const deleteSingleDestination = async ({ id }) => {
  startLoader();
  try {
    await deleteDestination(id);
    successToast(
      i18n.global.t('pageSnmpAlerts.toast.successDeleteDestination', { id }),
    );
  } catch (error) {
    errorToast(i18n.global.t('pageSnmpAlerts.toast.errorDeleteDestination'));
  } finally {
    openDeleteModal.value = false;
    snmpToDelete.value = null;
    eventBus.emit('clear-selected');
    endLoader();
  }
};

const onBatchAction = (action) => {
  if (action === 'delete') {
    openDeleteModal.value = true;
    okTitle.value = i18n.global.t(
      'pageSnmpAlerts.deleteDestination',
      selectedRowsList.value.length,
    );
    deleteMessage.value = i18n.global.t(
      'pageSnmpAlerts.modal.batchDeleteConfirmMessage',
      selectedRowsList.value.length,
    );
    deleteTitle.value = i18n.global.t(
      'pageSnmpAlerts.modal.deleteSnmpDestinationTitle',
      selectedRowsList.value.length,
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
  if (checked) {
    snmpAlertsData.value.forEach((alert) => {
      selectedSnmpAlerts.value.add(alert.id);
    });
  } else {
    selectedSnmpAlerts.value.clear();
  }
  isAllSelected.value = checked;
};
</script>
