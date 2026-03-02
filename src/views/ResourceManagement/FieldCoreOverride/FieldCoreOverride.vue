<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.fieldCoreOverride')"
      :description="$t('pageFieldCoreOverride.pageDescription')"
    />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-5">
          <h5 class="mb-0 fw-bold">
            {{ $t('pageFieldCoreOverride.alert.title') }}
          </h5>
          <p>
            {{ $t('pageFieldCoreOverride.alert.description') }}
          </p>
        </alert>
      </BCol>
    </BRow>

    <current-configuration />
    <change-configuration />
  </BContainer>
</template>

<script setup>
import { watch, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { useFieldCoreOverride } from '@/api/composables/useFieldCoreOverride';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const systemStore = stores.SystemStore();
const licenseStore = stores.LicenseStore();

const { isFetching, isError } = useFieldCoreOverride();

onBeforeMount(() => {
  startLoader();
  Promise.all([licenseStore.getLicenses(), systemStore.getSystem()]).finally(
    () => endLoader(),
  );
});

// Manage loading bar for BIOS query fetching state
watch(isFetching, (fetching) => {
  if (fetching) {
    startLoader();
  } else {
    endLoader();
  }
});

// Stop the loading bar when the BIOS fetch fails
watch(isError, (hasError) => {
  if (hasError) {
    endLoader();
  }
});

onBeforeRouteLeave(() => {
  hideLoader();
});
</script>
