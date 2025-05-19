<template>
  <BModal id="add-destination" v-model="modal" :title="$t('pageSnmpAlerts.modal.addSnmpDestinationTitle')" @ok="onOk" :ok-title="$t('pageSnmpAlerts.addDestination')" @cancel="cancel()" @hidden="resetForm">
    <BForm id="form-destination">
      <BContainer>
        <BRow>
          <BCol sm="6">
            <!-- Add new SNMP alert destination type -->
            <BFormGroup label-for="ip-address">
              <template #label>
                {{ $t('pageSnmpAlerts.modal.ipaddressFqdn') }}
                <info-tooltip
                  class="info-icon"
                  :title="$t('pageSnmpAlerts.modal.ipaddressFqdnInfo')"
                />
              </template>
              <BFormInput
                id="ip-Address"
                v-model="form.ipAddress"
                :state="getValidationState(v$.form.ipAddress)"
                data-test-id="snmpAlerts-input-ipAddress"
                type="text"
                @blur="v$.form.ipAddress.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <template v-if="!v$.form.ipAddress.required">
                  {{ $t('global.form.fieldRequired') }}
                </template>
              </BFormInvalidFeedback>
            </BFormGroup>
          </BCol>
          <BCol>
            <BFormGroup label-for="port">
              <template #label>
                {{ $t('pageSnmpAlerts.modal.port') }} -
                <span class="form-text d-inline">
                  {{ $t('global.form.optional') }}
                </span>
              </template>
              <BFormInput
                id="port"
                v-model="form.port"
                type="text"
                :state="getValidationState(v$.form.port)"
                data-test-id="snmpAlerts-input-port"
                @blur="v$.form.port.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <template
                  v-if="!v$.form.port.minLength || !v$.form.port.maxLength"
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
        </BRow>
      </BContainer>
    </BForm>
  </BModal>
</template>
<script setup>
import { ref, nextTick } from 'vue';
import { required, minValue, maxValue } from 'vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import InfoTooltip from '@/components/Global/InfoTooltip';
import eventBus from '@/eventBus';

  const { getValidationState } = useVuelidateComposable();
  const emit = defineEmits(['ok']);
  const modal = ref(false);
  const form =  ref({
    ipaddress: null,
    port: null,
  });
  const rules = computed(() => ({
      form: {
        ipAddress: {
          required,
        },
        port: {
          minValue: minValue(0),
          maxValue: maxValue(65535),
        },
  }}));

  const v$ = useVuelidate(rules, { form });

  const handleSubmit = () => {
      v$.value.$touch();
      if (v$.value.$invalid) return;
      emit('ok', {
        ipAddress: form.value.ipAddress,
        port: form.value.port,
      });
      closeModal();
    }
  const closeModal = () => {
      nextTick(() => {
        modal.value = false;
      });
    }
  const resetForm = () => {
      form.value.ipAddress = '';
      form.value.port = '';
      v$.value.$reset();
      eventBus.emit('hidden');
    }
  const onOk = (bvModalEvt) => {
      // prevent modal close
      bvModalEvt.preventDefault();
      handleSubmit();
    }
</script>
<style lang="scss" scoped>
.info-icon {
  width: 20px !important;
  height: 2px !important;
}
</style>
