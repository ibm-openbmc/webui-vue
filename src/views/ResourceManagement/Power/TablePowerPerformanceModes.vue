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
    setting: i18n.global.t('pagePower.selectMode.maximumPerformance.primary'),
    description: i18n.global.t('pagePower.tableRoles.descMaximumPerformance'),
  },
  {
    setting: i18n.global.t('pagePower.selectMode.energyEfficient.primary'),
    description: i18n.global.t('pagePower.tableRoles.descEnergyEfficient'),
  },
  {
    setting: i18n.global.t('pagePower.selectMode.maximumEnergySaver.primary'),
    description: i18n.global.t('pagePower.tableRoles.descMaximumEnergySaver'),
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
