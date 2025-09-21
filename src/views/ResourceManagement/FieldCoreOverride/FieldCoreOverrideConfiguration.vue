<template>
  <BRow>
    <BCol xl="4">
      <page-section
        :section-title="$t('pageFieldCoreOverride.changeConfiguration')"
      >
        <BForm @submit.prevent="submitForm">
          <BFormCheckbox
            id="checkbox-1"
            v-model="inputEnableFieldCoreOverride"
            class="mb-3"
          >
            {{ $t('pageFieldCoreOverride.enableFieldCoreOverride') }}
          </BFormCheckbox>
          <BFormGroup
            :label="$t('pageFieldCoreOverride.configuredCores')"
            label-for="input-configured-cores"
          >
            <BFormText>
              {{ $t('global.form.mustBeAtLeast', { value: minimumValue }) }}
            </BFormText>
            <BInputGroup>
              <BFormInput
                id="input-configured-cores"
                v-model.number="inputConfiguredCores"
                type="number"
                min="1"
                :max="maxConfiguredCores"
                :disabled="!inputEnableFieldCoreOverride"
                :placeholder="$t('pageFieldCoreOverride.enterValue')"
                :state="getValidationState(v$.inputConfiguredCores)"
                @blur="v$.inputConfiguredCores.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <template v-if="v$.inputConfiguredCores.required.$invalid">
                  {{ $t('global.form.fieldRequired') }}
                </template>
                <template v-else-if="v$.inputConfiguredCores.minValue.$invalid">
                  {{ $t('global.form.invalidValue') }}
                </template>
              </BFormInvalidFeedback>
            </BInputGroup>
          </BFormGroup>
          <BButton variant="primary" type="submit">
            {{ $t('global.action.save') }}
          </BButton>
        </BForm>
      </page-section>
    </BCol>
  </BRow>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { requiredIf, minValue } from '@vuelidate/validators';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import PageSection from '@/components/Global/PageSection.vue';
import stores from '@/store';

const { successToast, errorToast } = useToast();
const { getValidationState } = useVuelidateComposable();

const systemStore = stores.SystemStore();
const fieldCoreOverrideStore = stores.FieldCoreOverrideStore();
const licenseStore = stores.LicenseStore();

const inputEnableFieldCoreOverride = ref(
  fieldCoreOverrideStore.isEnabledGetter,
);

const inputConfiguredCores = ref(
  fieldCoreOverrideStore.configuredCoresGetter || null,
);

const minimumValue = ref(1);

const configuredCores = computed(() => {
  return fieldCoreOverrideStore.configuredCoresGetter;
});

const processorInfo = computed(() => {
  return licenseStore.licensesGetter;
});

const isFieldCoreOverrideEnabled = computed(() => {
  return fieldCoreOverrideStore.isEnabledGetter;
});

const systems = computed(() => {
  return systemStore.getSystems;
});

const maxConfiguredCores = computed(() => {
  return systems.value?.[0]?.processorSummaryCoreCount;
});

const rules = computed(() => ({
  inputConfiguredCores: {
    required: requiredIf(function () {
      return inputEnableFieldCoreOverride.value;
    }),
    minValue: minValue(minimumValue.value),
  },
}));

const v$ = useVuelidate(rules, {
  inputConfiguredCores,
});

watch(configuredCores, (value) => {
  if (value < 1) {
    inputConfiguredCores.value = null;
  } else {
    inputConfiguredCores.value = value;
  }
});

watch(isFieldCoreOverrideEnabled, (value) => {
  inputEnableFieldCoreOverride.value = value;
});

watch(inputEnableFieldCoreOverride, (value) => {
  if (!value) {
    inputConfiguredCores.value = null;
  }
});

const submitForm = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  fieldCoreOverrideStore
    .setFieldCoreOverride(inputConfiguredCores.value)
    .then((success) => successToast(success))
    .catch(({ message }) => errorToast(message));
};
</script>
<style scoped>
.form-check {
  margin-bottom: 1rem !important;
}
</style>
