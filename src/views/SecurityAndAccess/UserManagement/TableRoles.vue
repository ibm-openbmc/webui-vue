<template>
  <BTable thead-class="thead-light" hover small :items="items" :fields="fields">
    <template #cell(administrator)="data">
      <template v-if="data.value">
        <checkmark20 />
      </template>
    </template>
    <template #cell(operator)="data">
      <template v-if="data.value">
        <checkmark20 />
      </template>
    </template>
    <template #cell(readonly)="data">
      <template v-if="data.value">
        <checkmark20 />
      </template>
    </template>
    <template #cell(noaccess)="data">
      <template v-if="data.value">
        <checkmark20 />
      </template>
    </template>
  </BTable>
</template>

<script setup>
import { ref } from 'vue';
import i18n from '@/i18n';
import Checkmark20 from '@carbon/icons-vue/es/checkmark/20';

const items = ref([
  {
    description: i18n.global.t(
      'pageUserManagement.tableRoles.configureComponentsManagedByThisService',
    ),
    administrator: true,
    readonly: false,
  },
  {
    description: i18n.global.t(
      'pageUserManagement.tableRoles.configureManagerResources',
    ),
    administrator: true,
    readonly: false,
  },
  {
    description: i18n.global.t(
      'pageUserManagement.tableRoles.updatePasswordForCurrentUserAccount',
    ),
    administrator: true,
    readonly: true,
  },
  {
    description: i18n.global.t(
      'pageUserManagement.tableRoles.configureUsersAndTheirAccounts',
    ),
    administrator: true,
    readonly: false,
  },
  {
    description: i18n.global.t(
      'pageUserManagement.tableRoles.logInToTheServiceAndReadResources',
    ),
    administrator: true,
    readonly: true,
  },
]);
const fields = ref([
  {
    key: 'description',
    label: i18n.global.t('pageUserManagement.tableRoles.privilege'),
  },
  {
    key: 'administrator',
    label: i18n.global.t('pageUserManagement.tableRoles.administrator'),
    class: 'text-center',
  },
  {
    key: 'readonly',
    label: i18n.global.t('pageUserManagement.tableRoles.readOnly'),
    class: 'text-center',
  },
]);
</script>
