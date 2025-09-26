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
        <BForm class="form-width" @submit.prevent>
          <BFormGroup id="input-group-1" label-for="input-1" class="mb-0 mr-0">
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

            <BInputGroup class="mb-3 mr-0">
              <BFormInput
                id="input-1"
                v-model="frequencyValue"
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
import { computed, ref, onBeforeMount } from 'vue';
import { requiredIf, between, numeric } from '@vuelidate/validators';
import stores from '@/store';
import { useVuelidate } from '@vuelidate/core';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import useToastComposable from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';

const { startLoader, endLoader } = useLoadingBar();
const { dataFormatter } = useDataFormatterGlobal();
const { getValidationState } = useVuelidateComposable();
const Toast = useToastComposable();

const systemParametersStore = stores.SystemParametersStore();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const isDisabled = ref(true);
const frequencyValue = ref(0);

onBeforeMount(() => {
  startLoader();
  systemParametersStore
    .getFrequencyCap()
    .then(() => {
      frequencyValue.value = systemParametersStore.frequencyRequestGetter;
    })
    .finally(() => endLoader());
});

const frequencyMax = computed(() => systemParametersStore.frequencyMaxGetter);
const frequencyMin = computed(() => systemParametersStore.frequencyMinGetter);
const frequencyRequestCurrent = computed(
  () => systemParametersStore.frequencyRequestCurrentGetter,
);
const frequencyControl = computed({
  get() {
    return frequencyRequestCurrent.value > 0;
  },
  set(newValue) {
    return newValue;
  },
});
const frequencyRequestCurrentToggle = computed({
  get() {
    return systemParametersStore.frequencyRequestCurrentToggleGetter;
  },
  set(newValue) {
    return newValue;
  },
});
const rules = computed(() => ({
  frequencyValue: {
    requiredIf: requiredIf(frequencyRequestCurrentToggle),
    numeric,
    between: frequencyRequestCurrentToggle.value
      ? between(frequencyMin.value, frequencyMax.value)
      : true,
  },
}));
const v$ = useVuelidate(rules, { frequencyValue });

const changeFrequencyRequestCurrent = (state) => {
  if (state) {
    frequencyValue.value = frequencyMax.value;
    systemParametersStore
      .saveFrequencyCap({
        frequency: frequencyMax.value,
        state: state,
      })
      .then((message) => Toast.successToast(message))
      .catch(({ message }) => Toast.errorToast(message));
  } else {
    frequencyValue.value = 0;
    systemParametersStore
      .saveFrequencyCap({
        frequency: 0,
        state: state,
      })
      .then((message) => Toast.successToast(message))
      .catch(({ message }) => Toast.errorToast(message));
  }
};
const saveFrequencyRequest = () => {
  if (v$.value.$invalid) {
    return;
  }
  systemParametersStore
    .newFrequencyCapRequest({
      frequency: frequencyValue.value,
      state: true,
    })
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message));
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
