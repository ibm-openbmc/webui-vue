<template>
  <BModal
    id="upload-certificate"
    v-model="modal"
    :title="
      certificate
        ? $t('pageCertificates.replaceCertificate')
        : $t('pageCertificates.addNewCertificate')
    "
    :ok-title="
      certificate ? $t('global.action.replace') : $t('global.action.add')
    "
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm>
      <!-- Replace Certificate type -->
      <template v-if="certificate !== null">
        <dl class="mb-4">
          <dt>{{ $t('pageCertificates.modal.certificateType') }}</dt>
          <dd>{{ getCertificateLabel(certificate.certificate) }}</dd>
        </dl>
      </template>
      <!-- Add new Certificate type -->
      <template v-else>
        <BRow>
          <BCol>
            <alert variant="info" class="mb-4">
              <div>
                {{ $t('pageCertificates.alert.targetedAcfMessage') }}
              </div>
            </alert>
          </BCol>
        </BRow>
        <BFormGroup
          :label="$t('pageCertificates.modal.certificateType')"
          label-for="certificate-type"
        >
          <BFormSelect
            id="certificate-type"
            v-model="form.certificateType"
            :options="certificateOptions"
            :state="v$.form.certificateType"
            @update:model-value="v$.form.certificateType.$touch()"
          >
          </BFormSelect>
          <BFormInvalidFeedback role="alert" class="text-style">
            <template v-if="!v$.form.certificateType.required">
              {{ $t('global.form.fieldRequired') }}
            </template>
          </BFormInvalidFeedback>
        </BFormGroup>
      </template>

      <BFormGroup :label="$t('pageCertificates.modal.certificateFile')">
        <FormFile
          id="certificate-file"
          v-model="form.file"
          :accept="fileFormat"
          :state="getValidationState(v$.form.file)"
          @input="onFileUpload"
        >
          <template #invalid>
            <BFormInvalidFeedback
              v-if="v$.form.file.required.$invalid"
              role="alert"
              class="text-style"
            >
              {{ $t('global.form.required') }}
            </BFormInvalidFeedback>
            <BFormInvalidFeedback
              v-else-if="
                (form.certificateType === 'ServiceLogin Certificate' ||
                  form.certificateType === 'BMC shell ACF certificate' ||
                  form.certificateType === 'Resource dump ACF certificate') &&
                v$.form.file.fileMatchesType.$invalid
              "
              role="alert"
              class="text-style"
            >
              {{ $t('pageCertificates.modal.mismatchError') }}
            </BFormInvalidFeedback>
          </template>
        </FormFile>
      </BFormGroup>
    </BForm>
  </BModal>
</template>

<script setup>
// @ts-ignore
import Alert from '@/components/Global/Alert.vue';
import { required, requiredIf } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { computed, ref, watch } from 'vue';
// @ts-ignore
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
// @ts-ignore
import FormFile from '@/components/Global/FormFile.vue';
// @ts-ignore
import eventBus from '@/eventBus';
// @ts-ignore
import i18n from '@/i18n';
import {
  useCertificates,
  CERTIFICATE_TYPES,
} from '@/api/composables/useCertificates';

const { getValidationState } = useVuelidateComposable();

const { availableUploadTypes } = useCertificates();

