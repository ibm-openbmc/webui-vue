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
    :cancel-title="$t('global.action.cancel')"
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
          <BFormInvalidFeedback role="alert">
            <template v-if="v$.form.certificateType.required.$invalid">
              {{ $t('global.form.fieldRequired') }}
            </template>
          </BFormInvalidFeedback>
        </BFormGroup>
      </template>

      <BFormGroup :label="$t('pageCertificates.modal.certificateFile')">
        <template v-if="form.certificateType === 'ServiceLogin Certificate'">
          <FormFile
            id="certificate-file"
            :accept="fileFormat"
            :state="getValidationState(v$.form.file)"
            @input="onFileUpload"
          >
            <template #invalid>
              <BFormInvalidFeedback role="alert">
                {{ $t('global.form.required') }}
              </BFormInvalidFeedback>
            </template>
          </FormFile>
        </template>
        <template v-else>
          <FormFile
            id="certificate-file"
            :accept="fileFormat"
            :state="getValidationState(v$.form.file)"
            @input="onFileUpload"
          >
            <template #invalid>
              <BFormInvalidFeedback role="alert">
                {{ $t('global.form.required') }}
              </BFormInvalidFeedback>
            </template>
          </FormFile>
        </template>
      </BFormGroup>
    </BForm>
  </BModal>
</template>

<script setup>
import { required, requiredIf } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { computed, ref, watch } from 'vue';
import stores from '@/store';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import FormFile from '@/components/Global/FormFile.vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import {
  CERTIFICATE_TYPES,
  getCertificateProp,
} from '@/store/modules/SecurityAndAccess/CertificatesStore.js';

const { getValidationState } = useVuelidateComposable();

const uploadCertificate = stores.CertificatesStore();

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
  modal.value = true;
});
const form = ref({
  certificateType: null,
  file: null,
});
const certificateTypes = computed(() => {
  return props.certificate
    ? uploadCertificate.replaceableTypesGetter
    : uploadCertificate.availableUploadTypesGetter;
});
const certificateOptions = computed(() => {
  const filteredCertificates = certificateTypes.value
    .filter((certificate) => {
      if (certificate.type === 'ServiceLogin Certificate' && isNotAdmin.value) {
        return certificate.type !== 'ServiceLogin Certificate';
      }
      return certificate === certificate;
    })
    .map(({ type }) => {
      return {
        text: getCertificateProp(type, 'label'),
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
    form.value.certificateType === 'ServiceLogin Certificate'
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
  return getCertificateProp(certificateType, 'label') || certificateType;
};

watch(certificateOptions, (options) => {
  if (options.length) {
    form.value.certificateType = options[0].value;
  }
});

const rules = computed(() => ({
  form: {
    certificateType: {
      required: requiredIf(function () {
        return !props.certificate;
      }),
    },
    file: {
      required,
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
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', {
    addNew: !props.certificate,
    file: form.value.file,
    location: props.certificate ? props.certificate.location : null,
    type: props.certificate
      ? props.certificate.certificate
      : form.value.certificateType,
  });
  closeModal();
};
const closeModal = () => {
  modal.value = false;
};
const resetForm = () => {
  form.value.certificateType = certificateOptions.value.length
    ? certificateOptions.value[0].value
    : null;
  form.value.file = null;
  eventBus.emit('clear-file');
  v$.value.$reset();
};
const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
