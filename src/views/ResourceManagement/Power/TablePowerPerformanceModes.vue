<template>
  <BTable
    id="table-sensors"
    thead-class="thead-light"
    hover
    :items="items"
    :fields="fields"
  >
  </BTable>
</template>

<script setup>
import { ref } from 'vue';
import i18n from '@/i18n';

const fields = ref([
  {
    key: 'setting',
    label: i18n.global.t('pagePower.tableRoles.setting'),
    sortable: false,
  },
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
  },
]);

const items = ref([
  {
    setting: i18n.global.t('pagePower.selectMode.static'),
    description: i18n.global.t('pagePower.tableRoles.descStatic'),
  },
  {
    setting: i18n.global.t('pagePower.selectMode.powerSaving'),
    description: i18n.global.t('pagePower.tableRoles.descPowerSaving'),
  },
  {
    setting: i18n.global.t('pagePower.selectMode.maximumPerformance'),
    description: i18n.global.t('pagePower.tableRoles.descMaximumPerformance'),
  },
]);
</script>

<style lang="scss" scoped>
#table-sensors {
  td .btn-link {
    width: auto !important;
  }
}
.text-right {
  text-align: right;
}
.searchStyle {
  height: 74px;
}
</style>
