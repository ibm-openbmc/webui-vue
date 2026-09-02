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
import { onBeforeMount, computed, ref } from 'vue';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { useFieldCoreOverride } from '@/api/composables/useFieldCoreOverride';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';

const systemStore = stores.SystemStore();
const licenseStore = stores.LicenseStore();

const { isFetching, isError, refetch } = useFieldCoreOverride();

// Expose refetch for parent components
defineExpose({
  refetch,
});

// 1120-vue3 waited for getLicenses() + getSystem() + getBiosAttributes().
// Track the Vuex side-calls as an extra loading flag.
const isExtraLoading = ref(true);

// Combined: BIOS query (shared with children) + Vuex side-calls
const isPageFetching = computed(() => isFetching.value || isExtraLoading.value);

onBeforeMount(() => {
  Promise.all([licenseStore.getLicenses(), systemStore.getSystem()]).finally(
    () => {
      isExtraLoading.value = false;
    },
  );
});

usePageLoadingBar(isPageFetching, isError);
</script>
