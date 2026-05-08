<template>
  <b-row>
    <b-col xl="10">
      <!-- Operation in progress alert -->
      <alert v-if="isOperationInProgress" variant="info" class="mb-5">
        <p>
          {{ $t('pageFirmware.alert.operationInProgress') }}
        </p>
      </alert>
      <!-- Power off server warning alert -->
      <alert v-else-if="!isServerOff" variant="warning" class="mb-5">
        <p class="mb-0">
          {{ $t('pageFirmware.alert.serverMustBePoweredOffTo') }}
        </p>
        <ul class="m-0">
          <li>
            {{ $t('pageFirmware.alert.switchRunningAndBackupImages') }}
          </li>
          <li>
            {{ $t('pageFirmware.alert.updateFirmware') }}
          </li>
        </ul>
        <template #action>
          <router-link to="/operations/server-power-operations">
            {{ $t('pageFirmware.alert.viewServerPowerOperations') }}
          </router-link>
        </template>
      </alert>
    </b-col>
  </b-row>
</template>

<script setup>
import { computed } from 'vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';

const controlStore = stores.ControlStore();

defineProps({
  isServerOff: {
    required: true,
    type: Boolean,
    default: true,
  },
});

const isOperationInProgress = computed(() => {
  return controlStore.getIsOperationInProgress;
});
</script>

<style lang="scss" scoped>
:deep(a) {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
