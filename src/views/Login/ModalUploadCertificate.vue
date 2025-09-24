<template>
  <b-modal
    id="upload-login-certificate"
    v-model="modal"
    :ok-title="$t('global.action.add')"
    :title="$t('pageLogin.modal.addNewServiceLoginCertificate')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <b-form>
      <b-form-group :label="$t('pageLogin.modal.certificateFile')">
        <form-file
          id="certificate-file"
          :state="getValidationState(v$.form.file)"
          @input="onFileUpload"
        >
          <template #invalid>
            <b-form-invalid-feedback role="alert">
              {{ $t('global.form.required') }}
            </b-form-invalid-feedback>
          </template>
        </form-file>
      </b-form-group>
    </b-form>
    <template #modal-ok>
      {{ $t('global.action.add') }}
    </template>
    <template #modal-cancel>
      {{ $t('global.action.cancel') }}
    </template>
  </b-modal>
</template>

<script setup>
import FormFile from '@/components/Global/FormFile.vue';
import { required } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { ref, computed, nextTick } from 'vue';
import { reactive } from 'vue';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const modal = ref(false);

const form = reactive({
  file: null,
});

const rules = computed(() => ({
  form: {
    file: modal.value ? { required } : {},
    file: modal.value ? { required } : {},
  },
}));
const v$ = useVuelidate(rules, { form });

eventBus.on('upload-login-certificate', () => {
  modal.value = true;
});

function onFileUpload(uploadedfile) {
  form.file = uploadedfile;
  v$.value.form.file.$touch();
}
const emit = defineEmits(['ok']);

function handleSubmit() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', {
    file: form.file,
  });
  closeModal();
}
function closeModal() {
  nextTick(() => {
    modal.value = false;
  });
}
function resetForm() {
  form.file = null;
  eventBus.emit('clear-file');
  v$.value.$reset();
}

function onOk(bvModalEvt) {
  bvModalEvt.preventDefault();
  handleSubmit();
}
</script>
