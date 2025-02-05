<template>
  <page-section
    :section-title="$t('pageInventory.systemIndicator.sectionTitle')"
  >
    <div class="form-background">
      <BRow class="pl-4 pt-4 pb-1 ms-4">
        <BCol sm="6" md="3">
          <dl>
            <dt>{{ $t('pageInventory.systemIndicator.powerStatus') }}</dt>
            <dd>
              {{ $t(powerStatus) }}
            </dd>
          </dl>
        </BCol>
        <BCol sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.identifyLed') }}
            </dt>
            <dd>
              <BFormCheckbox
                id="identifyLedSwitchService"
                v-model="systems.locationIndicatorActive"
                data-test-id="inventoryService-toggle-identifyLed"
                switch
                @change="
                  toggleIdentifyLedSwitch(systems.locationIndicatorActive)
                "
              >
                <span v-if="systems.locationIndicatorActive">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <BCol sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.attentionLed') }}
              <info-tooltip
                :title="
                  $t('pageInventory.systemIndicator.attentionLedToolTipInfo')
                "
              />
            </dt>
            <dd>
              <BFormCheckbox
                id="attentionLedSwitch"
                v-model="systems.sysAttentionLed"
                data-test-id="hardwareStatus-toggle-attentionLed"
                :disabled="!systems.sysAttentionLed"
                switch
                @change="
                  toggleSystemAttentionLedSwitch(systems.sysAttentionLed)
                "
              >
                <span v-if="systems.sysAttentionLed">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <BCol sm="6" md="3">
          <dl>
            <dt>
              {{ $t('pageInventory.systemIndicator.lampTest') }}
              <info-tooltip
                :title="$t('pageInventory.systemIndicator.tooltipInfo')"
              />
            </dt>
            <dd>
              <BFormCheckbox
                id="lampSwitch"
                v-model="systems.lampTest"
                :disabled="systems.lampTest"
                data-test-id="hardwareStatus-toggle-lampTest"
                switch
                @change="toggleLampTestSwitch(systems.lampTest)"
              >
                <span v-if="systems.lampTest">
                  {{ $t('global.status.on') }}
                </span>
                <span v-else>{{ $t('global.status.off') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
      </BRow>
    </div>
  </page-section>
</template>
<script setup>
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import PageSection from '@/components/Global/PageSection.vue';
import { SystemStore } from '../../../store';
import { ref, computed, watch, onBeforeMount } from 'vue';
import { GlobalStore } from '../../../store';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';

const { successToast, errorToast } = useToast();
const globalStore = GlobalStore();
const systemStore = SystemStore();
const isLampTestEditable = ref(true);

const systems = computed(() => {
  let systemData = systemStore.getSystems[0];
  return systemData ? systemData : {};
});

const serverStatus = computed(() => {
  return globalStore.serverStatus;
});
const powerStatus = computed(() => {
  if (serverStatus.value === 'unreachable') {
    return `global.status.off`;
  }
  return `global.status.${serverStatus.value}`;
});

watch(
  () => systems,
  (value) => {
    if (value.lampTest) {
      isLampTestEditable.value = false;
      setTimeout(() => {
        isLampTestEditable.value = true;
      }, 240000);
    }
  },
);

onBeforeMount(() => {
  return systemStore.getSystem().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-service-complete');
  });
});

function toggleIdentifyLedSwitch(ledState) {
  systemStore
    .changeIdentifyLedState(ledState)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function toggleSystemAttentionLedSwitch(systemLedState) {
  systemStore
    .changeSystemAttentionLedState(systemLedState)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function toggleLampTestSwitch(lampTestState) {
  systemStore
    .changeLampTestState(lampTestState)
    .then((message) => {
      successToast(message);
      isLampTestEditable.value = false;
      setTimeout(() => {
        isLampTestEditable.value = true;
      }, 240000);
    })
    .catch(({ message }) => errorToast(message));
}
</script>
<style lang="scss" scoped>

</style>