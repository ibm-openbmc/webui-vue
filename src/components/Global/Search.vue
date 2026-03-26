<template>
  <div class="search-global">
    <BFormGroup
      :label="$t('global.form.search')"
      :aria-label="`search-bar-${label}`"
      :label-for="`searchInput-${label}`"
      label-class="invisible"
      class="mb-2"
    >
      <BInputGroup
        :aria-label="`${$t('global.form.search')}-${label}`"
        size="md"
        class="align-items-center"
      >
        <BInputGroupText class="group-text">
          <icon-search class="search-icon" />
        </BInputGroupText>
        <BFormInput
          :id="`searchInput-${label}`"
          ref="searchInput"
          v-model="filter"
          class="search-input"
          type="text"
          :aria-label="$t('global.form.search')"
          :placeholder="placeholder"
          :disabled="isSearchDisabled"
          @input="onChangeInput($event)"
        >
        </BFormInput>
        <BButton
          v-if="filter"
          variant="link"
          class="clear-button btn-icon-only input-action-btn"
          :title="$t('global.ariaLabel.clearSearch')"
          @click="onClearSearch"
        >
          <icon-close />
        </BButton>
      </BInputGroup>
    </BFormGroup>
  </div>
</template>

<script setup>
import IconSearch from '@carbon/icons-vue/es/search/16';
import IconClose from '@carbon/icons-vue/es/close/20';
import { ref } from 'vue';
import i18n from '@/i18n';
// eslint-disable-next-line vue/valid-define-emits
const emit = defineEmits();

defineProps({
  placeholder: {
    type: String,
    default: function () {
      return i18n.global.t('global.form.search');
    },
  },
  isSearchDisabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
});

const filter = ref('');

const onChangeInput = (event) => {
  emit('change-search', event.target.value);
};
const onClearSearch = () => {
  filter.value = '';
  emit('clear-search');
};
</script>

<style lang="scss" scoped>
.search-input {
  padding-left: ($spacer * 2);
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 0.5px;
  z-index: 400;
  stroke: lightgrey;
}
.group-text {
  position: absolute;
  background: none;
  border: none;
}
.clear-button {
  z-index: 400;
  position: absolute;
}
</style>
