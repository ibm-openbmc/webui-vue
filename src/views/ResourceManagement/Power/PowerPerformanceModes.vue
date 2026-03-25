<template>
  <div>
    <page-section :section-title="$t('pagePower.powerPerformanceModesTitle')">
      <BRow class="mb-3">
        <BCol md="9" xl="8">
          <alert v-if="oemModeValue" variant="info" class="mb-4">
            <p class="mb-0">
              <b>{{ $t('pagePower.oemMode.message1') }} </b
              >{{ ' ' + $t('pagePower.oemMode.message2') }}
            </p></alert
          >
        </BCol>
        <BCol xl="10">
          <BButton v-b-toggle.collapse-role-table variant="link">
            <icon-chevron />
            {{ $t('pagePower.powerPerformanceModesDropdownLabel') }}
          </BButton>
          <BCollapse id="collapse-role-table" class="mt-3">
            <table-power-performance-modes
              :power-performance-mode-values="powerPerformanceModeValuesData"
            />
          </BCollapse>
        </BCol>
      </BRow>
      <BRow>
        <BCol>
          <BForm
            id="form-power-saver"
            aria-label="power-and-performance"
            @submit.prevent="handlePowerPerformanceSubmit"
          >
            <BFormGroup
              aria-label="power-and-performance-form"
              class="form-group"
              :disabled="loading || safeMode"
            >
              <BRow>
                <BCol>
                  <BFormGroup
                    class="form-group"
                    :label="$t('pagePower.selectModeLabel')"
                  >
                    <BFormRadio
                      v-model="powerPerformanceModeLocal"
                      value="MaximumPerformance"
                      @change="setPowerPerformanceValue('MaximumPerformance')"
                      >{{
                        $t('pagePower.selectMode.maximumPerformance.primary')
                      }}
                      <info-tooltip
                        :title="
                          $t(
                            'pagePower.selectMode.maximumPerformance.secondary',
                          )
                        "
                      />
                    </BFormRadio>
                    <BFormRadio
                      v-model="powerPerformanceModeLocal"
                      value="EfficiencyFavorPower"
                      @change="setPowerPerformanceValue('EfficiencyFavorPower')"
                      >{{ $t('pagePower.selectMode.energyEfficient.primary') }}
                      <info-tooltip
                        :title="
                          $t('pagePower.selectMode.energyEfficient.secondary')
                        "
                    /></BFormRadio>
                    <BFormRadio
                      v-model="powerPerformanceModeLocal"
                      value="PowerSaving"
                      @change="setPowerPerformanceValue('PowerSaving')"
                      >{{
                        $t('pagePower.selectMode.maximumEnergySaver.primary')
                      }}
                      <info-tooltip
                        :title="
                          $t(
                            'pagePower.selectMode.maximumEnergySaver.secondary',
                          )
                        "
                    /></BFormRadio>
                  </BFormGroup>
                </BCol>
              </BRow>
              <BButton variant="primary" type="submit" form="form-power-saver">
                {{ $t('pagePower.submitButton') }}
              </BButton>
            </BFormGroup>
          </BForm>
        </BCol>
      </BRow>

      <modal-power-performance-modes
        :title="powerPerformanceModeLocal"
        @ok="savePowerPerformanceMode"
      />
    </page-section>
  </div>
</template>

<script setup>
import Alert from '@/components/Global/Alert.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import { ref, computed, watch } from 'vue';
import eventBus from '@/eventBus';
import { loading } from '@/components/Composables/useLoadingBarComposable';
import PageSection from '@/components/Global/PageSection.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import ModalPowerPerformanceModes from './ModalPowerPerformanceModes.vue';
import TablePowerPerformanceModes from './TablePowerPerformanceModes.vue';
import { usePowerPerformanceMode } from '@/api/composables/usePowerControl';

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

// Use VueQuery composables
const {
  powerPerformanceMode,
  powerPerformanceModeValues,
  oemMode,
  setPowerPerformanceMode,
} = usePowerPerformanceMode();

// Local state for form
const powerPerformanceModeLocal = ref(null);

// Sync with composable data
watch(
  powerPerformanceMode,
  (mode) => {
    if (mode) {
      powerPerformanceModeLocal.value = mode;
    }
  },
  { immediate: true },
);

const powerPerformanceModeValuesData = computed(
  () => powerPerformanceModeValues.value,
);
const oemModeValue = computed(() => oemMode.value);

function setPowerPerformanceValue(data) {
  powerPerformanceModeLocal.value = data;
}

async function savePowerPerformanceMode() {
  if (!powerPerformanceModeLocal.value) return;

  try {
    await setPowerPerformanceMode(powerPerformanceModeLocal.value);
    // Idle power saver data will auto-refresh via query invalidation
  } catch (error) {
    // Error toast is handled by the composable
    // Reset to current value on error
    powerPerformanceModeLocal.value = powerPerformanceMode.value;
  }
}

function handlePowerPerformanceSubmit() {
  if (powerPerformanceModeLocal.value) {
    showConfirmationModal();
  }
}

function showConfirmationModal() {
  eventBus.emit('modal-power-performance-modes');
}
</script>

<style lang="scss" scoped>
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
</style>
