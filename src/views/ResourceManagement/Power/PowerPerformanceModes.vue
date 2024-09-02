<template>
  <div>
    <page-section :section-title="$t('pagePower.powerPerformanceModesTitle')">
      <BRow class="mb-3">
        <BCol xl="10">
          <BButton v-b-toggle.collapse-role-table variant="link">
            <icon-chevron />
            {{ $t('pagePower.powerPerformanceModesDropdownLabel') }}
          </BButton>
          <BCollapse id="collapse-role-table" class="mt-3">
            <table-power-performance-modes
              :power-performance-mode-values="powerPerformanceModeValues"
            />
          </BCollapse>
        </BCol>
      </BRow>
      <BRow>
        <BCol>
          <BForm
            id="form-power-saver"
            @submit.prevent="handlePowerPerformanceSubmit"
          >
            <BFormGroup class="form-group" :disabled="loading || safeMode">
              <BRow>
                <BCol>
                  <BFormGroup
                    class="form-group"
                    :label="$t('pagePower.selectModeLabel')"
                  >
                    <BFormRadioGroup
                      id="power-save-modes"
                      v-model="powerPerformanceMode"
                      :options="powerPerformanceModeOptions"
                      stacked
                    ></BFormRadioGroup>
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
        :title="powerPerformanceMode"
        @ok="savePowerPerformanceMode"
      />
    </page-section>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import PageSection from '@/components/Global/PageSection.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import ModalPowerPerformanceModes from './ModalPowerPerformanceModes.vue';
import TablePowerPerformanceModes from './TablePowerPerformanceModes.vue';
import { PowerControlStore } from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();

const powerControlStore = PowerControlStore();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const powerPerformanceMode = ref(null);

const powerPerformanceModeOptions = ref([
  { text: i18n.global.t('pagePower.selectMode.static'), value: 'Static' },
  {
    text: i18n.global.t('pagePower.selectMode.powerSaving'),
    value: 'PowerSaving',
  },
  {
    text: i18n.global.t('pagePower.selectMode.maximumPerformance'),
    value: 'MaximumPerformance',
  },
]);

const powerPerformanceModeData = computed(() => {
  return powerControlStore.powerPerformanceModeGetter;
});

const powerPerformanceModeValues = computed(() => {
  return powerControlStore.powerPerformanceModeValuesGetter;
});

function setPowerPerformanceValue(data) {
  powerPerformanceMode.value = data;
}

function savePowerPerformanceMode() {
  powerControlStore
    .setPowerPerformanceMode(powerPerformanceMode.value)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function handlePowerPerformanceSubmit() {
  if (powerPerformanceMode.value) {
    showConfirmationModal();
  }
}

function showConfirmationModal() {
  eventBus.emit('modal-power-performance-modes');
}

onBeforeMount(() => {
  startLoader();
  powerControlStore.getPowerPerformanceMode().finally(() => {
    setPowerPerformanceValue(powerPerformanceModeData.value);
    endLoader();
  });
});
</script>

<style lang="scss" scoped>
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
</style>
