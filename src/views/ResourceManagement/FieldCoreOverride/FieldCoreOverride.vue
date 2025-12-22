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
import { onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const systemStore = stores.SystemStore();
const fieldCoreOverrideStore = stores.FieldCoreOverrideStore();
const licenseStore = stores.LicenseStore();

onBeforeMount(() => {
  startLoader();
  Promise.all([
    licenseStore.getLicenses(),
    systemStore.getSystem(),
    fieldCoreOverrideStore.getBiosAttributes(),
  ]).finally(() => endLoader());
});

onBeforeRouteLeave(() => {
  hideLoader();
});
</script>
