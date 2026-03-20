<template>
  <page-section :section-title="$t('pageFirmware.sectionTitleHostCards')">
    <BCardGroup deck>
      <!-- Running image -->
      <BCard>
        <template #header>
          <h5 class="fw-bold m-0">
            {{ $t('pageFirmware.cardTitleRunning') }}
          </h5>
        </template>
        <dl class="mb-0">
          <dt>{{ $t('pageFirmware.cardBodyVersion') }}</dt>
          <dd class="mb-0">{{ runningVersion }}</dd>
        </dl>
      </BCard>

      <!-- Backup image -->
      <BCard>
        <template #header>
          <h5 class="fw-bold m-0">
            {{ $t('pageFirmware.cardTitleBackup') }}
          </h5>
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
import { useFirmware } from '@/api/composables/useFirmware';

// Use the new VueQuery composable
const { activeHostFirmware, backupHostFirmware } = useFirmware();

const running = computed(() => {
  return activeHostFirmware.value;
});

const backup = computed(() => {
  return backupHostFirmware.value;
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
