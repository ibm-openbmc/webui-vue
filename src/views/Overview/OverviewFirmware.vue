<!-- TODO: Work Requird -->
<template>
  <overview-card
    :title="$t('pageOverview.firmwareInformation')"
    :to="`/operations/firmware`"
  >
    <BRow class="mt-3">
      <BCol sm="5">
        <dl>
          <dt>{{ $t('pageOverview.runningVersion') }}</dt>
          <dd>{{ dataFormatter(runningVersion) }}</dd>
          <dt>{{ $t('pageOverview.backupVersion') }}</dt>
          <dd>{{ dataFormatter(backupVersion) }}</dd>
        </dl>
      </BCol>
      <BCol sm="7">
        <dl>
          <dt>{{ $t('pageOverview.accessKeyExpiration') }}</dt>
          <dd>
            {{ $filters.formatDate(firmwareAccessKeyInfo.expirationDate) }}
          </dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { FirmwareStore, LicenseStore } from '@/store';
import eventBus from '@/eventBus';

const { dataFormatter } = useDataFormatterGlobal();

const firmwareStore = FirmwareStore();
const licenseStore = LicenseStore();

onBeforeMount(() => {
  Promise.all([
    licenseStore.getLicenses(),
    firmwareStore.getFirmwareInformation(),
  ]).finally(() => {
    eventBus.emit('overview-firmware-complete');
  });
});

const backupBmcFirmware = computed(() => {
  return firmwareStore.backupBmcFirmware;
});
const backupVersion = computed(() => {
  return backupBmcFirmware.value?.version;
});
const activeBmcFirmware = computed(() => {
  return firmwareStore.activeBmcFirmware;
});
const firmwareAccessKeyInfo = computed(() => {
  return licenseStore.firmwareAccessKeyInfo;
});
const runningVersion = computed(() => {
  return activeBmcFirmware.value?.version;
});
</script>