const props = defineProps({
  certificate: {
    type: Object,
    default: null,
    validator: (prop) => {
      if (prop === null) return true;
      return (
        Object.prototype.hasOwnProperty.call(prop, 'type') &&
        Object.prototype.hasOwnProperty.call(prop, 'certificate')
      );
    },
  },
  userRoleId: {
    type: String,
    default: null,
  },
});
const modal = ref(false);
eventBus.on('upload-certificate', () => {
  v$.value.form.file.$reset();
  modal.value = true;
});
const form = ref({
  certificateType: null,
  file: null,
});
const fileTypeMismatch = ref(false);
const certificateTypes = computed(() => {
  return availableUploadTypes.value || [];
});
const certificateOptions = computed(() => {
  const filteredCertificates = certificateTypes.value
    .filter((certificate) => {
      if (certificate.type === 'Admin reset certificate') {
        return false;
      }
      if (certificate.type === 'ServiceLogin Certificate' && isNotAdmin.value) {
        return certificate.type !== 'ServiceLogin Certificate';
      }
      return certificate === certificate;
    })
    .map(({ type, labelKey }) => {
      return {
        text: i18n.global.t(labelKey),
        value: type,
      };
    });
  if (filteredCertificates.length === 1) {
    form.value.certificateType === filteredCertificates?.[0]?.value;
  }
  return filteredCertificates;
});
const fileFormat = computed(() => {
  if (
    props.certificate?.certificate === 'ServiceLogin Certificate' ||
    form.value.certificateType === 'ServiceLogin Certificate' ||
    props.certificate?.certificate === 'BMC shell ACF certificate' ||
    form.value.certificateType === 'BMC shell ACF certificate' ||
    props.certificate?.certificate === 'Resource dump ACF certificate' ||
    form.value.certificateType === 'Resource dump ACF certificate'
  ) {
    return '.acf';
  } else {
    return '.pem';
  }
});
const isNotAdmin = computed(() => {
  return props.userRoleId !== 'Administrator';
});

const getCertificateLabel = (certificateType) => {
  const certConfig = CERTIFICATE_TYPES.find((c) => c.type === certificateType);
  return certConfig ? i18n.global.t(certConfig.labelKey) : certificateType;
};

watch(
  () => form.value.file,
  (newVal) => {
    fileTypeMismatch.value = false;
    v$.value.form.file.$reset();
    v$.value.form.file.$touch();
  },
);
// Only set initial certificateType when modal opens and form is empty
// Don't reset on data refetch to preserve user's selection
watch(certificateOptions, (options) => {
  if (options.length && !form.value.certificateType && modal.value) {
    form.value.certificateType = options[0].value;
  }
});
watch(
  () => form.value.certificateType,
  (newVal) => {
    v$.value.form.file.$reset();
  },
);

const validateFileMatchesType = () => {
  return !fileTypeMismatch.value;
};

const rules = computed(() => ({
  form: {
    certificateType: {
      required: requiredIf(function () {
        return !props.certificate;
      }),
    },
    file: {
      required,
      fileMatchesType: validateFileMatchesType,
    },
  },
}));
const v$ = useVuelidate(rules, { form });

const emit = defineEmits(['ok']);
function onFileUpload(uploadedfile) {
  form.value.file = uploadedfile;
  v$.value.form.file.$touch();
}
const handleSubmit = () => {
  fileTypeMismatch.value = false;
  v$.value.$touch();
  if (v$.value.$invalid) return;
  if (
    form.value.certificateType === 'BMC shell ACF certificate' ||
    form.value.certificateType === 'Resource dump ACF certificate' ||
    form.value.certificateType === 'ServiceLogin Certificate'
  ) {
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
        } else {
          fileTypeMismatch.value = true;
          v$.value.form.file.$touch();
          return;
        }
        emit('ok', {
          addNew: !props.certificate,
          file: form.value.file,
          location: props.certificate ? props.certificate.location : null,
          type: props.certificate
            ? props.certificate.certificate
            : form.value.certificateType,
        });
        closeModal();
      } catch (error) {
        console.error('Error during file processing:', error);
      }
    };
    reader.readAsDataURL(file);
  } else {
    emit('ok', {
      addNew: !props.certificate,
      file: form.value.file,
      location: props.certificate ? props.certificate.location : null,
      type: props.certificate
        ? props.certificate.certificate
        : form.value.certificateType,
    });
    closeModal();
  }
};
const closeModal = () => {
  modal.value = false;
  v$.value.form.file.$reset();
};
const resetForm = () => {
  form.value.certificateType = certificateOptions.value.length
    ? certificateOptions.value[0].value
    : null;
  form.value.file = null;
  fileTypeMismatch.value = false;
  eventBus.emit('clear-file');
  v$.value.$reset();
};
const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
<style lang="scss" scoped>
.text-style {
  width: clamp(12px, 80vw, 466px);
}
</style>
