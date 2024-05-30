<template>
  <div class="custom-form-file-container">
    <label>
      <b-form-file
        :id="id"
        v-model="file"
        :accept="accept"
        :disabled="disabled"
        :state="state"
        @change="$emit('input', file)"
      >
      </b-form-file>
      <slot name="invalid"></slot>
    </label>
    <div v-if="file" class="clear-selected-file px-3 py-2 mt-2">
      {{ file ? file.name : '' }}
      <BButton variant="light" class="px-2 ms-auto" :disabled="disabled" @click="file = null"
        ><icon-close :title="t('global.fileUpload.clearSelectedFile')" />
        <span class="sr-only">{{ $t('global.fileUpload.clearSelectedFile') }}</span>
      </BButton>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { BFormFile } from 'bootstrap-vue-next';
import IconClose from '@carbon/icons-vue/es/close/20';
import { ref } from 'vue';

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
console.log(
  'id: ',
  props.id,
  'disabled: ',
  props.disabled,
  'accept: ',
  props.accept,
  'state: ',
  props.state,
  'variant',
  props.variant,
);
const { t } = useI18n();
const file = ref(null);
// const isSecondary = computed(() => {
//   return props.variant === 'secondary';
// });
</script>

<style lang="scss" scoped>
.form-control-file {
  opacity: 0;
  height: 0;
  &:focus + span {
    box-shadow:
      inset 0 0 0 3px theme-color('primary'),
      inset 0 0 0 5px $white;
  }
}

// Get mouse pointer on complete element
.add-file-btn {
  position: relative;
  &.disabled {
    border-color: gray('400');
    background-color: gray('400');
    color: gray('600');
    box-shadow: none !important;
  }
}

.clear-selected-file {
  display: flex;
  align-items: center;
  background-color: #f4f4f4; //theme-color('light'); Need to check the theme colors
  position: relative;
  z-index: 2;
  .btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;

    &:focus {
      box-shadow: inset 0 0 0 2px theme-color('primary');
    }
  }
}
.custom-form-file-container {
  word-break: break-all;
}
</style>
