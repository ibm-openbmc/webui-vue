<template>
  <BAlert :model-value="show" :variant="variant" :class="{ small }">
    <div
      v-if="
        variant == 'info' ||
        variant == 'success' ||
        variant == 'warning' ||
        variant == 'danger'
      "
      class="alert-icon"
    >
      <status-icon :status="variant" />
    </div>
    <div class="alert-content">
      <div class="alert-msg">
        <slot />
      </div>
    </div>
    <div class="alert-action">
      <slot name="action"></slot>
    </div>
  </BAlert>
</template>

<script setup>
import { defineProps } from 'vue';
import StatusIcon from '../Global/StatusIcon.vue';

defineProps({
  show: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: '',
  },
  small: Boolean,
});
</script>
