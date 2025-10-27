<template>
  <div>
    <page-section :section-title="$t('pagePower.powerPerformanceModesTitle')">
      <BRow class="mb-3">
        <BCol md="9" xl="8">
          <alert v-if="oemMode" variant="info" class="mb-4">
            <p class="mb-0">
              <b>{{ $t('pagePower.oemMode.message1') }} </b
              >{{ $t('pagePower.oemMode.message2') }}
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
                    <BFormRadio
                      v-model="powerPerformanceMode"
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
                      v-model="powerPerformanceMode"
                      value="EfficiencyFavorPower"
                      @change="setPowerPerformanceValue('EfficiencyFavorPower')"
                      >{{ $t('pagePower.selectMode.energyEfficient.primary') }}
                      <info-tooltip
                        :title="
                          $t('pagePower.selectMode.energyEfficient.secondary')
                        "
                    /></BFormRadio>
                    <BFormRadio
                      v-model="powerPerformanceMode"
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
        :title="powerPerformanceMode"
        @ok="savePowerPerformanceMode"
      />
    </page-section>
  </div>
</template>

<script setup>
import Alert from '@/components/Global/Alert.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
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
import stores from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();

const powerControlStore = stores.PowerControlStore();

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

onBeforeMount(() => {
  startLoader();
  powerControlStore.getPowerPerformanceMode().finally(() => {
    setPowerPerformanceValue(powerPerformanceModeData.value);
    endLoader();
  });
});

const powerPerformanceModeData = computed(() => {
  return powerControlStore.powerPerformanceModeGetter;
});

const powerPerformanceModeValues = computed(() => {
  return powerControlStore.powerPerformanceModeValuesGetter;
});

const oemMode = computed(() => {
  return powerControlStore.oemModeGetter;
});

function setPowerPerformanceValue(data) {
  powerPerformanceMode.value = data;
}

function savePowerPerformanceMode() {
  startLoader();
  powerControlStore
    .setPowerPerformanceMode(powerPerformanceMode.value)
    .then((message) => {
      successToast(message);
      powerControlStore.powerPerformanceMode = powerPerformanceMode.value;
    })
    .then(() => powerControlStore.getIdlePowerSaverData())
    .catch(({ message }) => {
      errorToast(message);
      powerControlStore
        .getPowerPerformanceMode()
        .then(() => setPowerPerformanceValue(powerPerformanceModeData.value));
    })
    .finally(() => endLoader());
}

function handlePowerPerformanceSubmit() {
  if (powerPerformanceMode.value) {
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
