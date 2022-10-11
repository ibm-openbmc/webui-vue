<template>
  <b-table stacked="sm" hover small :items="items" :fields="fields">
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
  </b-table>
</template>

<script>
import Checkmark20 from '@carbon/icons-vue/es/checkmark/20';

export default {
  components: {
    Checkmark20,
  },
  data() {
    return {
      items: [
        {
          description: this.$t(
            'pageUserManagement.tableRoles.configureComponentsManagedByThisService'
          ),
          administrator: true,
          readonly: false,
        },
        {
          description: this.$t(
            'pageUserManagement.tableRoles.configureManagerResources'
          ),
          administrator: true,
          readonly: false,
        },
        {
          description: this.$t(
            'pageUserManagement.tableRoles.updatePasswordForCurrentUserAccount'
          ),
          administrator: true,
          readonly: true,
        },
        {
          description: this.$t(
            'pageUserManagement.tableRoles.configureUsersAndTheirAccounts'
          ),
          administrator: true,
          readonly: false,
        },
        {
          description: this.$t(
            'pageUserManagement.tableRoles.logInToTheServiceAndReadResources'
          ),
          administrator: true,
          readonly: true,
        },
      ],
      fields: [
        {
          key: 'description',
          label: this.$t('pageUserManagement.tableRoles.privilege'),
        },
        {
          key: 'administrator',
          label: this.$t('pageUserManagement.tableRoles.administrator'),
          class: 'text-center',
        },
        {
          key: 'readonly',
          label: this.$t('pageUserManagement.tableRoles.readOnly'),
          class: 'text-center',
        },
      ],
    };
  },
};
</script>
