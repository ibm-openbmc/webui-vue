<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.userManagement')" />
    <BRow v-if="currentUser && (isAdminUser || isServiceUser)">
      <BCol>
        <span>{{ $t('pageUserManagement.mfaTotpAuthentication') }}</span>
        <info-tooltip
          v-if="!globalMfaValue && !currentMfaBypassed"
          class="ml-1"
          :title="$t('pageUserManagement.enableMfaInfo')"
        >
        </info-tooltip>
        <BFormCheckbox
          v-if="currentUser && globalMfaValue !== null"
          id="switch"
          :key="globalMfaValue"
          ref="globalMfaRef"
          v-model="globalMfaValue"
          :disabled="isBusy"
          switch
          data-test-id="global-mfa"
          class="mt-1"
          @update:model-value="updateGlobalMfa"
        >
          <span v-if="globalMfaValue">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </BFormCheckbox>
      </BCol>
    </BRow>
    <BRow v-if="currentUser && (isAdminUser || isServiceUser)" class="mt-2">
      <BCol xl="9">
        <alert variant="info" class="mb-2">
          <div>
            {{ $t('pageUserManagement.modal.hmcWarning') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <BRow
      v-if="currentUser && isAdminUser && globalMfaValue && currentMfaBypassed"
      class="mt-2"
    >
      <BCol xl="9">
        <alert variant="warning" class="mb-4">
          <div>
            {{ $t('pageUserManagement.disableMfaBypassWarning') }}
          </div>
        </alert>
      </BCol>
    </BRow>
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
          :table="tableRef"
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
              v-model="tableHeaderCheckboxModel"
              aria-label="checkbox-head"
              data-test-id="userManagement-checkbox-tableHeaderCheckbox"
              :indeterminate="tableHeaderCheckboxIndeterminate"
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
              v-model="tableItems[row.index].isSelected"
              aria-label="checkbox"
              data-test-id="userManagement-checkbox-toggleSelectRow"
              @change="
                toggleSelectRowByUsername(
                  tableRef,
                  row.index,
                  tableItems[row.index].isSelected,
                  row.item,
                )
              "
            >
              <span class="visually-hidden">checkbox</span>
            </BFormCheckbox>
          </template>
          <template
            v-if="currentUser && (isAdminUser || isServiceUser)"
            #cell(mfa)="row"
          >
            <BFormCheckbox
              v-if="row.item.privilege !== 'Service agent'"
              v-model="row.item.mfa"
              aria-label="checkbox-mfaBypass"
              b-form-checkbox
              switch
              :data-test-id="`${row.item.username}-mfa-bypass`"
              @change="updateMfaBypassVal(row.item)"
            >
              <span class="visually-hidden">checkbox</span>
            </BFormCheckbox>
          </template>
          <template v-if="currentUser" #head(secretKey)="row">
            {{ row.label }}
            <info-tooltip
              v-if="isAdminUser || isServiceUser"
              class="ml-1"
              :title="$t('pageUserManagement.table.secretKeyTooltip')"
            >
            </info-tooltip>
          </template>
          <template
            v-if="currentUser && (isAdminUser || isServiceUser)"
            #cell(secretKey)="row"
          >
            <b-button
              v-if="
                row.item.privilege !== 'Service agent' &&
                currentUser.UserName !== row.item.username
              "
              variant="primary"
              :data-test-id="`${row.item.username}-secret-key`"
              :disabled="!row.item.secretKey"
              @click="clearSecretKey(row.item)"
            >
              {{ $t('pageUserManagement.table.clear') }}
            </b-button>
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
                  aria-label="edit"
                  :data-test-id="`userManagement-tableRowAction-edit-${index}`"
                />
                <icon-trashcan
                  v-if="action.value === 'delete'"
                  aria-label="delete"
                  :data-test-id="`userManagement-tableRowAction-delete-${index}`"
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
        <BCollapse id="collapse-role-table" class="mt-3">
          <table-roles />
        </BCollapse>
      </BCol>
    </BRow>
    <!-- Modals -->
    <modal-settings :settings="settings" @ok="saveAccountSettings" />
    <modal-user
      :user="activeUser"
      :password-requirements="passwordRequirements"
      @hidden="activeUser = null"
    />
    <register-otp-modal @disable-mfa="disableMFA()" />
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
import { ref, computed, onBeforeMount, onBeforeUnmount, watch } from 'vue';
import i18n from '@/i18n';
import { onBeforeRouteLeave } from 'vue-router';
import IconTrashcan from '@carbon/icons-vue/es/trash-can/20';
import IconEdit from '@carbon/icons-vue/es/edit/20';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import IconSettings from '@carbon/icons-vue/es/settings/20';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import eventBus from '@/eventBus';
import ModalUser from './ModalUser.vue';
import ModalSettings from './ModalSettings.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import TableRoles from './TableRoles.vue';
import TableToolbar from '@/components/Global/TableToolbar.vue';
import TableRowAction from '@/components/Global/TableRowAction.vue';
import RegisterOtpModal from './RegisterOtpModal.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useTableSelectableComposable from '@/components/Composables/useTableSelectableComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import AuthenticationStore from '../../../store/modules/Authentication/AuthenticationStore';
import { TOTP } from 'totp-generator';
import stores from '@/store';
import { useUserManagement } from '@/api/composables/useUserManagement';

onBeforeRouteLeave(() => {
  eventBus.emit('clear-selected');
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
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const toast = useToastComposable();
const authenticationStore = AuthenticationStore();
const global = stores.GlobalStore();

const {
  allUsers: allUsersRaw,
  accountRoles,
  accountSettings: accountSettingsData,
  accountPasswordRequirements,
  isGlobalMfaEnabled,
  isCurrentUserMfaBypassed,
  secretKeyInfo,
  isLoading: isDataLoading,
  isMutating,
  createUser: createUserApi,
  updateUser: updateUserApi,
  deleteUser: deleteUserApi,
  deleteUsers: deleteUsersApi,
  enableUsers: enableUsersApi,
  disableUsers: disableUsersApi,
  saveAccountSettings: saveAccountSettingsApi,
  updateGlobalMfa: updateGlobalMfaApi,
  updateMfaBypass: updateMfaBypassApi,
  updateMfaBypassNewUser: updateMfaBypassNewUserApi,
  clearSetSecretKey: clearSetSecretKeyApi,
  verifyRegisterTotp: verifyRegisterTotpApi,
  checkCurrentUserMfaBypassed,
  clearSecretKey: clearSecretKeyApi,
  generateSecretKey: generateSecretKeyApi,
  refetchUsers,
  refetchAccountService,
} = useUserManagement();

const isAllSelected = ref(false);
const isBusy = computed(() => isDataLoading.value || isMutating.value);
const beforeMfa = ref(false);
const activeUser = ref(null);
const openModal = ref(false);
const okTitle = ref('');
const globalMfaRef = ref(null);
const deleteTitle = ref('');
const deleteType = ref('');
const deleteMessage = ref('');
const fields = ref([
  {
    key: 'checkbox',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'username',
    label: i18n.global.t('pageUserManagement.table.username'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'privilege',
    label: i18n.global.t('pageUserManagement.table.privilege'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'status',
    label: i18n.global.t('pageUserManagement.table.status'),
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'actions',
    label: '',
    class: 'text-right text-nowrap empty-column',
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
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
    tableItems.value.forEach((u) => {
      u.isSelected = false;
    });
    clearSelectedRows(tableRef);
  });
  eventBus.on('okUser', handleOkUser);
  eventBus.on('refresh-application', (ctx) => {
    // Mark as handled so AppLayout does not remount the page via routerKey.
    // VueQuery refetch keeps the existing rows visible while fetching fresh data.
    if (ctx) ctx.handled = true;
    refetchUsers();
    refetchAccountService();
  });
});

onBeforeUnmount(() => {
  eventBus.off('okUser', handleOkUser);
  eventBus.off('refresh-application');
});

const currentMfaBypassed = computed(() => isCurrentUserMfaBypassed.value);

const isAdminUser = computed(() => global.isAdminUser);

const isServiceUser = computed(() => global.isServiceUser);

// Local ref that mirrors server MFA state. A plain writable ref (instead of a
// read-only computed) lets BFormCheckbox v-model re-sync the DOM when we
// explicitly reset it after a failed enable attempt.
const globalMfaValue = ref(null);

// Keep the local ref in sync whenever the server state changes (e.g. after
// invalidateAccountService() refetches and confirms the real value).
watch(
  isGlobalMfaEnabled,
  (val) => {
    globalMfaValue.value = val;
  },
  { immediate: true },
);

const secretKey = computed(() => secretKeyInfo.value);

const allUsers = computed(() => {
  return allUsersRaw.value.map((user) => {
    // Resolve role label from roles list
    const role = accountRoles.value.find((r) => user.RoleId?.includes(r));
    return role ? { ...user, RoleId: role } : user;
  });
});

const currentUser = computed(() => global.currentUserGetter);

// Watch currentUser so MFA/secretKey columns are added reactively even if
// currentUser is null at onBeforeMount time (e.g. store not yet hydrated).
watch(
  currentUser,
  (user) => {
    if (user) {
      addMfaBypass();
      checkCurrentUserMfaBypassed(user['@odata.id']);
    }
  },
  { immediate: true },
);

const tableItems = ref([]);

watch(
  allUsers,
  (users) => {
    // Preserve selection state across refetches by keying on username
    const prevSelected = new Set(
      tableItems.value.filter((r) => r.isSelected).map((r) => r.username),
    );
    tableItems.value = users.map((user) => ({
      username: user.UserName,
      privilege:
        user.RoleId === 'Administrator'
          ? i18n.global.t('pageUserManagement.table.administrator')
          : user.RoleId === 'ReadOnly'
            ? i18n.global.t('pageUserManagement.table.readOnly')
            : user.RoleId === 'OemIBMServiceAgent'
              ? i18n.global.t('pageUserManagement.table.serviceAgent')
              : user.RoleId,
      status: user.Locked
        ? i18n.global.t('global.status.locked')
        : user.Enabled
          ? i18n.global.t('global.status.enabled')
          : i18n.global.t('global.status.disabled'),
      mfa: user?.MFABypass?.BypassTypes?.includes('GoogleAuthenticator'),
      secretKey: user?.SecretKeySet,
      isSelected: prevSelected.has(user.UserName),
      actions: [
        { value: 'edit', enabled: true },
        { value: 'delete', enabled: user.RoleId !== 'OemIBMServiceAgent' },
      ],
      ...user,
    }));
  },
  { immediate: true },
);

const settings = computed(() => accountSettingsData.value);

const passwordRequirements = computed(() => {
  if (activeUser.value?.AccountTypes?.includes('IPMI')) {
    return { minLength: 8, maxLength: 20 };
  }
  return accountPasswordRequirements.value;
});

const handleOkUser = ({ isNewUser, userData, mfaByPass }) => {
  saveUser({ isNewUser, userData, mfaByPass });
};

watch(secretKey, (value) => {
  if (value !== null && beforeMfa.value) {
    const { otp } = TOTP.generate(value, { digits: 6 });
    verifyRegisterTotpApi(otp.toString())
      .then(() => {
        updateGlobalMfaApi(true)
          .then((message) => {
            toast.successToast(message);
            if (!currentMfaBypassed.value) {
              authenticationStore.logout();
            }
          })
          .catch(({ message }) => {
            toast.errorToast(message);
            disableMFA();
          });
      })
      .catch(() => {
        toast.errorToast(
          i18n.global.t('pageUserManagement.toast.errorEnableMfaAuto'),
        );
        eventBus.emit('otp-register-modal');
      })
      .finally(() => {
        beforeMfa.value = false;
      });
  }
});

function addMfaBypass() {
  if (
    currentUser.value &&
    (isAdminUser.value || isServiceUser.value) &&
    !fields.value.some((f) => f.key === 'secretKey')
  ) {
    fields.value.splice(4, 0, {
      key: 'mfa',
      label: i18n.global.t('pageUserManagement.table.mfaByPass'),
      class: 'mfa-toggle',
      thAttr: { scope: 'col' },
      tdAttr: { scope: null },
    });
    fields.value.splice(5, 0, {
      key: 'secretKey',
      label: i18n.global.t('pageUserManagement.table.secretKey'),
      class: 'text-center',
      thAttr: { scope: 'col' },
      tdAttr: { scope: null },
    });
  }
}

function clearSecretKey(value) {
  clearSetSecretKeyApi(value)
    .then((message) => {
      toast.successToast(message);
      eventBus.emit('clear-selected');
      if (currentUser.value?.UserName === value.username) {
        authenticationStore.logout();
      }
    })
    .catch(({ message }) => toast.errorToast(message));
}

function disableMFA() {
  // Always clear beforeMfa so the secretKey watcher cannot re-trigger
  // the enable flow after cache invalidation
  beforeMfa.value = false;
  // Reset toggle immediately — the watch(isGlobalMfaEnabled) will confirm
  // once the server refetch resolves, but this gives instant visual feedback
  globalMfaValue.value = false;
  // Clear the singleton secret key so no stale QR is shown on next enable
  clearSecretKeyApi();
  updateGlobalMfaApi(false).catch(() => {});
}

async function updateGlobalMfa(state) {
  await checkCurrentUserMfaBypassed(currentUser?.value?.['@odata.id']);
  if (state) {
    // Enabling MFA: generate secret key then open TOTP registration
    beforeMfa.value = true;
    clearSecretKeyApi();
    generateSecretKeyApi().catch(() => {
      disableMFA();
      beforeMfa.value = false;
      toast.errorToast(
        i18n.global.t('pageUserManagement.toast.errorEnableMfa'),
      );
    });
  } else {
    // Disabling MFA — reset beforeMfa first so the secretKey watcher
    // does not re-trigger the enable flow if cache invalidation fires
    beforeMfa.value = false;
    updateGlobalMfaApi(false)
      .then((message) => {
        toast.successToast(message);
      })
      .catch(({ message }) => toast.errorToast(message));
  }
}

function updateMfaBypassVal(value) {
  updateMfaBypassApi(value)
    .then((message) => {
      toast.successToast(message);
      eventBus.emit('clear-selected');
      if (currentUser.value) {
        checkCurrentUserMfaBypassed(currentUser?.value?.['@odata.id']);
      }
      if (
        currentUser.value?.UserName === value.username &&
        isGlobalMfaEnabled.value === true &&
        value.mfa === false
      ) {
        authenticationStore.logout();
      }
    })
    .catch(({ message }) => toast.errorToast(message));
}

function toggleAll(checked) {
  tableItems.value.forEach((u) => {
    u.isSelected = checked;
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
    { user: user.username },
  );
  deleteTitle.value = i18n.global.t('pageUserManagement.deleteUser');
  deleteType.value = 'singleEntry';
}

function handleOk(value) {
  if (value === 'singleEntry') {
    deleteUser(userToDelete.value);
  } else {
    startLoader();
    deleteUsersApi(selectedRows.value)
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

function saveUser({ isNewUser, userData, mfaByPass }) {
  if (isNewUser !== undefined && userData !== undefined) {
    startLoader();
    if (isNewUser) {
      createUserApi(userData)
        .then(async (success) => {
          toast.successToast(success);
          if (mfaByPass) {
            await updateMfaBypassNewUserApi({ userData, mfaByPass });
          }
          eventBus.emit('clear-selected');
        })
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
    } else {
      updateUserApi(userData)
        .then((success) => {
          toast.successToast(success);
          eventBus.emit('clear-selected');
        })
        .catch(({ message }) => toast.errorToast(message))
        .finally(() => endLoader());
    }
  }
}

function deleteUser({ username }) {
  startLoader();
  deleteUserApi(username)
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
      enableUsersApi(selectedRows.value)
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
      disableUsersApi(selectedRows.value)
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
  saveAccountSettingsApi(settings)
    .then((message) => toast.successToast(message))
    .catch(({ message }) => toast.errorToast(message))
    .finally(() => endLoader());
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
.mfa-toggle div {
  padding-left: 4rem;
}
:deep(.empty-column) {
  z-index: 0 !important;
}
</style>
