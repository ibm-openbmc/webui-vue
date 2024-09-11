<template>
  <BModal
    id="upload-certificate"
    ref="modal"
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
    <!-- <template #modal-title>
      <template v-if="certificate">
        {{ $t('pageCertificates.replaceCertificate') }}
      </template>
      <template v-else>
        {{ $t('pageCertificates.addNewCertificate') }}
      </template>
    </template> -->
    <BForm>
      <!-- Replace Certificate type -->
      <template v-if="certificate !== null">
        <dl class="mb-4">
          <dt>{{ $t('pageCertificates.modal.certificateType') }}</dt>
          <dd>{{ certificate.certificate }}</dd>
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
            <template v-if="!v$.form.certificateType.required">
              {{ $t('global.form.fieldRequired') }}
            </template>
          </BFormInvalidFeedback>
        </BFormGroup>
      </template>

      <BFormGroup :label="$t('pageCertificates.modal.certificateFile')">
        <template v-if="form.certificateType === 'ServiceLogin Certificate'">
          <form-file
            id="certificate-file"
            v-model="form.file"
            :accept="fileFormat"
            :state="v$.form.file"
          >
            <template #invalid>
              <BFormInvalidFeedback role="alert">
                {{ $t('global.form.required') }}
              </BFormInvalidFeedback>
            </template>
          </form-file>
        </template>
        <template v-else>
          <form-file
            id="certificate-file"
            v-model="form.file"
            :accept="fileFormat"
            :state="v$.form.file"
          >
            <template #invalid>
              <BFormInvalidFeedback role="alert">
                {{ $t('global.form.required') }}
              </BFormInvalidFeedback>
            </template>
          </form-file>
        </template>
      </BFormGroup>
    </BForm>
    <!-- <template #modal-ok>
      <template v-if="certificate">
        {{ $t('global.action.replace') }}
      </template>
      <template v-else>
        {{ $t('global.action.add') }}
      </template>
    </template> -->
    <!-- <template #modal-cancel>
      {{ $t('global.action.cancel') }}
    </template> -->
  </BModal>
</template>

<script setup>
import { required, requiredIf } from '@vuelidate/validators';
// import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';

import { useVuelidate } from '@vuelidate/core';
import { computed, defineProps, reactive, ref, watch, defineEmits } from 'vue';
import { CertificatesStore } from '@/store';
import FormFile from '@/components/Global/FormFile.vue';

import eventBus from '@/eventBus';
// export default {
//   components: { FormFile },
//   // mixins: [VuelidateMixin],
const uploadCertificate = CertificatesStore();
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
const modal = ref(null);
eventBus.on('upload-certificate', () => {
  modal.value.show();
});
//   data() {
//     return {
const form = reactive({
  certificateType: null,
  file: null,
});
//     };
//   },
// computed: {
const certificateTypes = computed(() => {
  return uploadCertificate.availableUploadTypes;
});
const certificateOptions = computed(() => {
  const filteredCertificates = certificateTypes.value
    .filter((certificate) => {
      if (certificate.type === 'ServiceLogin Certificate' && isNotAdmin) {
        return certificate.type !== 'ServiceLogin Certificate';
      }
      return certificate === certificate;
    })
    .map(({ type, label }) => {
      return {
        text: label,
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
    form.certificateType === 'ServiceLogin Certificate'
  ) {
    return '.acf';
  } else {
    return '.pem';
  }
});
const isNotAdmin = computed(() => {
  return props.userRoleId !== 'Administrator';
});

// watch: {
//   certificateOptions: function (options) {
//     if (options.length) {
//       this.form.certificateType = options[0].value;
//     }
//   },
// },
watch(certificateOptions, (options) => {
  if (options.length) {
    form.certificateType = options[0].value;
  }
});
// validations(){
//   return {
//     form: {
//       certificateType: {
//         required: requiredIf(function () {
//           return !this.certificate;
//         }),
//       },
//       file: {
//         required,
//       },
//     },
//   };
// };
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
//   methods: {
const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', {
    addNew: !props.certificate,
    file: form.value.file,
    location: props.certificate ? props.certificate.location : null,
    type: props.certificate
      ? props.certificate.certificate
      : form.valuecertificateType,
  });
  closeModal();
};
const closeModal = () => {
  eventBus.on('upload-certificate', () => {
    modal.value.hidden();
  });
};
const resetForm = () => {
  form.certificateType = certificateOptions.value.length
    ? certificateOptions.value[0].value
    : null;
  console.log('form.certificateType: ', certificateOptions);

  form.file = null;
  // this.$v.$reset();
};
const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
// },
// };
</script>
