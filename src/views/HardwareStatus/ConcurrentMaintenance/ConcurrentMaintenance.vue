<template>
  <BContainer fluid="xl">
    <BRow>
      <BCol md="8" xl="8">
        <page-title :title="$t('appPageTitle.concurrentMaintenance')" />
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div class="fw-bold">
            {{ $t('pageConcurrentMaintenance.alert.title') }}
          </div>
          <div>
            {{ $t('pageConcurrentMaintenance.alert.message') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.tod') }}
          </dt>
          <dd>
            <BFormCheckbox
              v-if="readyToRemoveState !== null"
              id="battery"
              v-model="readyToRemoveState"
              switch
              @update:model-value="changeReadyToRemoveState"
            >
              <span v-if="readyToRemoveState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
            <p v-else>--</p>
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.controlPanel') }}
          </dt>
          <dd>
            <BFormCheckbox
              v-if="readyToRemoveControlPanelState !== null"
              id="base"
              v-model="readyToRemoveControlPanelState"
              switch
              @update:model-value="changeControlPanelState"
            >
              <span v-if="readyToRemoveControlPanelState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
            <p v-else>--</p>
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" class="d-flex align-items-center justify-content-between">
        <dl class="mr-3">
          <dt>
            {{ $t('pageConcurrentMaintenance.controlPanelDisp') }}
          </dt>
          <dd>
            <BFormCheckbox
              v-if="readyToRemoveControlPanelDispState !== null"
              id="lcd"
              v-model="readyToRemoveControlPanelDispState"
              switch
              @update:model-value="changeControlPanelDispState"
            >
              <span v-if="readyToRemoveControlPanelDispState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </BFormCheckbox>
            <p v-else>--</p>
          </dd>
        </dl>
      </BCol>
    </BRow>
  </BContainer>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';

const { successToast, errorToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();

const concurrentMaintenanceStore = stores.ConcurrentMaintenanceStore();

const readyToRemoveState = computed({
  get() {
    return concurrentMaintenanceStore.ReadyToRemoveGetter;
  },
  set(newValue) {
    concurrentMaintenanceStore.readyToRemove = newValue;
  },
});

const readyToRemoveControlPanelState = computed({
  get() {
    return concurrentMaintenanceStore.ReadyToRemoveControlPanelGetter;
  },
  set(newValue) {
    concurrentMaintenanceStore.readyToRemoveControlPanel = newValue;
  },
});

const readyToRemoveControlPanelDispState = computed({
  get() {
    return concurrentMaintenanceStore.ReadyToRemoveControlPanelDispGetter;
  },
  set(newValue) {
    concurrentMaintenanceStore.readyToRemoveControlPanelDisp = newValue;
  },
});

onBeforeMount(() => {
  startLoader();
  Promise.all([
    concurrentMaintenanceStore.fetchReadyToRemove(),
    concurrentMaintenanceStore.fetchControlPanel(),
    concurrentMaintenanceStore.fetchControlPanelDisp(),
  ]).finally(() => {
    endLoader();
  });
});

function changeReadyToRemoveState(state) {
  concurrentMaintenanceStore
    .saveReadyToRemoveState(state)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function changeControlPanelState(state) {
  concurrentMaintenanceStore
    .saveReadyToRemoveControlPanel(state)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function changeControlPanelDispState(state) {
  concurrentMaintenanceStore
    .saveReadyToRemoveControlPanelDisp(state)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}
</script>
