<template>
  <b-modal id="upload-certificate" ref="modal" @ok="onOk" @hidden="resetForm">
    <template #modal-title>
      {{ $t('pageLogin.modal.addNewAcfCertificate') }}</template
    >
    <b-form>
      <b-form-group
        :label="$t('pageCertificates.modal.certificateType')"
        label-for="certificate-type"
      >
        <b-form-select
          id="certificate-type"
          v-model="form.certificateType"
          :options="certificateOptions"
          :state="getValidationState($v.form.certificateType)"
          @input="$v.form.certificateType.$touch()"
        >
        </b-form-select>
        <b-form-invalid-feedback role="alert">
          <template v-if="!$v.form.certificateType.required">
            {{ $t('global.form.fieldRequired') }}
          </template>
        </b-form-invalid-feedback>
      </b-form-group>
      <b-form-group :label="$t('pageLogin.modal.certificateFile')">
        <form-file
          id="certificate-file"
          v-model="form.file"
          :state="getValidationState($v.form.file)"
          @change="onFileChange($event)"
        >
          <template #invalid>
            <b-form-invalid-feedback v-if="!$v.form.file.required" role="alert">
              {{ $t('global.form.required') }}
            </b-form-invalid-feedback>
            <b-form-invalid-feedback
              v-else-if="!$v.form.file.fileMatchesType"
              role="alert"
            >
              {{ $t('pageCertificates.modal.mismatchError') }}
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

<script>
import { required, requiredIf } from 'vuelidate/lib/validators';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import FormFile from '@/components/Global/FormFile';
export default {
  components: { FormFile },
  mixins: [VuelidateMixin],
  data() {
    return {
      form: {
        certificateType: null,
        file: null,
      },
      fileTypeMismatch: false,
    };
  },
  computed: {
    certificateOptions() {
      return [
        {
          text: 'ServiceLogin Certificate',
          value: this.$t('pageCertificates.serviceLoginCertificate'),
        },
        {
          text: 'Admin reset certificate',
          value: this.$t('pageCertificates.adminResetCertificate'),
        },
        {
          text: 'BMC shell ACF certificate',
          value: this.$t('pageCertificates.bmcShell'),
        },
        {
          text: 'Resource dump ACF certificate',
          value: this.$t('pageCertificates.resourceDump'),
        },
      ];
    },
  },
  watch: {
    'form.file'(newFile) {
      if (newFile) {
        this.fileTypeMismatch = false;
        this.$v.form.file.$reset();
        this.$v.form.file.$touch();
      }
    },
    certificateOptions: function (options) {
      if (options.length) {
        this.form.certificateType = options[0].value;
      }
    },
  },
  mounted() {
    this.form.certificateType = this.certificateOptions[0]?.value;
  },
  validations() {
    return {
      form: {
        certificateType: {
          required: requiredIf(function () {
            return !this.certificate;
          }),
        },
        file: {
          required,
          fileMatchesType: this.validateFileMatchesType,
        },
      },
    };
  },
  methods: {
    onFileChange(event) {
      this.attachment.file = event.target.files[0];
    },
    handleSubmit() {
      this.fileTypeMismatch = false;
      this.$v.$touch();
      if (this.$v.$invalid) return;
      const file = this.form.file;
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const base64String = reader.result;
          const cleanBase64 = base64String.replace(/^data:.*;base64,/, '');
          const decoded = atob(cleanBase64);
          if (decoded.includes('resourcedump')) {
            if (this.form.certificateType === 'Resource dump ACF certificate') {
              this.fileTypeMismatch = false;
            } else {
              this.fileTypeMismatch = true;
              this.$v.form.file.$touch();
              return;
            }
          } else if (decoded.includes('bmcshell')) {
            if (this.form.certificateType === 'BMC shell ACF certificate') {
              this.fileTypeMismatch = false;
            } else {
              this.fileTypeMismatch = true;
              this.$v.form.file.$touch();
              return;
            }
          } else if (decoded.includes('service')) {
            if (this.form.certificateType === 'ServiceLogin Certificate') {
              this.fileTypeMismatch = false;
            } else {
              this.fileTypeMismatch = true;
              this.$v.form.file.$touch();
              return;
            }
          } else if (decoded.includes('adminreset')) {
            if (this.form.certificateType === 'Admin reset certificate') {
              this.fileTypeMismatch = false;
            } else {
              this.fileTypeMismatch = true;
              this.$v.form.file.$touch();
              return;
            }
          }
          this.$emit('ok', {
            type: this.form.certificateType,
            file: this.form.file,
          });
          this.closeModal();
        } catch (error) {
          console.error('Error during file processing:', error);
        }
      };
      reader.readAsDataURL(file);
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
    resetForm() {
      (this.form.certificateType = null), (this.form.file = null);
      this.fileTypeMismatch = false;
      this.$v.$reset();
    },
    onOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    validateFileMatchesType() {
      if (!this.$v.form.file.$dirty) return true;
      return !this.fileTypeMismatch;
    },
  },
};
</script>
