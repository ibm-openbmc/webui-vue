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
            {{ isEnabled ? configuredCores : '--' }}
            <info-tooltip
              v-if="isPending"
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
import { useFieldCoreOverride } from '@/api/composables/useFieldCoreOverride';

const systemStore = stores.SystemStore();
const licenseStore = stores.LicenseStore();

const { configuredCores, isEnabled, isPending } = useFieldCoreOverride();

const totalInstalledCores = computed(
  () => systemStore.getSystems?.[0]?.processorSummaryCoreCount,
);

const licensedCores = computed(
  () => licenseStore.licensesGetter?.PermProcs?.MaxAuthorizedDevices,
);
</script>
