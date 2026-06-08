<template>
  <BModal
    id="modal-dns"
    v-model="modal"
    :title="$t('pageNetwork.table.addDnsAddress')"
    :ok-title="$t('global.action.add')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="form-dns" @submit.prevent="handleSubmit">
      <BRow>
        <BCol sm="6">
          <BFormGroup
            :label="$t('pageNetwork.modal.staticDns')"
            label-for="staticDns"
          >
            <BFormInput
              id="staticDns"
              v-model="form.staticDns"
              type="text"
              :state="getValidationState(v$.form.staticDns)"
              @input="v$.form.staticDns.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.staticDns.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="v$.form.staticDns.ipAddress.$invalid">
                {{ $t('global.form.invalidFormat') }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
      </BRow>
    </BForm>
  </BModal>
</template>

<script setup>
import { ref, computed } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required, ipAddress } from '@vuelidate/validators';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const emit = defineEmits(['ok', 'hidden']);

const modal = ref(false);
eventBus.on('modal-dns', () => {
  modal.value = true;
});

const form = ref({
  staticDns: null,
});

const rules = computed(() => ({
  form: {
    staticDns: {
      required,
      ipAddress,
    },
  },
}));

const v$ = useVuelidate(rules, {
  form,
});

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', [form.value.staticDns]);
  closeModal();
};

const closeModal = () => {
  modal.value = false;
};

const resetForm = () => {
  form.value.staticDns = null;
  v$.value.$reset();
  emit('hidden');
};

const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
