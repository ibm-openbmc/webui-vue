<template>
  <BModal
    id="upload-login-certificate"
    v-model="modal"
    :ok-title="$t('global.action.add')"
    :title="$t('pageLogin.modal.addNewAcfCertificate')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm>
      <BFormGroup
        :label="$t('pageCertificates.modal.certificateType')"
        label-for="certificate-type"
      >
        <BFormSelect
          id="certificate-type"
          v-model="form.certificateType"
          :options="certificateOptions"
          :state="getValidationState(v$.form.certificateType)"
          @input="v$.form.certificateType.$touch()"
        >
        </BFormSelect>
        <BFormInvalidFeedback role="alert" class="text-style">
          <template v-if="!v$.form.certificateType.required">
            {{ $t('global.form.fieldRequired') }}
          </template>
        </BFormInvalidFeedback>
      </BFormGroup>
      <BFormGroup :label="$t('pageLogin.modal.certificateFile')">
        <FormFile
          id="certificate-file"
          accept=".acf"
          :state="getValidationState(v$.form.file)"
          @input="onFileUpload"
        >
          <template #invalid>
            <BFormInvalidFeedback
              v-if="v$.form.file.required?.$invalid"
              role="alert"
              class="text-style"
            >
              {{ $t('global.form.fieldRequired') }}
            </BFormInvalidFeedback>
            <BFormInvalidFeedback
              v-else-if="v$.form.file.fileMatchesType?.$invalid"
              role="alert"
              class="text-style"
            >
              {{ $t('pageCertificates.modal.mismatchError') }}
            </BFormInvalidFeedback>
          </template>
        </FormFile>
      </BFormGroup>
    </BForm>
    <template #modal-ok>
      {{ $t('global.action.add') }}
    </template>
    <template #modal-cancel>
      {{ $t('global.action.cancel') }}
    </template>
  </BModal>
</template>

<script setup>
import FormFile from '@/components/Global/FormFile.vue';
import { required, requiredIf } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { ref, computed, nextTick, watch, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';

const { getValidationState } = useVuelidateComposable();

const modal = ref(false);

const form = ref({
  certificateType: null,
  file: null,
});
const fileTypeMismatch = ref(false);

const validateFileMatchesType = () => {
  return !fileTypeMismatch.value;
};

const rules = computed(() => ({
  form: {
    certificateType: modal.value ? { required } : {},
    file: modal.value
      ? {
          required,
          fileMatchesType: validateFileMatchesType,
        }
      : {},
  },
}));
const certificateOptions = computed(() => {
  return [
    {
      text: i18n.global.t('pageCertificates.serviceLoginCertificate'),
      value: 'ServiceLogin Certificate',
    },
    {
      text: i18n.global.t('pageCertificates.adminResetCertificate'),
      value: 'Admin reset certificate',
    },
    {
      text: i18n.global.t('pageCertificates.bmcShell'),
      value: 'BMC shell ACF certificate',
    },
    {
      text: i18n.global.t('pageCertificates.resourceDump'),
      value: 'Resource dump ACF certificate',
    },
  ];
});

onBeforeMount(() => {
  form.value.certificateType = certificateOptions.value[0].value;
});

watch(
  () => form.value.file,
  (newVal) => {
    fileTypeMismatch.value = false;
    v$.value.form.file.$reset();
    v$.value.form.file.$touch();
  },
);
watch(certificateOptions, (options) => {
  if (options.length) {
    form.value.certificateType = options[0].value;
  }
});
watch(
  () => form.value.certificateType,
  (newVal) => {
    v$.value.form.file.$reset();
  },
);

const v$ = useVuelidate(rules, { form });

eventBus.on('upload-login-certificate', () => {
  v$.value.form.file.$reset();
  modal.value = true;
});

function onFileUpload(uploadedfile) {
  form.value.file = uploadedfile;
  v$.value.form.file.$touch();
}
const emit = defineEmits(['ok']);

function handleSubmit() {
  fileTypeMismatch.value = false;
  v$.value.$touch();
  if (v$.value.$invalid) return;
  const file = form.value.file;
  const reader = new FileReader();

  reader.onload = () => {
    try {
      const base64String = reader.result;
      const cleanBase64 = base64String.replace(/^data:.*;base64,/, '');
      const decoded = atob(cleanBase64);
      if (decoded.includes('resourcedump')) {
        if (form.value.certificateType === 'Resource dump ACF certificate') {
          fileTypeMismatch.value = false;
        } else {
          fileTypeMismatch.value = true;
          v$.value.form.file.$touch();
          return;
        }
      } else if (decoded.includes('bmcshell')) {
        if (form.value.certificateType === 'BMC shell ACF certificate') {
          fileTypeMismatch.value = false;
        } else {
          fileTypeMismatch.value = true;
          v$.value.form.file.$touch();
          return;
        }
      } else if (decoded.includes('service')) {
        if (form.value.certificateType === 'ServiceLogin Certificate') {
          fileTypeMismatch.value = false;
        } else {
          fileTypeMismatch.value = true;
          v$.value.form.file.$touch();
          return;
        }
      } else if (decoded.includes('adminreset')) {
        if (form.value.certificateType === 'Admin reset certificate') {
          fileTypeMismatch.value = false;
        } else {
          fileTypeMismatch.value = true;
          v$.value.form.file.$touch();
          return;
        }
      } else {
        fileTypeMismatch.value = true;
        v$.value.form.file.$touch();
        return;
      }
      emit('ok', {
        type: form.value.certificateType,
        file: form.value.file,
      });
      closeModal();
    } catch (error) {
      console.error('Error during file processing:', error);
    }
  };
  reader.readAsDataURL(file);
}
function closeModal() {
  nextTick(() => {
    modal.value = false;
    v$.value.form.file.$reset();
  });
}
function resetForm() {
  form.value.certificateType = certificateOptions.value.length
    ? certificateOptions.value[0].value
    : null;
  form.value.file = null;
  fileTypeMismatch.value = false;
  eventBus.emit('clear-file');
  v$.value.$reset();
}

function onOk(bvModalEvt) {
  bvModalEvt.preventDefault();
  handleSubmit();
}
</script>
<style lang="scss" scoped>
.text-style {
  width: clamp(12px, 80vw, 466px);
}
</style>
