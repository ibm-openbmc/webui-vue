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
                powerConsumption
                  ? `${powerConsumption} W`
                  : $t('global.status.notAvailable')
              }}
            </dd>
          </dl>
        </BCol>
      </BRow>

      <BForm @submit.prevent="submitForm">
        <BFormGroup
          :disabled="loading || safeMode || powerCapMin === 0"
          class="form-group"
        >
          <BRow>
            <BCol sm="8" md="6" xl="12">
              <BFormGroup
                :label="$t('pagePower.powerCapSettingLabel')"
                class="form-group"
              >
                <BFormCheckbox
                  v-model="isPowerCapEnabled"
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
                class="form-group"
              >
                <BFormText id="power-help-text">
                  {{
                    $t('pagePower.powerCapLabelTextInfo', {
                      min: dataFormatter(powerCapMin),
                      max: dataFormatter(powerCapMax),
                    })
                  }}
                </BFormText>

                <BFormInput
                  id="input-1"
                  v-model="powerCap"
                  data-test-id="power-input-powerCap"
                  type="number"
                  aria-describedby="power-help-text"
                  :number="true"
                  :state="getValidationState(v$.powerCap)"
                  @update:model-value="v$.powerCap.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback id="input-live-feedback" role="alert">
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: powerCapMin,
                      max: powerCapMax,
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
import { computed, onBeforeMount } from 'vue';
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
import { PowerControlStore } from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();
const { dataFormatter } = useDataFormatterGlobal();
const { getValidationState } = useVuelidateComposable();

const powerControlStore = PowerControlStore();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const powerConsumption = computed(() => {
  return powerControlStore.powerConsumptionGetter;
});

const powerControlMode = computed(() => {
  return powerControlStore.powerControlModeGetter;
});

const isPowerCapEnabled = computed({
  get() {
    return powerControlStore.isPowerCapEnabled;
  },
  set(value) {
    const newValue = value === true ? 'Automatic' : 'Disabled';
    powerControlStore.powerControlMode = newValue;
  },
});

const powerCap = computed({
  get() {
    return powerControlStore.powerCapGetter;
  },
  set(value) {
    powerControlStore.powerCap = value;
  },
});

const powerCapMin = computed(() => {
  return powerControlStore.powerCapMinGetter;
});

const powerCapMax = computed(() => {
  return powerControlStore.powerCapMaxGetter;
});

const rules = computed(() => ({
  powerCap: {
    required,
    numeric,
    betweenValue: between(powerCapMin.value, powerCapMax.value),
  },
}));

const v$ = useVuelidate(rules, { powerCap });

function submitForm() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  startLoader();

  powerControlStore
    .setPowerControlAndCap({
      powerControlMode: powerControlMode.value,
      powerCap: powerCap.value,
    })
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => endLoader());
}

onBeforeMount(() => {
  startLoader();
  powerControlStore.getPowerControl().finally(() => endLoader());
});
</script>
