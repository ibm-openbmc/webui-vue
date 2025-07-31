<template>
  <page-section :section-title="$t('pageFirmware.sectionTitleHostCards')">
    <BCardGroup deck>
      <!-- Running image -->
      <BCard>
        <template #header>
          <p class="fw-bold m-0">
            {{ $t('pageFirmware.cardTitleRunning') }}
          </p>
        </template>
        <dl class="mb-0">
          <dt>{{ $t('pageFirmware.cardBodyVersion') }}</dt>
          <dd class="mb-0">{{ runningVersion }}</dd>
        </dl>
      </BCard>

      <!-- Backup image -->
      <BCard>
        <template #header>
          <p class="fw-bold m-0">
            {{ $t('pageFirmware.cardTitleBackup') }}
          </p>
        </template>
        <dl class="mb-0">
          <dt>{{ $t('pageFirmware.cardBodyVersion') }}</dt>
          <dd class="mb-0">
            <status-icon v-if="showBackupImageStatus" status="danger" />
            <span v-if="showBackupImageStatus" class="visually-hidden">
              {{ backupStatus }}
            </span>
            {{ backupVersion }}
          </dd>
        </dl>
      </BCard>
    </BCardGroup>
  </page-section>
</template>

<script setup>
import { computed } from 'vue';
import PageSection from '@/components/Global/PageSection.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import stores from '@/store';

const firmwareStore = stores.FirmwareStore();

const running = computed(() => {
  return firmwareStore.activeHostFirmware;
});

const backup = computed(() => {
  return firmwareStore.backupHostFirmware;
});

const runningVersion = computed(() => {
  return running.value?.version || '--';
});

const backupVersion = computed(() => {
  return backup.value?.version || '--';
});

const backupStatus = computed(() => {
  return backup.value?.status || null;
});

const showBackupImageStatus = computed(() => {
  return backupStatus.value === 'Critical' || backupStatus.value === 'Warning';
});
</script>

<style lang="scss" scoped>
.page-section {
  margin-top: -$spacer * 1.5;
}
</style>
