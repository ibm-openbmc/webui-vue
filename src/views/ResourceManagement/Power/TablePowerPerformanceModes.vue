<template>
  <b-table stacked="sm" hover :items="items" :fields="fields"> </b-table>
</template>

<script>
export default {
  components: {},
  data() {
    return {
      fields: [
        {
          key: 'setting',
          label: this.$t('pagePower.tableRoles.setting'),
          sortable: false,
        },
        {
          key: 'description',
          label: this.$t('pagePower.tableRoles.description'),
          sortable: false,
        },
      ],
      items: [
        {
          setting: this.$t('pagePower.selectMode.static'),
          description: this.$t('pagePower.tableRoles.descStatic'),
        },
        {
          setting: this.$t('pagePower.selectMode.powerSaving'),
          description: this.$t('pagePower.tableRoles.descPowerSaving'),
        },
        {
          setting: this.$t('pagePower.selectMode.maximumPerformance'),
          description: this.$t('pagePower.tableRoles.descMaximumPerformance'),
        },
      ],
    };
  },
};
</script>
