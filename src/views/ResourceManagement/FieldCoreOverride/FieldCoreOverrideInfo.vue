<template>
  <BRow>
    <BCol xl="8">
      <page-section
        :section-title="$t('pageFieldCoreOverride.currentConfiguration')"
      >
        <BCard bg-variant="light" border-variant="light" class="mb-4">
          <p>
            {{ $t('pageFieldCoreOverride.totalInstalledCores') }}:
            {{ isUndefined(totalInstalledCores) ? '--' : totalInstalledCores }}
          </p>
          <p>
            {{ $t('pageFieldCoreOverride.licensedCores') }}:
            {{ isUndefined(licensedCores) ? '--' : licensedCores }}
          </p>
          <p class="mb-0">
            {{ $t('pageFieldCoreOverride.configuredCores') }}:
            {{ isFieldCoreOverrideEnabled ? configuredCores : '--' }}
            <info-tooltip
              v-if="isFieldCoreOverridePending"
              :title="$t('pageFieldCoreOverride.scheduledForNextReboot')"
            >
              <icon-time />
            </info-tooltip>
          </p>
        </BCard>
      </page-section>
    </BCol>
  </BRow>
</template>

<script setup>
import { computed } from 'vue';
import { isUndefined } from 'lodash';
import IconTime from '@carbon/icons-vue/es/time/16';
import PageSection from '@/components/Global/PageSection.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import stores from '@/store';

const systemStore = stores.SystemStore();
const fieldCoreOverrideStore = stores.FieldCoreOverrideStore();
const licenseStore = stores.LicenseStore();

const systems = computed(() => {
  return systemStore.getSystems;
});

const processorInfo = computed(() => {
  return licenseStore.licensesGetter;
});

const configuredCores = computed(() => {
  return fieldCoreOverrideStore.configuredCoresGetter;
});

const isFieldCoreOverrideEnabled = computed(() => {
  return fieldCoreOverrideStore.isEnabledGetter;
});

const isFieldCoreOverridePending = computed(() => {
  return fieldCoreOverrideStore.isPendingGetter;
});

const totalInstalledCores = computed(() => {
  return systems.value?.[0]?.processorSummaryCoreCount;
});

const licensedCores = computed(() => {
  return processorInfo.value?.PermProcs?.MaxAuthorizedDevices;
});
</script>
