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
      <p v-if="timestamp" class="mt-3 mb-0">{{ formattedTimestamp }}</p>
      <p v-if="refreshAction">
        <BLink class="d-inline-block mt-3" @click="handleRefresh">
          {{ i18n.global.t('global.action.refresh') }}
        </BLink>
      </p>
    </template>
  </BToast>
</template>

<script setup>
import { ref, defineProps, computed, defineEmits } from 'vue';
import i18n from '@/i18n';
import StatusIcon from './StatusIcon.vue';
import { formatTime } from '../utilities/dateFilter';
const emit = defineEmits(['refresh']);

const { title, body, statusPassed, timestamp, refreshAction } = defineProps({
  // eslint-disable-next-line vue/require-default-prop
  title: String,
  // eslint-disable-next-line vue/require-default-prop
  body: String,
  // eslint-disable-next-line vue/require-default-prop
  statusPassed: String,
  autoHide: Boolean,
  timestamp: Boolean,
  refreshAction: Boolean,
});

const showToast = ref(false);

const formattedTimestamp = computed(() => {
  console.log('in toast component');
  if (timestamp) {
    return formatTime(new Date());
  } else {
    return ''; // Provide a default value when timestamp is false
  }
});
const handleRefresh = () => {
  emit('refresh-application');
};
</script>

<style scoped lang="scss">
// @import '../../../node_modules/bootstrap/scss/_functions.scss';
// @import '../../../node_modules/bootstrap/scss/_variables.scss';
// @import '../../../node_modules/bootstrap/scss/_variables-dark.scss';
// @import '../../../node_modules/bootstrap/scss/mixins';
.toast-top-right {
  top: 1rem;
  right: 1rem;
}
</style>
