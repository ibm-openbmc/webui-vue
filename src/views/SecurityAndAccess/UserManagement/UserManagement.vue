<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.userManagement')" />
    <BRow>
      <BCol xl="9" class="text-right">
        <BButton variant="link" :disabled="isBusy" @click="initModalSettings()">
          <icon-settings />
          {{ $t('pageUserManagement.accountPolicySettings') }}
        </BButton>
        <BButton
          variant="primary"
          :disabled="isBusy"
          data-test-id="userManagement-button-addUser"
          @click="initModalUser(null)"
        >
          <icon-add />
          {{ $t('pageUserManagement.addUser') }}
        </BButton>
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="9">
        <table-toolbar
          ref="toolbar"
          :selected-items-count="selectedRows.length"
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
          :busy="isBusy"
          :fields="fields"
          :items="tableItems"
          :empty-text="$t('global.table.emptyMessage')"
          @row-selected="onRowSelected($event, tableItems.length)"
        >
          <!-- Checkbox column -->
          <template #head(checkbox)>
            <BFormCheckbox
              v-model="tableHeaderCheckboxModel"
              data-test-id="userManagement-checkbox-tableHeaderCheckbox"
              :indeterminate="tableHeaderCheckboxIndeterminate"
              @change="
                onChangeHeaderCheckbox(tableRef, tableHeaderCheckboxModel)
              "
              @update:model-value="toggleAll"
            >
            </BFormCheckbox>
          </template>
          <template #cell(checkbox)="row">
            <BFormCheckbox
              v-model="userManagement.allUsers[row.index].isSelected"
              data-test-id="userManagement-checkbox-toggleSelectRow"
              @change="
                toggleSelectRowByUsername(
                  tableRef,
                  row.index,
                  userManagement.allUsers[row.index].isSelected,
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
              @click-table-action="onTableRowAction($event, item)"
            >
              <template #icon>
                <icon-edit
                  v-if="action.value === 'edit'"
                  :data-test-id="`userManagement-tableRowAction-edit-${index}`"
                />
                <icon-trashcan
                  v-if="action.value === 'delete'"
                  :data-test-id="`userManagement-tableRowAction-delete-${index}`"
                />
              </template>
            </table-row-action>
          </template>
        </BTable>
      </BCol>
    </BRow>
    <BRow>
      <BCol xl="8">
        <BButton
          v-b-toggle.collapse-role-table
          data-test-id="userManagement-button-viewPrivilegeRoleDescriptions"
          variant="link"
          class="mt-3"
        >
          <icon-chevron />
          {{ $t('pageUserManagement.viewPrivilegeRoleDescriptions') }}
        </BButton>
        <b-collapse id="collapse-role-table" class="mt-3">
          <table-roles />
        </b-collapse>
      </BCol>
    </BRow>
    <!-- Modals -->
    <modal-settings :settings="settings" @ok="saveAccountSettings" />
    <modal-user
      :user="activeUser"
      :password-requirements="passwordRequirements"
      @hidden="activeUser = null"
    />
    <BModal
      v-model="openModal"
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
import { ref, onMounted, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconSettings from '@carbon/icons-vue/es/settings/20';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import eventBus from '@/eventBus';

import ModalUser from './ModalUser.vue';
import ModalSettings from './ModalSettings.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableRoles from './TableRoles.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import stores from '@/store';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';

onBeforeRouteLeave(() => {
  hideLoader();
});

const {
  clearSelectedRows,
  toggleSelectRowByUsername,
  onRowSelected,
  onChangeHeaderCheckbox,
  selectedRowsList,
  tableHeaderCheckboxModel,
  tableHeaderCheckboxIndeterminate,
} = useTableSelectableComposable();

const userManagement = stores.UserManagementStore();
const global = stores.GlobalStore();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const toast = useToastComposable();
const isAllSelected = ref(false);
const isBusy = ref(true);
const activeUser = ref(null);
const openModal = ref(false);
const okTitle = ref('');
const deleteTitle = ref('');
const deleteType = ref('');
const deleteMessage = ref('');
const fields = ref([
  {
    key: 'checkbox',
  },
  {
    key: 'username',
    label: i18n.global.t('pageUserManagement.table.username'),
  },
  {
    key: 'privilege',
    label: i18n.global.t('pageUserManagement.table.privilege'),
  },
  {
    key: 'status',
    label: i18n.global.t('pageUserManagement.table.status'),
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
  {
    value: 'enable',
    label: i18n.global.t('global.action.enable'),
  },
  {
    value: 'disable',
    label: i18n.global.t('global.action.disable'),
  },
]);
const selectedRows = ref(selectedRowsList);
const tableRef = ref(null);
const userToDelete = ref('');
onBeforeMount(() => {
  eventBus.on('clear-selected', () => {
    userManagement?.allUsersGetter?.map((singleConnection) => {
      singleConnection.isSelected = false;
    });
    clearSelectedRows(tableRef);
  });
  eventBus.on('okUser', handleOkUser);
});

const handleOkUser = ({ isNewUser, userData }) => {
  saveUser({ isNewUser, userData });
};

onBeforeUnmount(() => {
  eventBus.off('okUser', handleOkUser);
});

const accountRoles = computed(() => {
  return userManagement.accountRolesGetter;
});
const allUsers = computed(() => {
  return userManagement.allUsersGetter.map((user) => {
    // Changing users' description with redfish role description
    const userDescription = accountRoles.value.filter((role) =>
      user.RoleId.includes(role),
    )[0];

    if (userDescription) user.Description = userDescription;

    return user;
  });
});
const currentUser = computed(() => {
  return userManagement.currentUserGetter;
});
const tableItems = computed(() => {
  // transform user data to table data
  return allUsers.value.map((user) => {
    return {
      username: user.UserName,
      privilege:
        user.Description === 'Administrator'
          ? i18n.global.t('pageUserManagement.table.administrator')
          : user.Description === 'ReadOnly'
            ? i18n.global.t('pageUserManagement.table.readOnly')
            : user.Description === 'ServiceAgent'
              ? i18n.global.t('pageUserManagement.table.serviceAgent')
              : user.Description,
      status: user.Locked
        ? i18n.global.t('global.status.locked')
        : user.Enabled
          ? i18n.global.t('global.status.enabled')
          : i18n.global.t('global.status.disabled'),
      actions: [
        {
          value: 'edit',
          enabled: true,
        },
        {
          value: 'delete',
          enabled: user.RoleId !== 'OemIBMServiceAgent',
        },
      ],
      ...user,
    };
  });
});
const settings = computed(() => {
  return userManagement.accountSettingsGetter;
});
const passwordRequirements = computed(() => {
  if (activeUser.value?.AccountTypes?.includes('IPMI')) {
    return {
      minLength: 8,
      maxLength: 20,
    };
  } else {
    return userManagement.accountPasswordRequirementsGetter;
  }
});

onBeforeMount(() => {
  startLoader();
  userManagement.getAccountSettings();
  Promise.all([
    userManagement.getAccountRoles(),
    userManagement.getUsers(),
  ]).finally(() => {
    endLoader();
    isBusy.value = false;
  });
});

function toggleAll(checked) {
  userManagement?.allUsers?.map((singleUser) => {
    singleUser.isSelected = checked;
  });
  isAllSelected.value = checked;
}
function initModalUser(user) {
  activeUser.value = user;
  eventBus.emit('modal-user');
}
function initModalDelete(user) {
  userToDelete.value = user;
  openModal.value = true;
  okTitle.value = i18n.global.t('pageUserManagement.deleteUser');
  deleteMessage.value = i18n.global.t(
    'pageUserManagement.modal.deleteConfirmMessage',
    {
      user: user.username,
    },
  );
  deleteTitle.value = i18n.global.t('pageUserManagement.deleteUser');
  deleteType.value = 'singleEntry';
}
function handleOk(value) {
  if (value === 'singleEntry') {
    deleteUser(userToDelete.value);
  } else {
    startLoader();
    userManagement
      .deleteUsers(selectedRows.value)
      .then((messages) => {
        messages.forEach(({ type, message }) => {
          if (type === 'success') toast.successToast(message);
          if (type === 'error') toast.errorToast(message);
        });
      })
      .finally(() => {
        endLoader();
        openModal.value = false;
        eventBus.emit('clear-selected');
      });
  }
}
function initModalSettings() {
  eventBus.emit('modal-settings');
}
function saveUser({ isNewUser, userData }) {
  if (isNewUser !== undefined && userData !== undefined) {
    startLoader();
    if (isNewUser) {
      userManagement
        .createUser(userData)
        .then((success) => toast.successToast(success))
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
    } else {
      userManagement
        .updateUserfromUserManagement(userData)
        .then((success) => toast.successToast(success))
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
    }
  }
}
function deleteUser({ username }) {
  startLoader();
  userManagement
    .deleteUser(username)
    .then((success) => toast.successToast(success))
    .catch(({ message }) => toast.errorToast(message))
    .finally(() => {
      endLoader();
      openModal.value = false;
      userToDelete.value = '';
      eventBus.emit('clear-selected');
    });
}
function onBatchAction(action) {
  switch (action) {
    case 'delete':
      openModal.value = true;
      okTitle.value = i18n.global.t(
        'pageUserManagement.deleteUser',
        selectedRows.value.length,
      );
      deleteMessage.value = i18n.global.t(
        'pageUserManagement.modal.batchDeleteConfirmMessage',
        selectedRows.value.length,
      );
      deleteTitle.value = i18n.global.t(
        'pageUserManagement.deleteUser',
        selectedRows.value.length,
      );
      deleteType.value = 'selectedEntries';
      break;
    case 'enable':
      startLoader();
      userManagement
        .enableUsers(selectedRows.value)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') toast.successToast(message);
            if (type === 'error') toast.errorToast(message);
          });
        })
        .finally(() => {
          endLoader();
          eventBus.emit('clear-selected');
        });
      break;
    case 'disable':
      startLoader();
      userManagement
        .disableUsers(selectedRows.value)
        .then((messages) => {
          messages.forEach(({ type, message }) => {
            if (type === 'success') toast.successToast(message);
            if (type === 'error') toast.errorToast(message);
          });
        })
        .finally(() => {
          endLoader();
          eventBus.emit('clear-selected');
        });
      break;
  }
}
function onTableRowAction(action, row) {
  switch (action) {
    case 'edit':
      initModalUser(row);
      break;
    case 'delete':
      initModalDelete(row);
      break;
    default:
      break;
  }
}
function saveAccountSettings(settings) {
  startLoader();
  isBusy.value = true;
  userManagement
    .saveAccountSettings(settings)
    .then((message) => toast.successToast(message))
    .catch(({ message }) => toast.errorToast(message))
    .finally(() => {
      endLoader();
      isBusy.value = false;
    });
}
</script>

<style lang="scss" scoped>
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
.text-right {
  text-align: right;
}
</style>
