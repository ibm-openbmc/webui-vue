<template>
  <BModal
    id="modal-settings"
    v-model="modalSettings"
    :title="$t('pageUserManagement.accountPolicySettings')"
    :ok-title="$t('global.action.save')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="form-settings" novalidate>
      <BContainer>
        <BRow>
          <BCol>
            <BFormGroup
              :label="$t('pageUserManagement.modal.maxFailedLoginAttempts')"
              label-for="lockout-threshold"
            >
              <BFormText id="lockout-threshold-help-block">
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 0,
                    max: 65535,
                  })
                }}
              </BFormText>
              <BFormText>{{
                $t('pageUserManagement.modal.zeroLoginAttempts')
              }}</BFormText>
              <BFormInput
                id="lockout-threshold"
                v-model.number="form.lockoutThreshold"
                type="number"
                aria-describedby="lockout-threshold-help-block"
                data-test-id="userManagement-input-lockoutThreshold"
                :state="getValidationState(v$.form.lockoutThreshold)"
                @input="v$.form.lockoutThreshold.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <template v-if="!v$.form.lockoutThreshold.required">
                  {{ $t('global.form.fieldRequired') }}
                </template>
                <template
                  v-if="
                    !v$.form.lockoutThreshold.minLength ||
                    !v$.form.lockoutThreshold.maxLength
                  "
                >
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: 65535,
                    })
                  }}
                </template>
              </BFormInvalidFeedback>
            </BFormGroup>
          </BCol>
          <BCol>
            <BFormGroup
              :label="$t('pageUserManagement.modal.userUnlockMethod')"
            >
              <BFormRadio
                v-model="form.unlockMethod"
                name="unlock-method"
                class="mb-2"
                :value="0"
                data-test-id="userManagement-radio-manualUnlock"
                @input="v$.form.unlockMethod.$touch()"
              >
                {{ $t('pageUserManagement.modal.manual') }}
              </BFormRadio>
              <BFormRadio
                v-model="form.unlockMethod"
                name="unlock-method"
                :value="1"
                data-test-id="userManagement-radio-automaticUnlock"
                @input="v$.form.unlockMethod.$touch()"
              >
                {{ $t('pageUserManagement.modal.automaticAfterTimeout') }}
              </BFormRadio>
              <div class="mt-3 ml-4">
                <BFormText id="lockout-duration-help-block">
                  {{ $t('pageUserManagement.modal.timeoutDurationSeconds') }}
                </BFormText>
                <BFormInput
                  v-model.number="form.lockoutDuration"
                  aria-describedby="lockout-duration-help-block"
                  type="number"
                  data-test-id="userManagement-input-lockoutDuration"
                  :state="getValidationState(v$.form.lockoutDuration)"
                  :disabled="v$.form.unlockMethod.$model === 0"
                  :readonly="v$.form.unlockMethod.$model === 0"
                  @input="v$.form.lockoutDuration.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                  <template v-if="!v$.form.lockoutDuration.required">
                    {{ $t('global.form.fieldRequired') }}
                  </template>
                  <template v-else-if="!v$.form.lockoutDuration.minvalue">
                    {{ $t('global.form.mustBeAtLeast', { value: 1 }) }}
                  </template>
                </BFormInvalidFeedback>
              </div>
            </BFormGroup>
          </BCol>
        </BRow>
      </BContainer>
    </BForm>
    <template #modal-footer>
      <BButton
        variant="secondary"
        data-test-id="userManagement-button-cancel"
      >
        {{ $t('global.action.cancel') }}
      </BButton>
      <BButton
        form="form-settings"
        variant="primary"
        data-test-id="userManagement-button-submit"
      >
        {{ $t('global.action.save') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, watch, defineEmits } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import eventBus from '@/eventBus';
import {
  required,
  requiredIf,
  minValue,
  maxValue,
} from '@vuelidate/validators';

const { getValidationState } = useVuelidateComposable();
const emitUpdate = defineEmits(['ok']);
const modalSettings = ref(false);
eventBus.on('modal-settings', () => {
  modalSettings.value = true;
  form.value.lockoutThreshold = props.settings?.lockoutThreshold;
  form.value.unlockMethod = props.settings?.lockoutDuration ? 1 : 0;
  form.value.lockoutDuration = props.settings?.lockoutDuration;
});

const props = defineProps({
  settings: {
    type: Object,
    required: true,
  },
});
      const form = ref({
        lockoutThreshold: 0,
        unlockMethod: 0,
        lockoutDuration: null,
      });
  const rules = {
    form: {
      lockoutThreshold: {
        minValue: minValue(0),
        maxValue: maxValue(65535),
        required,
      },
      unlockMethod: { required },
      lockoutDuration: {
        minValue: function (value) {
          return form.value.unlockMethod === 0 || value > 0;
        },
        required: requiredIf(function () {
          return form.value.unlockMethod === 1;
        }),
      },
    },
  };
  const v$ = useVuelidate(rules, { form });

    function handleSubmit() {
      v$.value.$touch();
      if (v$.value.$invalid) return;

      let lockoutThreshold;
      let lockoutDuration;
      if (v$.value.form.lockoutThreshold.$dirty) {
        lockoutThreshold = form.value.lockoutThreshold;
      }
      if (v$.value.form.unlockMethod.$dirty) {
        lockoutDuration = form.value.unlockMethod
          ? form.value.lockoutDuration
          : 0;
      }
      emitUpdate('ok',{ lockoutThreshold, lockoutDuration })
      closeModal();
    };

    function onOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      handleSubmit();
    };

    const closeModal = () => {
      v$.value.$reset();
      modalSettings.value = false;
    };

    function resetForm() {
      form.value.lockoutThreshold = props.settings.lockoutThreshold;
      form.value.unlockMethod = props.settings.lockoutDuration ? 1 : 0;
      form.value.lockoutDuration = props.settings.lockoutDuration
        ? props.settings.lockoutDuration
        : null;
      v$.value.$reset();
    };
</script>
