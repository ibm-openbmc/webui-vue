<template>
  <span :class="['status-icon', status]">
    <icon-info v-if="status === 'info'" />
    <icon-success v-else-if="status === 'success'" />
    <icon-warning v-else-if="status === 'warning'" />
    <icon-danger v-else-if="status === 'danger'" />
    <icon-secondary v-else />
  </span>
</template>

<script setup>
import IconInfo from '@carbon/icons-vue/es/information--filled/20';
import IconSuccess from '@carbon/icons-vue/es/checkmark--filled/20';
import IconWarning from '@carbon/icons-vue/es/warning--filled/20';
import IconSecondary from '@carbon/icons-vue/es/error--filled/20';
import IconDanger from '@carbon/icons-vue/es/misuse/20';

defineProps({
  status: {
    type: String,
    default: '',
  },
});
</script>

<style lang="scss" scoped>
.status-icon {
  vertical-align: text-bottom;

  &.info {
    color: $info;
  }
  &.success {
    color: $success;
  }
  &.danger {
    color: $danger;
  }
  &.secondary {
    color: gray('600');
    transform: rotate(-45deg);
  }
  &.warning {
    color: $warning;
  }

  svg {
    fill: currentColor;
  }
}
</style>
