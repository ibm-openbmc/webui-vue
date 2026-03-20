<template>
  <div>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="rpd-feature-label">
            {{ $t('pageSystemParameters.rpdFeature') }}
            <info-tooltip :title="$t('pageSystemParameters.rpdFeatureInfo')" />
          </dt>
          <dd id="rpd-feature-description">
            {{ $t('pageSystemParameters.rpdFeatureDescription') }}
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" xl="6">
        <BForm
          aria-label="rpdfeature-form"
          novalidate
          @submit.prevent="updateRpdFeature"
        >
          <BFormSelect
            v-model="selectedFeatureOption"
            aria-label="rpdfeature-input"
            :options="rpdFeatOptions"
          ></BFormSelect>
          <BButton variant="primary" type="submit" class="mt-3 mb-3">
            {{ $t('pageSystemParameters.updateRpdFeature') }}
          </BButton>
        </BForm>
      </BCol>
    </BRow>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="rpd-policy-label">
            {{ $t('pageSystemParameters.rpdPolicy') }}
          </dt>
          <dd id="rpd-policy-description">
            {{ $t('pageSystemParameters.rpdPolicyDescription') }}
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" xl="6">
        <BForm
          aria-label="rpdPolicy-form"
          novalidate
          @submit.prevent="updateRpdPolicy"
        >
          <BFormSelect
            v-model="selectedOption"
            aria-label="rpdPolicy-input"
            :options="options"
            :disabled="isRpdFeatureCurrentDisabled"
          ></BFormSelect>
          <BButton
            variant="primary"
            type="submit"
            class="mt-3 mb-3"
            :disabled="isRpdFeatureCurrentDisabled"
          >
            {{ $t('pageSystemParameters.updateRpdPolicy') }}
          </BButton>
        </BForm>
      </BCol>
    </BRow>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="rpd-scheduled-run-label">
            {{ $t('pageSystemParameters.rpdScheduledRun') }}
          </dt>
          <dd id="rpd-scheduled-run-description">
            {{ $t('pageSystemParameters.rpdScheduledRunDescription') }}
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol md="8" xl="6">
        <BForm>
          <BFormGroup
            :label="$t('pageSystemParameters.startTime')"
            aria-label="start-time"
            label-for="input-rpd-scheduled-run"
            class="mb-3"
          >
            <BInputGroup aria-label="input-rpd-scheduled-run-input-group">
              <BFormInput
                id="input-rpd-scheduled-run"
                v-model="rpdScheduledRun"
                :state="getValidationState(v$.rpdScheduledRun)"
                :disabled="isRpdFeatureCurrentDisabled || !isRpdPolicyScheduled"
                @blur="v$.rpdScheduledRun.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <div v-if="v$.rpdScheduledRun.$error">
                  {{ $t('global.form.invalidFormat') }}
                </div>
              </BFormInvalidFeedback>
            </BInputGroup>
          </BFormGroup>
          <BFormGroup
            :label="$t('pageSystemParameters.duration')"
            aria-label="duration"
            label-for="input-rpd-scheduled-run-duration"
            class="mb-3"
          >
            <BFormInput
              id="input-rpd-scheduled-run-duration"
              v-model.number="rpdScheduledRunDuration"
              type="number"
              :min="0"
              :max="86399"
              :state="getValidationState(v$.rpdScheduledRunDuration)"
              :disabled="isRpdFeatureCurrentDisabled || !isRpdPolicyScheduled"
            ></BFormInput>
            <BFormInvalidFeedback role="alert">
              <template
                v-if="
                  !v$.rpdScheduledRunDuration.minLength ||
                  !v$.rpdScheduledRunDuration.maxLength
                "
              >
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 30,
                    max: 1440,
                  })
                }}
              </template>
            </BFormInvalidFeedback>
            <BButton
              variant="primary"
              class="mt-3 mb-3"
              :disabled="isRpdFeatureCurrentDisabled || !isRpdPolicyScheduled"
              @click="
                updateRpdScheduledRun(rpdScheduledRun, rpdScheduledRunDuration)
              "
            >
              {{ $t('pageSystemParameters.updateRpdScheduledRun') }}
            </BButton>
          </BFormGroup>
        </BForm>
      </BCol>
    </BRow>
    <BRow></BRow>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="guard-on-error-label">
            {{ $t('pageSystemParameters.guardOnError') }}
          </dt>
          <dd id="guard-on-error-description">
            {{ $t('pageSystemParameters.guardOnErrorDescription') }}
          </dd>
        </dl>
        <BFormCheckbox
          id="guardOnErrorSwitch"
          v-model="guardOnErrorState"
          aria-labelledby="guard-on-error-label"
          aria-describedby="guard-on-error-description"
          switch
          :disabled="isRpdFeatureCurrentDisabled"
          @update:model-value="updateGuardOnErrorState"
        >
          <span v-if="guardOnErrorState">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </BFormCheckbox>
      </BCol>
    </BRow>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="immediate-test-requested-label">
            {{ $t('pageSystemParameters.immediateTestRequested') }}
          </dt>
          <dd id="immediate-test-requested-description">
            {{ $t('pageSystemParameters.immediateTestRequestedDescription') }}
          </dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol class="d-flex align-items-center gap-3">
        <BButton
          variant="primary"
          type="submit"
          class="mt-3 mb-3 mr-3"
          :disabled="immediateTestRequestedState || isRpdFeatureCurrentDisabled"
          @click="updateImmediateTestRequestedState(true)"
        >
          {{ $t('pageSystemParameters.runNow') }}
        </BButton>
        <BButton
          variant="danger"
          type="submit"
          class="ml-3"
          :disabled="
            !immediateTestRequestedState || isRpdFeatureCurrentDisabled
          "
          @click="updateImmediateTestRequestedState(false)"
        >
          {{ $t('pageSystemParameters.stopTest') }}
        </BButton>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { minValue, maxValue } from '@vuelidate/validators';
