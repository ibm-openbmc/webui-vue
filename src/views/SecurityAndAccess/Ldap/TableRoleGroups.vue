<template>
  <div>
    <BRow>
      <BCol md="9">
        <alert :show="isServiceEnabled === false" variant="info">
          {{ $t('pageLdap.tableRoleGroups.alertContent') }}
        </alert>
      </BCol>
    </BRow>
    <BRow>
      <BCol class="text-right" md="9">
        <BButton
          variant="primary"
          :disabled="!isServiceEnabled"
          @click="initRoleGroupModal(null)"
        >
          <icon-add />
          {{ $t('pageLdap.addRoleGroup') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="9">
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRowsList.length"
          :actions="batchActions"
          :table="tableRef"
          @clear-selected="clearSelectedRows(tableRef)"
          @batch-action="onBatchAction"
        />
        <BTable
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
            <BFormCheckbox
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
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              :model-value="selectedSessions.has(row.item.groupName)"
              aria-label="checkbox"
              :disabled="!isServiceEnabled"
              @update:model-value="
                (checked) => {
                  if (checked) {
                    selectedSessions.add(row.item.groupName);
                  } else {
                    selectedSessions.delete(row.item.groupName);
                  }
                  toggleSelectRowByGroupName(
                    tableRef,
                    row.index,
                    checked,
                    row.item,
                  );
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
        </BTable>
      </BCol>
    </BRow>
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
import { ref, computed, watch, onBeforeMount, onMounted, nextTick } from 'vue';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import Alert from '@/components/Global/Alert.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import ModalAddRoleGroup from './ModalAddRoleGroup.vue';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import { useLdap } from '@/api/composables/useLdap';
import stores from '@/store';
import i18n from '@/i18n';
import eventBus from '@/eventBus';

const { startLoader, endLoader } = useLoadingBar();

const {
  clearSelectedRows,
  toggleSelectRowByGroupName,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
  onChangeHeaderCheckbox,
  onRowSelected,
} = useTableSelectableComposable();

const userManagementStore = stores.UserManagementStore();

const {
  isServiceEnabled,
  enabledRoleGroups,
  isLoading,
  isFetching,
  addNewRoleGroup,
  saveRoleGroup: saveRoleGroupApi,
  deleteRoleGroup: deleteRoleGroupApi,
} = useLdap();

// Track selection state separately
const selectedSessions = ref(new Set());

const deleteModal = ref(false);
const deleteModalContent = ref('');
const batchModal = ref(false);
const tableRef = ref(null);
const isAllSelected = ref(false);
const selectedRowsNo = ref(0);
const count = ref(0);
const activeRoleGroup = ref(null);

const fields = ref([
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

const batchActions = ref([
  {
    value: 'delete',
    label: i18n.global.t('global.action.delete'),
  },
]);

onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    selectedSessions.value.clear();
    clearSelectedRows(tableRef);
  });
});

onMounted(() => {
  userManagementStore.getAccountRoles();
});

const isBusy = computed(() => isLoading.value || isFetching.value);

const tableItems = computed(() => {
  return enabledRoleGroups.value.map(({ LocalRole, RemoteGroup }) => ({
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
  }));
});

function onBatchAction() {
  selectedRowsNo.value = selectedRowsList.value.length;
  count.value = selectedRowsNo.value;
  batchModal.value = true;
}

function toggleAll(checked) {
  if (checked) {
    tableItems.value.forEach((item) => {
      selectedSessions.value.add(item.groupName);
    });
  } else {
    selectedSessions.value.clear();
  }
  isAllSelected.value = checked;
}

function onModalDeleteBatch(deleteConfirmed) {
  if (deleteConfirmed) {
    startLoader();
    deleteRoleGroupApi({
      roleGroups: selectedRowsList.value.map((row) => ({
        groupName: row.groupName,
      })),
    })
      .then(() => {
        eventBus.emit('clear-selected');
      })
      .finally(() => endLoader());
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

function onModalCancel() {
  deleteModal.value = false;
}

function onModalHide() {
  deleteModal.value = false;
}

function onModalDelete(deleteConfirmed) {
  if (deleteConfirmed) {
    startLoader();
    deleteRoleGroupApi({
      roleGroups: [{ groupName: activeRoleGroup.value.groupName }],
    })
      .then(() => {
        eventBus.emit('clear-selected');
      })
      .finally(() => endLoader());
  }
}

watch(
  () => tableItems.value,
  () => {
    nextTick(() => {
      document
        .querySelectorAll('.b-table-sortable-column svg')
        .forEach((svg) => {
          svg.setAttribute('aria-hidden', 'true');
        });
      if (!tableItems.value.length) {
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
  eventBus.emit('modal-role-group');
}

function saveRoleGroup({
  addNew,
  groupNamePreviously,
  groupName,
  groupPrivilege,
}) {
  activeRoleGroup.value = null;
  startLoader();

  if (addNew) {
    addNewRoleGroup({ groupName, groupPrivilege }).finally(() => endLoader());
  } else {
    saveRoleGroupApi({
      groupNamePreviously,
      groupName,
      groupPrivilege,
    }).finally(() => endLoader());
  }
}
</script>

<style scoped>
.text-right {
  text-align: right !important;
}
</style>
