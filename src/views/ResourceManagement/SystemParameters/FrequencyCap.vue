<template>
  <div>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mb-3 mr-3 w-75">
          <dt id="frequency-cap-label">
            {{ $t('pageSystemParameters.frequencyCap') }}
            <info-tooltip
              :title="
                $t('pageSystemParameters.parametersInfo') +
                ' ' +
                $t('pageSystemParameters.frequencyCapHelpText')
              "
            />
          </dt>
          <dd id="frequency-cap-description">
            {{ $t('pageSystemParameters.frequencyCapDescription') }}
          </dd>
        </dl>
        <BFormCheckbox
          id="frequency-cap-switch"
          v-model="frequencyRequestCurrentToggle"
          aria-labelledby="frequency-cap-label"
          aria-describedby="frequency-cap-description"
          :disabled="frequencyMax === 0 && frequencyMin === 0"
          switch
          @update:model-value="changeFrequencyRequestCurrent"
        >
          <span v-if="frequencyRequestCurrentToggle">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </BFormCheckbox>
      </BCol>
    </BRow>
    <!-- Form -->
    <BRow class="section-divider">
      <BCol class="d-flex align-items-center justify-content-start col-6 mb-1">
        <BForm
          aria-label="form-frequency-cap"
          class="form-width"
          @submit.prevent
        >
          <BFormGroup
            id="input-group-1"
            label-for="input-1"
            aria-label="frequency-cap"
            class="mb-0 mr-0"
          >
            <BFormText
              v-show="frequencyRequestCurrentToggle"
              id="frequency-cap-help-text"
            >
              {{
                $t('pagePower.powerCapLabelTextInfo', {
                  min: dataFormatter(frequencyMin),
                  max: dataFormatter(frequencyMax),
                })
              }}
            </BFormText>

            <BInputGroup
              aria-label="frequency-cap-input-group"
              class="mb-3 mr-0"
            >
              <BFormInput
                id="input-1"
                v-model="frequencyValue"
                aria-label="frequency-cap-input"
                type="number"
                aria-describedby="frequency-cap-help-text"
                :disabled="!frequencyRequestCurrentToggle"
                :number="true"
                :state="getValidationState(v$.frequencyValue)"
                @click="v$.frequencyValue.$touch()"
                @input="frequencyRequest"
              />
              <BFormInvalidFeedback
                v-if="frequencyRequestCurrentToggle"
                role="alert"
              >
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: frequencyMin,
                    max: frequencyMax,
                  })
                }}
              </BFormInvalidFeedback>
            </BInputGroup>
            <BButton
              variant="primary"
              type="submit"
              :disabled="!frequencyRequestCurrentToggle"
              class="mb-3"
              @click="saveFrequencyRequest"
            >
              {{ $t('global.action.save') }}
            </BButton>
          </BFormGroup>
        </BForm>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { requiredIf, between, numeric } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import useToastComposable from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useSystemParameters } from '@/api/composables/useSystemParameters';
import i18n from '@/i18n';

const { dataFormatter } = useDataFormatterGlobal();
const { getValidationState } = useVuelidateComposable();
const Toast = useToastComposable();

const {
  frequencyMax,
  frequencyMin,
  frequencyRequest: frequencyRequestData,
  frequencyRequestCurrent,
  frequencyRequestCurrentToggle,
  saveFrequencyCap,
} = useSystemParameters();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const frequencyValue = ref(0);

// Sync frequencyValue with fetched data
watch(
  frequencyRequestData,
  (value) => {
    if (value !== null) frequencyValue.value = value;
  },
  { immediate: true },
);

const rules = computed(() => ({
  frequencyValue: {
    requiredIf: requiredIf(frequencyRequestCurrentToggle),
    numeric,
    between: frequencyRequestCurrentToggle.value
      ? between(frequencyMin.value ?? 0, frequencyMax.value ?? 0)
      : true,
  },
}));
const v$ = useVuelidate(rules, { frequencyValue });

const changeFrequencyRequestCurrent = async (state) => {
  try {
    if (state) {
      frequencyValue.value = frequencyMax.value ?? 0;
      await saveFrequencyCap(frequencyMax.value ?? 0);
    } else {
      frequencyValue.value = 0;
      await saveFrequencyCap(0);
    }
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingFrequencyCap'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingFrequencyCap'),
    );
  }
};

const saveFrequencyRequest = async () => {
  if (v$.value.$invalid) {
    return;
  }
  try {
    await saveFrequencyCap(frequencyValue.value);
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingFrequencyCap'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingFrequencyCap'),
    );
  }
};

const frequencyRequest = (value) => {
  frequencyValue.value = Number(value);
};
</script>

<style lang="scss" scoped>
.form-width {
  width: 100%;
}
</style>
