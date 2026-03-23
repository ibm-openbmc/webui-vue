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
              v-model="localLedState"
              data-test-id="overviewInventory-checkbox-identifyLed"
              switch
              @change="toggleIdentifyLedSwitch(localLedState)"
            >
              <span v-if="localLedState">
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
import { ref, watch } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useToast from '@/components/Composables/useToastComposable';
import i18n from '@/i18n';
import {
  useOverviewInventory,
  useUpdateIdentifyLed,
} from '@/api/composables/useOverview';

const { successToast, errorToast } = useToast();

// Use VueQuery composables
const { systems } = useOverviewInventory();
const { updateIdentifyLedAsync } = useUpdateIdentifyLed();

// Create a local ref that syncs with the query data
const localLedState = ref(false);

// Watch for changes in the query data and update local state
watch(
  () => systems.value?.locationIndicatorActive,
  (newValue) => {
    if (newValue !== undefined) {
      localLedState.value = newValue;
    }
  },
  { immediate: true },
);

const toggleIdentifyLedSwitch = async (state) => {
  try {
    await updateIdentifyLedAsync(state);
  } catch (error) {
    // Error toast is handled by the composable
    // Revert local state on error
    localLedState.value = !state;
  }
};
</script>
