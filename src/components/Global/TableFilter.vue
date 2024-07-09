<template>
  <div class="table-filter d-inline-block">
    <p class="d-inline-block mb-0">
      <BBadge v-for="(tag, index) in tags" :key="index" pill>
        {{ tag }}
        <BCloseButton
          :disabled="dropdownVisible"
          :aria-hidden="true"
          @click="removeTag(tag)"
        />
      </BBadge>
    </p>
    <BDropdown
      variant="link"
      no-caret
      right
      data-test-id="tableFilter-dropdown-options"
      :disabled="isFilterDisabled"
      @hide="dropdownVisible = false"
      @show="dropdownVisible = true"
    >
      <template #button-content>
        <icon-filter />
        {{ $t('global.action.filter') }}
      </template>
      <BDropdownForm>
        <BFormGroup
          v-for="(filter, index) of filters"
          :key="index"
          :label="filter.label"
        >
          <BFormCheckboxGroup v-model="tags">
            <BFormCheckbox
              v-for="value in filter.values"
              :key="value"
              :value="value"
              :data-test-id="`tableFilter-checkbox-${value}`"
            >
              <BDropdownItem>
                {{ value }}
              </BDropdownItem>
            </BFormCheckbox>
          </BFormCheckboxGroup>
        </BFormGroup>
      </BDropdownForm>
      <BDropdownItemButton
        variant="primary"
        data-test-id="tableFilter-button-clearAll"
        @click="clearAllTags"
      >
        {{ $t('global.action.clearAll') }}
      </BDropdownItemButton>
    </BDropdown>
  </div>
</template>

<script>
import IconFilter from '@carbon/icons-vue/es/settings--adjust/20';

export default {
  name: 'TableFilter',
  components: { IconFilter },
  props: {
    filters: {
      type: Array,
      default: () => [],
      validator: (prop) => {
        return prop.every(
          (filter) =>
            'label' in filter && 'values' in filter && 'key' in filter,
        );
      },
    },
    isFilterDisabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      dropdownVisible: false,
      tags: [],
    };
  },
  watch: {
    tags: {
      handler() {
        this.emitChange();
      },
      deep: true,
    },
  },
  methods: {
    removeTag(removedTag) {
      this.tags = this.tags.filter((tag) => tag !== removedTag);
    },
    clearAllTags() {
      this.tags = [];
    },
    emitChange() {
      const activeFilters = this.filters.map(({ key, values }) => {
        const activeValues = values.filter(
          (value) => this.tags.indexOf(value) !== -1,
        );
        return {
          key,
          values: activeValues,
        };
      });
      this.$emit('filter-change', { activeFilters });
    },
  },
};
</script>

<style lang="scss" scoped>
.badge {
  margin-right: calc($spacer / 2);
}
</style>
