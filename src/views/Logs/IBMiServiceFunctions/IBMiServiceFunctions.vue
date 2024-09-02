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
              <dt id="disableRemoteService-label">
                {{ $t('pageIbmiServiceFunctions.disableRemoteService') }}
              </dt>
              <dd id="disableRemoteService-description">
                {{ $t('pageIbmiServiceFunctions.disableRemoteServiceDesc') }}
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
              <dt id="enableRemoteService-label">
                {{ $t('pageIbmiServiceFunctions.enableRemoteService') }}
              </dt>
              <dd id="enableRemoteService-description">
                {{ $t('pageIbmiServiceFunctions.enableRemoteServiceDesc') }}
              </dd>
            </dl>
            <BButton
              variant="primary"
              :disabled="isFunctionDisabled(66)"
              @click="exceuteFunction(66)"
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
import { ref, computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import {
  GlobalStore,
  IBMiServiceFunctionsStore,
  BootSettingsStore,
} from '@/store';
import Alert from '@/components/Global/Alert.vue';

const globalStore = GlobalStore();
const ibmiServiceFunctionsStore = IBMiServiceFunctionsStore();
const bootSettingsStore = BootSettingsStore();
const { successToast, errorToast } = useToast();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

onBeforeRouteLeave(() => {
  hideLoader();
});

const isLoading = ref(false);
const isOSRunning = computed(() => {
  return globalStore.isOSRunningGetter;
});
const availableFunctions = computed(() => {
  return ibmiServiceFunctionsStore.serviceFunctionsGetter;
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
const attributeKeys = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});
onBeforeMount(() => {
  startLoader();
  isLoading.value = true;
  Promise.all([
    globalStore.getBootProgress(),
    ibmiServiceFunctionsStore.getAvailableServiceFunctions,
    bootSettingsStore.fetchBiosAttributes(),
  ]).finally(() => {
    isLoading.value = false;
    endLoader();
  });
});
const exceuteFunction = (value) => {
  ibmiServiceFunctionsStore
    .executeServiceFunction(value)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
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
