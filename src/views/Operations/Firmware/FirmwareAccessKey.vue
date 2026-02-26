<template>
  <div>
    <dl>
      <dt>
        {{ $t('pageFirmware.form.updateFirmware.accessKeyExpiration') }}
      </dt>
      <dd>
        <span v-if="hasLicenses">--</span>
        <span v-else>
          {{ $filters.formatDate(firmwareAccessKeyInfo.expirationDate) }}
        </span>
      </dd>
      <router-link
        class="d-inline-block mb-4 m-md-0"
        to="/resource-management/capacity-on-demand"
      >
        {{ $t('pageFirmware.form.updateFirmware.manageAccessKeys') }}
      </router-link>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import stores from '@/store';

const licenseStore = stores.LicenseStore();

const firmwareAccessKeyInfo = computed(() => {
  return licenseStore.firmwareAccessKeyInfo;
});

const hasLicenses = computed(() => {
  return !Object.keys(licenseStore.licensesGetter).length;
});
</script>

<style lang="scss" scoped>
dl :deep(a) {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
