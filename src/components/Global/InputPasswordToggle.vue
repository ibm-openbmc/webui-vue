<template>
  <div class="input-password-toggle-container">
    <slot></slot>
    <b-button
      :title="togglePasswordLabel"
      variant="link"
      class="input-action-btn btn-icon-only"
      :class="{ isVisible: isVisible }"
      @click="toggleVisibility"
    >
      <icon-view-off v-if="isVisible" />
      <icon-view v-else />
    </b-button>
  </div>
</template>

<script setup>
import IconView from '@carbon/icons-vue/es/view/20';
import IconViewOff from '@carbon/icons-vue/es/view--off/20';
import i18n from '@/i18n';
import { ref } from 'vue';
const isVisible = ref(false);
const togglePasswordLabel = ref(i18n.global.t('global.ariaLabel.showPassword'));
const emit = defineEmits(['updatePassView']);
const toggleVisibility = () => {
  isVisible.value = !isVisible.value;
  emit('updatePassView', isVisible.value ? 'text' : 'password');
  togglePasswordLabel.value = isVisible.value
    ? i18n.global.t('global.ariaLabel.hidePassword')
    : i18n.global.t('global.ariaLabel.showPassword');
};
</script>

<style lang="scss" scoped>
.input-password-toggle-container {
  position: relative;
}
</style>
