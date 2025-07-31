<template>
  <BModal
    id="modal-update-firmware"
    v-model="modal"
    :title="$t('pageFirmware.sectionTitleUpdateFirmware')"
    :ok-title="$t('pageFirmware.form.updateFirmware.startUpdate')"
    :cancel-title="$t('global.action.cancel')"
  >
    <template v-if="isSingleFileUploadEnabled">
      <p>
        {{ $t('pageFirmware.modal.updateFirmwareInfo') }}
      </p>
      <p>
        {{
          $t('pageFirmware.modal.updateFirmwareInfo2', {
            running: runningBmcVersion,
          })
        }}
      </p>
      <p class="m-0">
        {{ $t('pageFirmware.modal.updateFirmwareInfo3') }}
      </p>
    </template>
    <template v-else>
      {{ $t('pageFirmware.modal.updateFirmwareInfoDefault') }}
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import eventBus from '@/eventBus';
import stores from '@/store';

const firmwareStore = stores.FirmwareStore();

const modal = ref(false);

eventBus.on('modal-update-firmware', () => {
  modal.value = true;
});

const runningBmc = computed(() => {
  return firmwareStore.activeBmcFirmware;
});

const runningBmcVersion = computed(() => {
  return runningBmc.value?.version || '--';
});

const isSingleFileUploadEnabled = computed(() => {
  return firmwareStore.isSingleFileUploadEnabled;
});
</script>
