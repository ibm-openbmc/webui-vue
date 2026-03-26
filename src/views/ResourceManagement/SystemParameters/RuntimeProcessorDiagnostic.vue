<template>
  <div>
    <BRow>
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mr-3 w-75">
          <dt id="rpd-policy-label">
            {{ $t('pageSystemParameters.rpdFeature') }}
            <info-tooltip :title="$t('pageSystemParameters.rpdFeatureInfo')" />
          </dt>
          <dd id="rpd-policy-description">
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
import { computed } from 'vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { helpers } from '@vuelidate/validators';
import { minValue, maxValue } from '@vuelidate/validators';
import i18n from '@/i18n';

const { getValidationState } = useVuelidateComposable();
const { startLoader, endLoader } = useLoadingBar();
const Toast = useToastComposable();

const systemParametersStore = stores.SystemParametersStore();
const global = stores.GlobalStore();

const isoTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});
const selectedOption = computed({
  get() {
    return systemParametersStore.rpdPolicy;
  },
  set(value) {
    // Do something when the option is selected
    // e.g. update the value in the store
    systemParametersStore.rpdPolicy = value;
  },
});
const selectedFeatureOption = computed({
  get() {
    return systemParametersStore.rpdFeature;
  },
  set(value) {
    // Do something when the option is selected
    // e.g. update the value in the store
    systemParametersStore.rpdFeature = value;
  },
});
const isRpdPolicyScheduled = computed(() => {
  return systemParametersStore.pvmRpdPolicy === 'Scheduled';
});
const options = computed(() => {
  if (systemParametersStore.rpdPolicyOptionsGetter) {
    return systemParametersStore.rpdPolicyOptions.map((option) => ({
      value: option,
      text: option,
    }));
  } else {
    return [];
  }
});
const rpdFeatOptions = computed(() => {
  if (systemParametersStore.rpdFeatureOptionsGetter) {
    return systemParametersStore.rpdFeatureOptionsGetter.map((option) => ({
      value: option,
      text: option,
    }));
  } else {
    return [];
  }
});
const isRpdFeatureCurrentDisabled = computed(() => {
  return systemParametersStore.rpdPolicyCurrent === 'Disabled';
});
const aggressivePrefetchState = computed({
  get() {
    return systemParametersStore.aggressivePrefetch;
  },
  set(newValue) {
    systemParametersStore.aggressivePrefetch = newValue;
  },
});
const immediateTestRequestedState = computed({
  get() {
    return systemParametersStore.immediateTestRequested;
  },
  set(newValue) {
    systemParametersStore.immediateTestRequested = newValue;
  },
});
const rpdScheduledRun = computed({
  get() {
    return systemParametersStore.rpdScheduledRun;
  },
  set(value) {
    v$.value.$touch();
    systemParametersStore.rpdScheduledRun = value;
  },
});
const rpdScheduledRunDuration = computed({
  get() {
    return systemParametersStore.rpdScheduledRunDuration;
  },
  set(value) {
    v$.value.$touch();
    systemParametersStore.rpdScheduledRunDuration = value;
  },
});
const guardOnErrorState = computed({
  get() {
    return systemParametersStore.guardOnError;
  },
  set(newValue) {
    systemParametersStore.guardOnError = newValue;
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

const updateImmediateTestRequestedState = (value) => {
  startLoader();
  Promise.all([
    systemParametersStore.saveImmediateTestRequested({
      value: value ? 'Enabled' : 'Disabled',
    }),
    systemParametersStore.getRpdScheduledRun,
  ])
    .then((message) => {
      if (value && isServerOff.value) {
        Toast.successToast(
          i18n.global.t(
            'pageSystemParameters.toast.successStartingDiagnosticTestRunIfPoweredOff',
          ),
        );
      } else {
        Toast.successToast(message[0]);
      }
    })
    .catch(({ message }) => Toast.errorToast(message))
    .finally(() => endLoader());
};
const updateGuardOnErrorState = (state) => {
  systemParametersStore
    .saveGuardOnError(state)
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message));
};
const updateRpdPolicy = () => {
  startLoader();
  let rpdPolicyValue = selectedOption.value;
  systemParametersStore
    .saveRpdPolicy(rpdPolicyValue)
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message))
    .finally(() => {
      endLoader();
    });
};
const updateRpdFeature = () => {
  startLoader();
  let rpdFeatureValue = selectedFeatureOption.value;
  systemParametersStore
    .saveRpdFeature(rpdFeatureValue)
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message))
    .finally(() => {
      endLoader();
    });
};
const updateRpdScheduledRun = (startTime, duration) => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  startLoader();
  const [hours, minutes] = startTime.split(':');
  const totalSeconds = (+hours * 60 + +minutes) * 60;
  systemParametersStore
    .saveRpdScheduledRun({ totalSeconds, duration, startTime })
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message))
    .finally(() => {
      endLoader();
    });
};
</script>
