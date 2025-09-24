<template>
  <BCard bg-variant="light" border-variant="light" class="mb-4">
    <div class="justify-content-between align-items-center d-flex flex-wrap">
      <h3 class="h5 mb-0">{{ title }}</h3>
      <div class="card-buttons">
        <BButton
          v-if="exportButton || downloadButton"
          :disabled="disabled"
          :download="download"
          :href="href"
          class="p-0"
          variant="link"
        >
          <span v-if="downloadButton">{{ $t('global.action.download') }}</span>
          <span v-if="exportButton">{{ $t('global.action.exportAll') }}</span>
        </BButton>
        <span v-if="exportButton || downloadButton" class="ps-2 pe-2">|</span>
        <BLink :to="to">{{ $t('pageOverview.viewMore') }}</BLink>
      </div>
    </div>
    <slot></slot>
  </BCard>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: true,
  },
  downloadButton: {
    type: Boolean,
    default: false,
  },
  exportButton: {
    type: Boolean,
    default: false,
  },

  fileName: {
    type: String,
    default: 'data',
  },
  title: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '/',
  },
});

const dataForExport = computed(() => {
  return JSON.stringify(props.data);
});
const download = computed(() => {
  return `${props.fileName}.json`;
});
const href = computed(() => {
  return `data:text/json;charset=utf-8,${dataForExport.value}`;
});
</script>

<style lang="scss" scoped>
a {
  vertical-align: middle;
  font-size: 14px;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
.card {
  min-width: 310px;
}
</style>
