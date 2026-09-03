<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.ibmiServiceFunctions')" />
    <BRow>
      <BCol v-if="isIBMi && !isLoading" md="8">
        <BRow>
          <BCol>
            <alert variant="info" class="mb-4">
              <span>
                {{
                  $t(
                    'pageIbmiServiceFunctions.alert.osRunningIbmiServiceFunctions',
                  )
                }}
              </span>
            </alert>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="activateDST-label">
                {{
                  $t('pageIbmiServiceFunctions.activateDedicatedServiceTool')
                }}
              </dt>
              <dd id="activateDST-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.activateDedicatedServiceToolDesc',
                  )
                }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(21)"
              @click="exceuteFunction(21)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="consoleServiceFunction-label">
                {{ $t('pageIbmiServiceFunctions.consoleServiceFunction') }}
              </dt>
              <dd id="consoleServiceFunction-description">
                {{ $t('pageIbmiServiceFunctions.consoleServiceFunctionDesc') }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(65)"
              @click="exceuteFunction(65)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="diskUnitIOP-label">
                {{ $t('pageIbmiServiceFunctions.diskUnitIOP') }}
              </dt>
              <dd id="diskUnitIOP-description">
                {{ $t('pageIbmiServiceFunctions.diskUnitIOPDesc') }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(67)"
              @click="exceuteFunction(67)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="concurrentMaintenancePowerOff-label">
                {{
                  $t('pageIbmiServiceFunctions.concurrentMaintenancePowerOff')
                }}
              </dt>
              <dd id="concurrentMaintenancePowerOff-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.concurrentMaintenancePowerOffDesc',
                  )
                }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(68)"
              @click="exceuteFunction(68)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="concurrentMaintenancePowerOn-label">
                {{
                  $t('pageIbmiServiceFunctions.concurrentMaintenancePowerOn')
                }}
              </dt>
              <dd id="concurrentMaintenancePowerOn-description">
                {{
                  $t(
                    'pageIbmiServiceFunctions.concurrentMaintenancePowerOnDesc',
                  )
                }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(69)"
              @click="exceuteFunction(69)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow class="section-divider">
          <BCol class="d-flex align-items-center justify-content-between">
            <dl class="mt-3 mr-3 w-75">
              <dt id="iopControlStorageDump-label">
                {{ $t('pageIbmiServiceFunctions.iopControlStorageDump') }}
              </dt>
              <dd id="iopControlStorageDump-description">
                {{ $t('pageIbmiServiceFunctions.iopControlStorageDumpDesc') }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(70)"
              @click="exceuteFunction(70)"
            >
              {{ $t('pageIbmiServiceFunctions.execute') }}
            </BButton>
          </BCol>
        </BRow>
      </BCol>
      <BCol v-else-if="!isLoading">
        <BRow>
          <BCol>
            <alert variant="danger" class="mb-4">
              <span>
                {{ $t('pageIbmiServiceFunctions.alert.notIBMi') }}
              </span>
            </alert>
          </BCol>
        </BRow>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import { computed, onBeforeMount, watch, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useToast from '@/components/Composables/useToastComposable';
import { useIBMiServiceFunctions } from '@/api/composables/useIBMiServiceFunctions';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import { useBootSettings } from '@/api/composables/useBootSettings';
import stores from '@/store';
import Alert from '@/components/Global/Alert.vue';

const { successToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();

const {
  availableFunctions,
  isLoading,
  isFetching,
  executeServiceFunction: executeServiceFunctionApi,
} = useIBMiServiceFunctions();
const { biosAttributes } = useBootSettings();

// 1120-vue3 waited for getBootProgress() + fetchBiosAttributes() + the system
// query. Track the Vuex side-calls as an extra loading flag and combine.
const isExtraLoading = ref(true);
const isPageFetching = computed(() => isFetching.value || isExtraLoading.value);

usePageLoadingBar(isPageFetching);

onBeforeMount(async () => {
  try {
    await globalStore.getBootProgress();
  } catch {
    errorToast('Failed to load service functions');
  } finally {
    isExtraLoading.value = false;
  }
});

const isOSRunning = computed(() => {
  return globalStore.isOSRunningGetter;
});

const isIBMi = computed(() => {
  if (
    attributeKeys.value?.pvm_default_os_type === 'Default' ||
    attributeKeys.value?.pvm_default_os_type === 'IBM I'
  ) {
    return true;
  } else {
    return false;
  }
});

const attributeKeys = computed(() => biosAttributes.value);

const exceuteFunction = async (value) => {
  try {
    const message = await executeServiceFunctionApi(value);
    successToast(message);
    // availableFunctions updates automatically via query invalidation + watch
  } catch (error) {
    errorToast(error.message);
  }
};

const isFunctionDisabled = (value) => {
  if (!isOSRunning.value) {
    return true;
  } else if (availableFunctions.value.includes(value)) {
    return false;
  } else {
    return true;
  }
};
</script>
