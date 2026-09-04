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
import stores from '../../../store';
import { ref, computed, watch, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import useToast from '@/components/Composables/useToastComposable';
import { serverStateMapper } from '../../../store/modules/GlobalStore';

const { successToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();
const systemStore = stores.SystemStore();

const isLampTestEditable = ref(true);

onBeforeMount(() => {
  return systemStore.getSystem().finally(() => {
    // Emit initial data fetch complete to parent component
    eventBus.emit('hardware-status-service-complete');
  });
});

const systems = computed(() => {
  let systemData = systemStore.getSystems[0];
  return systemData ? systemData : {};
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const powerStatus = computed(() => {
  let serverStatusValue = serverStatus.value;
  if (serverStatus.value === 'unreachable') {
    return `global.status.off`;
  }
  // To check if serverStatus.value returns state from redfish without mapping to on,off etc
  if (serverStatusValue.includes('xyz.openbmc_project')) {
    serverStatusValue = serverStateMapper(serverStatusValue);
  }
  return `global.status.${serverStatusValue}`;
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
  if (lampTestState) {
    globalStore.setLampTestInProgress(true);
  }
  systemStore
    .changeLampTestState(lampTestState)
    .then((message) => {
      successToast(message);
      isLampTestEditable.value = false;
      setTimeout(() => {
        isLampTestEditable.value = true;
        // Lamp test auto-completes after 4 minutes — move to Completed now
        if (lampTestState) {
          globalStore.setLampTestInProgress({
            inProgress: false,
            success: true,
          });
        }
      }, 240000);
    })
    .catch(({ message }) => {
      if (lampTestState) {
        globalStore.setLampTestInProgress({
          inProgress: false,
          success: false,
        });
      }
      errorToast(message);
    });
}
</script>
