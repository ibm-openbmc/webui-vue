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
import {
  onBeforeMount,
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
  ref,
} from 'vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { useFieldCoreOverride } from '@/api/composables/useFieldCoreOverride';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';

const systemStore = stores.SystemStore();
const licenseStore = stores.LicenseStore();

const { isFetching, isError, refetch } = useFieldCoreOverride();
const { startLoader, endLoader, hideLoader } = useLoadingBar();

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

// Child components (FieldCoreOverrideInfo, FieldCoreOverrideConfiguration) share
// the same BIOS query — watch isPageFetching from script-setup time to catch the
// fetch before onMounted fires.
let mountFetchDone = false;
let awaitingFetch = false;

watch(
  isPageFetching,
  (fetching) => {
    if (mountFetchDone) return;
    if (fetching) {
      if (!awaitingFetch) {
        awaitingFetch = true;
        startLoader();
      }
    } else if (awaitingFetch) {
      awaitingFetch = false;
      mountFetchDone = true;
      endLoader();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (!awaitingFetch) mountFetchDone = true;
});

onBeforeUnmount(() => {
  hideLoader();
});
</script>
