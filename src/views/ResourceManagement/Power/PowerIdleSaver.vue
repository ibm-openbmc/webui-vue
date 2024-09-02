<template>
  <div>
    <page-section :section-title="$t('pagePower.idlePower')">
      <BRow>
        <BCol sm="8" md="6" xl="12">
          <BFormGroup class="form-group">
            <BFormCheckbox
              v-model="idlePowerSaver.isIdlePowerSaverEnabled"
              :disabled="loading || safeMode"
              data-test-id="power-checkbox-toggleIdlePower"
              name="idle-power-saver"
            >
              {{ $t('pagePower.enableIdlePower') }}
            </BFormCheckbox>
          </BFormGroup>
        </BCol>
      </BRow>

      <BForm
        id="idle-power-saver"
        novalidate
        @submit.prevent="saveIdlePowerSaverData"
        @reset.prevent="resetIdlePowerSaverData"
      >
        <BFormGroup :disabled="loading || safeMode">
          <div class="fw-bold mb-2">{{ $t('pagePower.toEnter') }}</div>
          <BRow>
            <BCol sm="8" md="6" xl="4">
              <BFormGroup
                id="input-group-1"
                :label="$t('pagePower.delayTime')"
                label-for="input-1"
              >
                <BFormInput
                  id="input-1"
                  v-model.number="idlePowerSaver.enterDwellTimeSeconds"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-enterDwellTimeSeconds"
                  type="number"
                  :state="
                    getValidationState(v$.idlePowerSaver.enterDwellTimeSeconds)
                  "
                  @update:model-value="v$.idlePowerSaver.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback role="alert">
                  {{
                    $t('pagePower.delayTimeValidation.delayTimeRange', {
                      min: delayTimeMin,
                      max: delayTimeMax,
                    })
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </BCol>
            <BCol sm="8" md="6" xl="4">
              <BFormGroup
                id="input-group-2"
                :label="$t('pagePower.utilizationThreshold')"
                label-for="input-2"
              >
                <BFormInput
                  id="input-2"
                  v-model.number="idlePowerSaver.enterUtilizationPercent"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-enterUtilizationPercent"
                  type="number"
                  :state="
                    getValidationState(
                      v$.idlePowerSaver.enterUtilizationPercent,
                    )
                  "
                  @update:model-value="v$.idlePowerSaver.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback role="alert">
                  {{
                    v$.idlePowerSaver.enterUtilizationPercent.between.$invalid
                      ? $t(
                          'pagePower.utilizationPercentValidation.utilizationRange',
                          {
                            min: utilizationThresholdMin,
                            max: utilizationThresholdMax,
                          },
                        )
                      : $t(
                          'pagePower.utilizationPercentValidation.enterUtilization',
                        )
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </BCol>
          </BRow>
          <div class="fw-bold mb-2">{{ $t('pagePower.toExit') }}</div>
          <BRow>
            <BCol sm="8" md="6" xl="4">
              <BFormGroup
                id="input-group-3"
                :label="$t('pagePower.delayTime')"
                label-for="input-3"
              >
                <BFormInput
                  id="input-3"
                  v-model.number="idlePowerSaver.exitDwellTimeSeconds"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-exitDwellTimeSeconds"
                  type="number"
                  :state="
                    getValidationState(v$.idlePowerSaver.exitDwellTimeSeconds)
                  "
                  @update:model-value="v$.idlePowerSaver.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback role="alert">
                  {{
                    $t('pagePower.delayTimeValidation.delayTimeRange', {
                      min: delayTimeMin,
                      max: delayTimeMax,
                    })
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </BCol>
            <BCol sm="8" md="6" xl="4">
              <BFormGroup
                id="input-group-4"
                :label="$t('pagePower.utilizationThreshold')"
                label-for="input-4"
              >
                <BFormInput
                  id="input-4"
                  v-model.number="idlePowerSaver.exitUtilizationPercent"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-exitUtilizationPercent"
                  type="number"
                  :state="
                    getValidationState(v$.idlePowerSaver.exitUtilizationPercent)
                  "
                  @update:model-value="v$.idlePowerSaver.$touch()"
                ></BFormInput>

                <BFormInvalidFeedback role="alert">
                  {{
                    v$.idlePowerSaver.exitUtilizationPercent.between.$invalid
                      ? $t(
                          'pagePower.utilizationPercentValidation.utilizationRange',
                          {
                            min: utilizationThresholdMin,
                            max: utilizationThresholdMax,
                          },
                        )
                      : $t(
                          'pagePower.utilizationPercentValidation.exitUtilization',
                        )
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </BCol>
          </BRow>
          <BRow>
            <BCol>
              <BButton variant="primary" type="submit" form="idle-power-saver">
                {{ $t('pagePower.idlePowerSubmitUpdate') }}
              </BButton>
              <BButton
                variant="secondary"
                type="reset"
                form="idle-power-saver"
                class="ms-3"
              >
                {{ $t('pagePower.idlePowerSubmitReset') }}
              </BButton>
            </BCol>
          </BRow>
        </BFormGroup>
      </BForm>
    </page-section>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { between, minValue, maxValue } from '@vuelidate/validators';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import PageSection from '@/components/Global/PageSection.vue';
import { PowerControlStore } from '@/store';

const { startLoader, endLoader, hideLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();
const { getValidationState } = useVuelidateComposable();

const powerControlStore = PowerControlStore();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const delayTimeMin = ref(10); // TODO update once redfish provides min/max
const delayTimeMax = ref(600);
const utilizationThresholdMin = ref(1);
const utilizationThresholdMax = ref(95);

const idlePowerSaver = ref({
  isIdlePowerSaverEnabled: null,
  enterDwellTimeSeconds: null,
  exitDwellTimeSeconds: null,
  enterUtilizationPercent: null,
  exitUtilizationPercent: null,
});

const idlePowerSaverData = computed(() => {
  return powerControlStore.idlePowerSaverDataGetter;
});

const rules = computed(() => ({
  idlePowerSaver: {
    enterDwellTimeSeconds: {
      between: between(delayTimeMin.value, delayTimeMax.value),
    },
    exitDwellTimeSeconds: {
      between: between(delayTimeMin.value, delayTimeMax.value),
    },
    enterUtilizationPercent: {
      between: between(
        utilizationThresholdMin.value,
        utilizationThresholdMax.value,
      ),
      maxValue: maxValue(idlePowerSaver.value.exitUtilizationPercent),
    },
    exitUtilizationPercent: {
      between: between(
        utilizationThresholdMin.value,
        utilizationThresholdMax.value,
      ),
      minValue: minValue(idlePowerSaver.value.enterUtilizationPercent),
    },
  },
}));

const v$ = useVuelidate(rules, { idlePowerSaver });

function setIdlePowerSaveFormValues(data) {
  idlePowerSaver.value.isIdlePowerSaverEnabled = data?.Enabled;
  idlePowerSaver.value.enterDwellTimeSeconds = data?.EnterDwellTimeSeconds;
  idlePowerSaver.value.exitDwellTimeSeconds = data?.ExitDwellTimeSeconds;
  idlePowerSaver.value.enterUtilizationPercent = data?.EnterUtilizationPercent;
  idlePowerSaver.value.exitUtilizationPercent = data?.ExitUtilizationPercent;
}

function saveIdlePowerSaverData() {
  v$.value.idlePowerSaver.$touch();
  if (v$.value.idlePowerSaver.$invalid) return;
  startLoader();
  return powerControlStore
    .setIdlePowerSaverData(idlePowerSaver.value)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => endLoader());
}

function resetIdlePowerSaverData() {
  v$.value.idlePowerSaver.$touch();
  if (v$.value.idlePowerSaver.$invalid) return;
  startLoader();
  return powerControlStore
    .resetIdlePowerSaver()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      powerControlStore.getIdlePowerSaverData().then(() => {
        setIdlePowerSaveFormValues(idlePowerSaverData.value);
      });
      endLoader();
    });
}

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  powerControlStore.getIdlePowerSaverData().finally(() => {
    setIdlePowerSaveFormValues(idlePowerSaverData.value);
    endLoader();
  });
});
</script>
