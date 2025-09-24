<template>
  <BToast :show="showToast" :variant="statusPassed" class="toast-top-right">
    <template #title>
      <div class="d-flex align-items-center">
        <status-icon :status="statusPassed" />
        <strong class="toast-icon">{{ title }}</strong>
      </div>
    </template>
    <template #default>
      <p class="mb-0">{{ body }}</p>
      <p v-if="refreshAction">
        <BLink class="d-inline-block mt-3" @click="handleRefresh">
          {{ i18n.global.t('global.action.refresh') }}
        </BLink>
      </p>
      <p v-if="timestamp" class="mt-3 mb-0">{{ formattedTimestamp }}</p>
    </template>
  </BToast>
</template>

<script setup>
import { ref, defineProps, computed } from 'vue';
import i18n from '@/i18n';
import StatusIcon from './StatusIcon.vue';
import { formatTime } from '../utilities/dateFilter';
import eventBus from '@/eventBus';

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  statusPassed: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Boolean,
    default: false,
  },
  refreshAction: {
    type: Boolean,
    default: false,
  },
});
const showToast = ref(false);

const formattedTimestamp = computed(() => {
  if (props?.timestamp) {
    return formatTime(new Date());
  } else {
    return ''; // Provide a default value when timestamp is false
  }
});
const handleRefresh = () => {
  eventBus.emit('refresh-application');
};
</script>

<style scoped lang="scss">
.toast-top-right {
  top: 1rem;
  right: 1rem;
}
</style>
