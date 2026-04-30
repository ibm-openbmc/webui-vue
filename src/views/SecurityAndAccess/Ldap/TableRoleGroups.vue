<template>
  <div>
    <b-row>
      <b-col md="9">
        <alert :show="isServiceEnabled === false" variant="info">
          {{ $t('pageLdap.tableRoleGroups.alertContent') }}
        </alert>
      </b-col>
    </b-row>
    <b-row>
      <b-col class="text-right" md="9">
        <b-button
          variant="primary"
          :disabled="!isServiceEnabled"
          @click="initRoleGroupModal(null)"
        >
          <icon-add />
          {{ $t('pageLdap.addRoleGroup') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col md="9">
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsList.length"
          :actions="batchActions"
          :table="tableRef"
          @clear-selected="clearSelectedRows(tableRef)"
          @batch-action="onBatchAction"
        />
        <b-table
          ref="tableRef"
          responsive
          selectable
          show-empty
          sticky-header="75vh"
          no-select-on-click
          hover
          no-sort-reset
          sort-icon-left
          :items="tableItems"
          :fields="fields"
          @row-selected="onRowSelected($event, tableItems.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <b-form-checkbox
              v-model="tableHeaderCheckboxModel"
              aria-label="checkbox-head"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              :disabled="!isServiceEnabled"
              @change="
                onChangeHeaderCheckbox(tableRef, tableHeaderCheckboxModel)
              "
              @update:model-value="toggleAll"
            >
              <span class="visually-hidden">checkbox-head</span>
            </b-form-checkbox>
          </template>
          <template #cell(checkbox)="row">
            <b-form-checkbox
              v-model="ldapStore.enabledRoleGroups[row.index].isSelected"
              aria-label="checkbox"
              :disabled="!isServiceEnabled"
              @change="
                toggleSelectRowByGroupName(
                  tableRef,
                  row.index,
                  ldapStore.enabledRoleGroups[row.index].isSelected,
                  row.item,
                )
              "
            >
              <span class="visually-hidden">checkbox-head</span>
            </b-form-checkbox>
          </template>

          <!-- table actions column -->
          <template #cell(actions)="{ item }">
            <table-row-action
              v-for="(action, index) in item.actions"
              :key="index"
              :value="action.value"
              :enabled="action.enabled"
              :title="action.title"
              @click-table-action="onTableRowAction($event, item)"
            >
              <template #icon>
                <icon-edit
                  v-if="action.value === 'edit'"
                  :title="$t('pageLdap.modal.editRoleGroup')"
                />
                <icon-trashcan
                  v-if="action.value === 'delete'"
                  :title="$t('pageLdap.modal.deleteRoleGroup')"
                />
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
        </b-table>
      </b-col>
    </b-row>
    <modal-add-role-group
      :role-group="activeRoleGroup"
      @ok="saveRoleGroup"
      @hidden="activeRoleGroup = null"
    />
  </div>
  <BModal
    ref="myModalRef"
    v-model="deleteModal"
    :title="$t('pageLdap.modal.deleteRoleGroup')"
    :cancel-title="$t('global.action.cancel')"
    :ok-title="$t('global.action.delete')"
    @cancel="onModalCancel"
    @ok="onModalDelete"
    @hide="onModalHide"
  >
    {{
      $t('pageLdap.modal.deleteRoleGroupConfirmMessage', {
        groupName: deleteModalContent,
      })
    }}
  </BModal>
  <BModal
    v-model="batchModal"
    :title="$t('pageLdap.modal.deleteRoleGroup', { count: count }, count)"
    :ok-title="$t('global.action.delete')"
    :cancel-title="$t('global.action.cancel')"
    @ok="onModalDeleteBatch"
  >
    <p>
      {{
        $t(
          'pageLdap.modal.deleteRoleGroupBatchConfirmMessage',
          { count: count },
          count,
        )
      }}
    </p>
  </BModal>
</template>

<script setup>
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import Alert from '@/components/Global/Alert.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import ModalAddRoleGroup from './ModalAddRoleGroup.vue';
import { onBeforeMount, onMounted, reactive } from 'vue';
import useTableSelectableComposable from '../../../components/Composables/useTableSelectableComposable';
import stores from '../../../store';
import { computed, ref, watch, nextTick } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useLoadingBar from '../../../components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();
const modal = ref(false);
const deleteModal = ref(false);
const deleteModalContent = ref('');
const batchModal = ref(false);
const ldapStore = stores.LdapStore();
const tableRef = ref(null);
const isAllSelected = ref(false);
const userManagementStore = stores.UserManagementStore();
const selectedRowsNo = ref(0);
const count = ref(0);
const {
  clearSelectedRows,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
  onChangeHeaderCheckbox,
  toggleSelectRowByGroupName,
  onRowSelected,
} = useTableSelectableComposable();

const isBusy = ref(true);
const activeRoleGroup = ref(null);

const fields = reactive([
  {
    key: 'checkbox',
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'groupName',
    sortable: true,
    label: i18n.global.t('pageLdap.tableRoleGroups.groupName'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'groupPrivilege',
    sortable: true,
    label: i18n.global.t('pageLdap.tableRoleGroups.groupPrivilege'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    sortable: false,
    label: '',
    tdClass: 'text-right',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);
const batchActions = reactive([
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    ldapStore?.enabledRoleGroups?.map((enabledRoleGroup) => {
      enabledRoleGroup.isSelected = false;
    });
    clearSelectedRows(tableRef);
  });
});

onMounted(() => {
  userManagementStore.getAccountRoles().finally(() => {
    isBusy.value = false;
  });
});

const isServiceEnabled = computed(() => {
  return ldapStore.isServiceEnabledGetter;
});
const enabledRoleGroups = computed(() => {
  return ldapStore.enabledRoleGroups;
});
const tableItems = computed(() => {
  return enabledRoleGroups.value.map(({ LocalRole, RemoteGroup }) => {
    return {
      groupName: RemoteGroup,
      groupPrivilege: LocalRole,
      actions: [
        {
          value: 'edit',
          enabled: isServiceEnabled.value,
        },
        {
          value: 'delete',
          enabled: isServiceEnabled.value,
        },
      ],
    };
  });
});
const deleteRoleGroupBatchConfirmMessage = computed(() =>
  i18n.global.t(
    'pageLdap.modal.deleteRoleGroupBatchConfirmMessage',
    selectedRowsList.value.length,
  ),
);

function onBatchAction() {
  selectedRowsNo.value = selectedRowsList.value.map((row) => row.uri).length;
  count.value = selectedRowsNo.value;
  batchModal.value = true;
}
function toggleAll(checked) {
  ldapStore?.enabledRoleGroups?.map((enabledRoleGroup) => {
    enabledRoleGroup.isSelected = checked;
  });
  isAllSelected.value = checked;
}
function onModalDeleteBatch(deleteConfirmed) {
  if (deleteConfirmed) {
    startLoader();

    ldapStore
      .deleteRoleGroup({
        roleGroups: selectedRowsList.value,
      })
      .then((success) => successToast(success))
      .catch(({ message }) => errorToast(message))
      .finally(() => {
        // Clear selection and reset header checkbox after batch deletion
        clearSelectedRows(tableRef);
        endLoader();
      });
  }
}
function onTableRowAction(action, row) {
  switch (action) {
    case 'edit':
      initRoleGroupModal(row);
      break;
    case 'delete':
      initModalDeleteRole(row);
      break;
  }
}
function initModalDeleteRole(roleGroup) {
  deleteModal.value = true;
  activeRoleGroup.value = roleGroup;
  deleteModalContent.value = roleGroup.groupName;
}
const onModalDelete = (deleteConfirmed) => {
  if (deleteConfirmed) {
    startLoader();
    ldapStore
      .deleteRoleGroup({ roleGroups: [activeRoleGroup.value] })
      .then((success) => successToast(success))
      .catch(({ message }) => errorToast(message))
      .finally(() => {
        // Clear selection and reset header checkbox after deletion
        clearSelectedRows(tableRef);
        endLoader();
      });
  }
};

watch(
  () => tableItems,
  (item) => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!item.length) {
        document
          .querySelector('tr.b-table-empty-slot td[scope]')
          ?.removeAttribute('scope');
      }
    });
  },
  { deep: true },
);
function initRoleGroupModal(roleGroup) {
  activeRoleGroup.value = roleGroup;
  modal.value = true;
  eventBus.emit('modal-role-group');
}
function saveRoleGroup({
  addNew,
  groupNamePreviously,
  groupName,
  groupPrivilege,
}) {
  activeRoleGroup.value = null;
  const data = { groupName, groupPrivilege };
  const saveData = { groupNamePreviously, groupName, groupPrivilege };
  startLoader();
  if (addNew) {
    ldapStore
      .addNewRoleGroup(data)
      .then((success) => successToast(success))
      .catch(({ message }) => errorToast(message))
      .finally(() => endLoader());
  } else {
    ldapStore
      .saveRoleGroup(saveData)
      .then((success) => successToast(success))
      .catch(({ message }) => errorToast(message))
      .finally(() => endLoader());
  }
}
</script>

<style scoped>
.text-right {
  text-align: right !important;
}
</style>
