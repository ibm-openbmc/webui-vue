<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.snmpAlerts')"
      :description="$t('pageSnmpAlerts.pageDescription')"
    />
    <BRow>
      <BCol xl="9" class="text-right">
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
          @clear-selected="clearSelectedRows($refs.table)"
          @batch-action="onBatchAction"
        />
        <BTable
          ref="table"
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
              @change="onChangeHeaderCheckbox($refs.table)"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="row.rowSelected"
              :data-test-id="`snmpAlerts-checkbox-selectRow-${row.index}`"
              @change="toggleSelectRow($refs.table, row.index)"
            >
              <span class="sr-only">{{ $t('global.table.selectItem') }}</span>
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
    <!-- <modal-add-destination @ok="onModalOk" /> -->
  </BContainer>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import i18n from '@/i18n';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
// import ModalAddDestination from './ModalAddDestination.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import { SnmpAlertsStore } from '../../../store';
  
  const { startLoader, endLoader, hideLoader } = useLoadingBar();
  const { successToast, errorToast } = useToastComposable();
  const {
    selectedRowsList,
    tableHeaderCheckboxModel,
    tableHeaderCheckboxIndeterminate,
  } = useTableSelectableComposable();
  const snmpAlertsStore = SnmpAlertsStore();

  onBeforeRouteLeave (() => {
    hideLoader();
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
          tdClass: 'text-right text-nowrap',
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
  const tableHeaderCheckboxIndeterminateValue = ref(tableHeaderCheckboxIndeterminate);

  const allSnmpDetails = computed(() => {
      return snmpAlertsStore.allSnmpDetailsGetter;
    })
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
    })
  onMounted(() => {
    startLoader();
    snmpAlertsStore.getSnmpDetails().finally(() => endLoader());
  })
  const onModalOk = ({ ipAddress, port }) => {
      const protocolIpAddress = 'snmp://' + ipAddress;
      const destination = port
        ? protocolIpAddress + ':' + port
        : protocolIpAddress;
      const data = {
        Destination: destination,
        SubscriptionType: 'SNMPTrap',
        DeliveryRetryPolicy: 'TerminateAfterRetries',
        Protocol: 'SNMPv2c',
      };
      startLoader();
      snmpAlertsStore.addDestination({ data })
        .then((success) => successToast(success))
        .catch(({ message }) => errorToast(message))
        .finally(() => endLoader());
    }
  const initModalAddDestination = () => {
      this.$bvModal.show('add-destination');
    }
  const initModalDeleteDestination = (destination) => {
      this.$bvModal
        .msgBoxConfirm(
          i18n.global.t('pageSnmpAlerts.modal.deleteConfirmMessage', {
            destination: destination.id,
          }),
          {
            title: i18n.global.t('pageSnmpAlerts.modal.deleteSnmpDestinationTitle'),
            okTitle: i18n.global.t('pageSnmpAlerts.deleteDestination'),
            cancelTitle: i18n.global.t('global.action.cancel'),
          },
        )
        .then((deleteConfirmed) => {
          if (deleteConfirmed) {
            deleteDestination(destination);
          }
        });
    }
  const deleteDestination = ({ id }) => {
      startLoader();
      snmpAlertsStore.deleteDestination(id)
        .then((success) => successToast(success))
        .catch(({ message }) => errorToast(message))
        .finally(() => endLoader());
    }
  const onBatchAction = (action) => {
      if (action === 'delete') {
        this.$bvModal
          .msgBoxConfirm(
            i18n.global.t(
              'pageSnmpAlerts.modal.batchDeleteConfirmMessage',
              selectedRowsValue.value.length,
            ),
            {
              title: i18n.global.t(
                'pageSnmpAlerts.modal.deleteSnmpDestinationTitle',
                selectedRowsValue.value.length,
              ),
              okTitle: i18n.global.t(
                'pageSnmpAlerts.deleteDestination',
                selectedRowsValue.value.length,
              ),
              cancelTitle: i18n.global.t('global.action.cancel'),
            },
          )
          .then((deleteConfirmed) => {
            if (deleteConfirmed) {
              startLoader();
              snmpAlertsStore.deleteMultipleDestinations(selectedRowsValue.value)
                .then((messages) => {
                  messages.forEach(({ type, message }) => {
                    if (type === 'success') successToast(message);
                    if (type === 'error') errorToast(message);
                  });
                })
                .finally(() => endLoader());
            }
          });
      }
    }
  const onTableRowAction = (action, row) => {
      if (action === 'delete') {
        initModalDeleteDestination(row);
      }
    }
</script>
<style scoped>
.text-right {
  text-align: right;
}
</style>
