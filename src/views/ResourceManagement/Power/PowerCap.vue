<template>
  <div>
    <page-section>
      <BRow>
        <BCol sm="8" md="6" xl="12">
          <dl>
            <dt>
              {{ $t('pagePower.powerConsumption') }}
              <info-tooltip :title="$t('pagePower.powerConsumptionTooltip')" />
            </dt>
            <dd>
              {{
                powerConsumptionValue
                  ? `${powerConsumptionValue} W`
                  : $t('global.status.notAvailable')
              }}
            </dd>
          </dl>
        </BCol>
      </BRow>

      <BForm aria-label="power-cap" @submit.prevent="submitForm">
        <BFormGroup
          :disabled="loading || safeMode || powerCapMinValue === 0"
          class="form-group"
          aria-label="power-cap-setting"
        >
          <BRow>
            <BCol sm="8" md="6" xl="12">
              <BFormGroup
                :label="$t('pagePower.powerCapSettingLabel')"
                class="form-group"
                aria-label="power-cap-setting-label"
              >
                <BFormCheckbox
                  v-model="isPowerCapEnabledLocal"
                  data-test-id="power-checkbox-togglePowerCapField"
                  name="power-control-mode"
                >
                  {{ $t('pagePower.powerCapSettingData') }}
                </BFormCheckbox>
              </BFormGroup>
            </BCol>
          </BRow>

          <BRow>
            <BCol sm="8" md="6" xl="3">
              <BFormGroup
                id="input-group-1"
                :label="$t('pagePower.powerCapLabel')"
                label-for="input-1"
                aria-label="power-cap-label"
                class="form-group"
              >
                <BFormText id="power-help-text">
                  {{
                    $t('pagePower.powerCapLabelTextInfo', {
                      min: dataFormatter(powerCapMinValue),
                      max: dataFormatter(powerCapMaxValue),
                    })
                  }}
                </BFormText>

                <BFormInput
                  id="input-1"
                  v-model="powerCapLocal"
                  data-test-id="power-input-powerCap"
                  type="number"
                  aria-describedby="power-help-text"
                  :number="true"
                  :state="getValidationState(v$.powerCapLocal)"
                  @update:model-value="v$.powerCapLocal.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback id="input-live-feedback" role="alert">
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: powerCapMinValue,
                      max: powerCapMaxValue,
                    })
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </BCol>
          </BRow>

          <BButton
            variant="primary"
            type="submit"
            data-test-id="power-button-savePowerCapValue"
          >
            {{ $t('global.action.save') }}
          </BButton>
        </BFormGroup>
      </BForm>
    </page-section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, between, numeric } from '@vuelidate/validators';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import PageSection from '@/components/Global/PageSection.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import { usePowerControl } from '@/api/composables/usePowerControl';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();
const { dataFormatter } = useDataFormatterGlobal();
const { getValidationState } = useVuelidateComposable();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

// Use VueQuery composable for power control
const {
  powerConsumption,
  powerControlMode,
  isPowerCapEnabled,
  powerCap,
  powerCapMin,
  powerCapMax,
  setPowerCap,
} = usePowerControl();

// Local state for form
const isPowerCapEnabledLocal = ref(false);
const powerCapLocal = ref(null);

// Sync with composable data
watch(
  [isPowerCapEnabled, powerCap],
  ([enabled, cap]) => {
    isPowerCapEnabledLocal.value = enabled ?? false;
    powerCapLocal.value = cap;
  },
  { immediate: true },
);

const powerConsumptionValue = computed(() => powerConsumption.value);
const powerCapMinValue = computed(() => powerCapMin.value ?? 0);
const powerCapMaxValue = computed(() => powerCapMax.value ?? 0);

const powerControlModeValue = computed(() => {
  return isPowerCapEnabledLocal.value ? 'Automatic' : 'Disabled';
});

const rules = computed(() => ({
  powerCapLocal: {
    required,
    numeric,
    betweenValue: between(powerCapMinValue.value, powerCapMaxValue.value),
  },
}));

const v$ = useVuelidate(rules, { powerCapLocal });

async function submitForm() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  startLoader();

  try {
    await setPowerCap({
      powerControlMode: powerControlModeValue.value,
      powerCap: powerCapLocal.value,
    });
  } catch (error) {
    // Error toast is handled by the composable
  } finally {
    endLoader();
  }
}
</script>
