<template>
  <overview-card
    :title="$t('pageOverview.inventory')"
    :to="`/hardware-status/inventory`"
  >
    <BRow class="mt-3">
      <BCol sm="6">
        <dl sm="6">
          <dt>{{ $t('pageOverview.systemIdentifyLed') }}</dt>
          <dd>
            <BFormCheckbox
              id="identifyLedSwitch"
              v-model="systems.locationIndicatorActive"
              data-test-id="overviewInventory-checkbox-identifyLed"
              switch
              @change="toggleIdentifyLedSwitch(systems.locationIndicatorActive)"
            >
              <span v-if="systems.locationIndicatorActive">
                {{ $t('global.status.on') }}
              </span>
              <span v-else>{{ $t('global.status.off') }}</span>
            </BFormCheckbox>
          </dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useToast from '@/components/Composables/useToastComposable';
import { SystemStore } from '@/store';
import eventBus from '@/eventBus';

const { successToast, errorToast } = useToast();

const systemStore = SystemStore();

onBeforeMount(() => {
  systemStore.getSystem().finally(() => {
      eventBus.emit('overview-inventory-complete');
    });
});

const systems = computed(() => {
  let systemData = systemStore.systems[0];
  return systemData ? systemData : {};
});

const toggleIdentifyLedSwitch = (state) => {
  systemStore.changeIdentifyLedState(state)
  .then((message) => successToast(message))
  .catch(({ message }) => {
    console.log(message);
    errorToast(message);
  });
};
</script>
