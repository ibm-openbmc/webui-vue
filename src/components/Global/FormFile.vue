<template>
  <div class="custom-form-file-container">
    <label>
      <BFormFile
        :id="id"
        v-model="file"
        :accept="accept"
        :disabled="disabled"
        :state="state"
        plain
        @update:model-value="$emit('input', file)"
        class="form-control-file"
      >
      </BFormFile>
      <span
        class="add-file-btn btn"
        :class="{
          disabled,
          'btn-secondary': isSecondary,
          'btn-primary': !isSecondary,
        }"
      >
        {{ $t('global.fileUpload.browseText') }}
      </span>
      <slot name="invalid"></slot>
    </label>
    <div v-if="file" class="clear-selected-file px-3 py-2 mt-2">
      {{ file ? file.name : '' }}
      <BButton
        variant="light"
        class="px-2 ml-auto"
        :disabled="disabled"
        @click="clearFile"
        ><icon-close :title="$t('global.fileUpload.clearSelectedFile')" /><span
          class="visually-hidden"
          >{{ $t('global.fileUpload.clearSelectedFile') }}</span
        >
      </BButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineEmits } from 'vue';
import IconClose from '@carbon/icons-vue/es/close/20';

const emit = defineEmits(['input']);

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  accept: {
    type: String,
    default: '',
  },
  state: {
    type: Boolean,
    default: true,
  },
  variant: {
    type: String,
    default: 'secondary',
  },
});

function clearFile() {
  file.value = null;
  emit('input', file.value);
}
const file = ref(null);
const isSecondary = computed(() => {
  return props.variant === 'secondary';
});
</script>

<style lang="scss" scoped>
// Get mouse pointer on complete element
.add-file-btn {
  position: relative;
  &.disabled {
    border-color: $gray-400;
    background-color: $gray-400;
    color: $gray-600;
    box-shadow: none !important;
  }
}

.clear-selected-file {
  display: flex;
  align-items: center;
  background-color: $light;
  position: relative;
  z-index: 2;
  .btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;

    &:focus {
      box-shadow: inset 0 0 0 2px $primary;
    }
  }
}
.custom-form-file-container {
  word-break: break-all;
}
</style>
