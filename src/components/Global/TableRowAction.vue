<template>
  <span>
    <b-link
      v-if="value === 'export'"
      class="align-bottom btn-icon-only py-0 btn-link"
      :download="download"
      :href="href"
      :title="title"
    >
      <slot name="icon">
        {{ $t('global.action.export') }}
      </slot>
      <span v-if="btnIconOnly" class="visually-hidden">{{ title }}</span>
    </b-link>
    <b-link
      v-else-if="
        value === 'download' && downloadInNewTab && downloadLocation !== ''
      "
      class="align-bottom btn-icon-only py-0 btn-link"
      target="_blank"
      :href="downloadLocation"
      :title="title"
    >
      <slot name="icon" />
      <span class="visually-hidden">
        {{ $t('global.action.download') }}
      </span>
    </b-link>
    <b-link
      v-else-if="value === 'download' && downloadLocation !== ''"
      class="align-bottom btn-icon-only py-0 btn-link"
      :download="`${exportName}`"
      :href="`/api${downloadLocation}`"
      :title="title"
    >
      <slot name="icon" />
      <span class="visually-hidden">
        {{ $t('global.action.download') }}
      </span>
    </b-link>
    <b-button
      v-else-if="showButton"
      variant="link"
      :class="{ 'btn-icon-only': btnIconOnly }"
      :disabled="!enabled"
      :title="btnIconOnly ? title : !title"
      @click="$emit('click-table-action', value)"
    >
      <slot name="icon">
        {{ title }}
      </slot>
      <span v-if="btnIconOnly" class="visually-hidden">{{ title }}</span>
    </b-button>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { omit } from 'lodash';

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: null,
  },
  rowData: {
    type: Object,
    default: () => {},
  },
  exportName: {
    type: String,
    default: 'export',
  },
  downloadLocation: {
    type: String,
    default: '',
  },
  btnIconOnly: {
    type: Boolean,
    default: true,
  },
  downloadInNewTab: {
    type: Boolean,
    default: false,
  },
  showButton: {
    type: Boolean,
    default: true,
  },
});

const dataForExport = computed(() => {
  return JSON.stringify(omit(props.rowData, 'actions'));
});
const download = computed(() => {
  return `${props.exportName}.json`;
});
const href = computed(() => {
  return `data:text/json;charset=utf-8,${dataForExport.value}`;
});
</script>
