<template>
  <BButton
    v-b-tooltip
    variant="link"
    class="btn-tooltip btn-icon-only"
    :title="title"
  >
    <slot>
      <icon-tooltip />
    </slot>
    <span class="visually-hidden">{{ $t('global.ariaLabel.tooltip') }}</span>
  </BButton>
</template>

<script setup>
import IconTooltip from '@carbon/icons-vue/es/information/16';
import { defineProps } from 'vue';
defineProps({
  status: {
    type: String,
    default: '',
  },
});
</script>

<style lang="scss" scoped>
.btn-tooltip {
  padding: 0;
  line-height: 1em;
  svg {
    vertical-align: baseline;
  }
}
</style>