import { useSystemParameters } from '@/api/composables/useSystemParameters';
import i18n from '@/i18n';

const { getValidationState } = useVuelidateComposable();
const { startLoader, endLoader } = useLoadingBar();
const Toast = useToastComposable();

const {
  rpdPolicy: rpdPolicyData,
  rpdFeature: rpdFeatureData,
  rpdPolicyOptions,
  rpdFeatureOptions,
  rpdPolicyCurrent,
  immediateTestRequested,
  guardOnError,
  rpdScheduledRun: rpdScheduledRunData,
  rpdScheduledRunDuration: rpdScheduledRunDurationData,
  saveRpdPolicy,
  saveRpdFeature,
  saveImmediateTestRequested,
  saveGuardOnError,
  saveRpdScheduledRun: saveRpdScheduledRunMutation,
} = useSystemParameters();

const global = stores.GlobalStore();

const isoTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

// Local state for form inputs
const selectedOption = ref('');
const selectedFeatureOption = ref('');
const rpdScheduledRun = ref('');
const rpdScheduledRunDuration = ref(0);

// Sync local state with fetched data
watch(
  rpdPolicyData,
  (value) => {
    if (value !== null) selectedOption.value = value;
  },
  { immediate: true },
);

watch(
  rpdFeatureData,
  (value) => {
    if (value !== null) selectedFeatureOption.value = value;
  },
  { immediate: true },
);

watch(
  rpdScheduledRunData,
  (value) => {
    if (value !== null) rpdScheduledRun.value = value;
  },
  { immediate: true },
);

watch(
  rpdScheduledRunDurationData,
  (value) => {
    if (value !== null) rpdScheduledRunDuration.value = value;
  },
  { immediate: true },
);

const isRpdPolicyScheduled = computed(() => {
  return selectedOption.value === 'Scheduled';
});

const options = computed(() => {
  return rpdPolicyOptions.value.map((option) => ({
    value: option,
    text: option,
  }));
});

const rpdFeatOptions = computed(() => {
  return rpdFeatureOptions.value.map((option) => ({
    value: option,
    text: option,
  }));
});

const isRpdFeatureCurrentDisabled = computed(() => {
  return rpdPolicyCurrent.value === 'Disabled';
});

// Local state for immediate UI update (optimistic update)
const localImmediateTestRequested = ref(false);

// Sync local state with server data
watch(
  immediateTestRequested,
  (value) => {
    if (value !== null) localImmediateTestRequested.value = value;
  },
  { immediate: true },
);

const immediateTestRequestedState = computed({
  get() {
    return localImmediateTestRequested.value;
  },
  set(newValue) {
    return newValue;
  },
});

const guardOnErrorState = computed({
  get() {
    return guardOnError.value;
  },
  set(newValue) {
    return newValue;
  },
});

const serverStatus = computed(() => {
  return global.serverStatusGetter;
});

const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});

const rules = computed(() => ({
  rpdScheduledRun: {
    pattern: (value) => isoTimeRegex.test(value),
  },
  rpdScheduledRunDuration: {
    minValue: minValue(30),
    maxValue: maxValue(1440),
  },
}));

const v$ = useVuelidate(rules, { rpdScheduledRun, rpdScheduledRunDuration });

const updateImmediateTestRequestedState = async (value) => {
  // Optimistic update for immediate UI response
  localImmediateTestRequested.value = value;

  try {
    await saveImmediateTestRequested(value ? 'Enabled' : 'Disabled');

    if (value && isServerOff.value) {
      Toast.successToast(
        i18n.global.t(
          'pageSystemParameters.toast.successStartingDiagnosticTestRunIfPoweredOff',
        ),
      );
    } else if (value) {
      Toast.successToast(
        i18n.global.t(
          'pageSystemParameters.toast.successStartingDiagnosticTestRun',
        ),
      );
    } else {
      Toast.successToast(
        i18n.global.t(
          'pageSystemParameters.toast.successStoppingDiagnosticTestRun',
        ),
      );
    }
  } catch (error) {
    // Revert optimistic update on error
    localImmediateTestRequested.value = !value;

    if (value) {
      Toast.errorToast(
        i18n.global.t(
          'pageSystemParameters.toast.errorStartingDiagnosticTestRun',
        ),
      );
    } else {
      Toast.errorToast(
        i18n.global.t(
          'pageSystemParameters.toast.errorStoppingDiagnosticTestRun',
        ),
      );
    }
  }
};

const updateGuardOnErrorState = async (state) => {
  try {
    await saveGuardOnError(state);
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingGuardOnError'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingGuardOnError'),
    );
  }
};

const updateRpdPolicy = async () => {
  try {
    await saveRpdPolicy(selectedOption.value);
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingRpdPolicy'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingRpdPolicy'),
    );
  }
};

const updateRpdFeature = async () => {
  try {
    await saveRpdFeature(selectedFeatureOption.value);
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingRpdFeature'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingRpdFeature'),
    );
  }
};

const updateRpdScheduledRun = async (startTime, duration) => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  try {
    const [hours, minutes] = startTime.split(':');
    const totalSeconds = (+hours * 60 + +minutes) * 60;
    await saveRpdScheduledRunMutation({ totalSeconds, duration });
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingRpdRun'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingRpdRun'),
    );
  }
};
</script>
