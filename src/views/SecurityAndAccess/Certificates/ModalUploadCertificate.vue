<template>
  <b-modal id="upload-certificate" ref="modal" @ok="onOk" @hidden="resetForm">
    <template #modal-title>
      <template v-if="certificate">
        {{ $t('pageCertificates.replaceCertificate') }}
      </template>
      <template v-else>
        {{ $t('pageCertificates.addNewCertificate') }}
      </template>
    </template>
    <b-form>
      <!-- Replace Certificate type -->
      <template v-if="certificate !== null">
        <dl class="mb-4">
          <dt>{{ $t('pageCertificates.modal.certificateType') }}</dt>
          <dd>{{ certificate.certificate }}</dd>
        </dl>
      </template>

      <!-- Add new Certificate type -->
      <template v-else>
        <b-row>
          <b-col>
            <alert variant="info" class="mb-4">
              <div>
                {{ $t('pageCertificates.alert.targetedAcfMessage') }}
              </div>
            </alert>
          </b-col>
        </b-row>
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
      </template>

      <b-form-group :label="$t('pageCertificates.modal.certificateFile')">
        <template
          v-if="
            form.certificateType === 'ServiceLogin Certificate' ||
            form.certificateType === 'BMC shell ACF certificate' ||
            form.certificateType === 'Resource dump ACF certificate'
          "
        >
          <form-file
            id="certificate-file"
            v-model="form.file"
            :accept="fileFormat"
            :state="getValidationState($v.form.file)"
          >
            <template #invalid>
              <b-form-invalid-feedback
                v-if="!$v.form.file.required"
                role="alert"
              >
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
        </template>
        <template v-else>
          <form-file
            id="certificate-file"
            v-model="form.file"
            :accept="fileFormat"
            :state="getValidationState($v.form.file)"
          >
            <template #invalid>
              <b-form-invalid-feedback role="alert">
                {{ $t('global.form.required') }}
              </b-form-invalid-feedback>
            </template>
          </form-file>
        </template>
      </b-form-group>
    </b-form>
    <template #modal-ok>
      <template v-if="certificate">
        {{ $t('global.action.replace') }}
      </template>
      <template v-else>
        {{ $t('global.action.add') }}
      </template>
    </template>
    <template #modal-cancel>
      {{ $t('global.action.cancel') }}
    </template>
  </b-modal>
</template>

<script>
import { required, requiredIf } from 'vuelidate/lib/validators';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import Alert from '@/components/Global/Alert';

import FormFile from '@/components/Global/FormFile';

export default {
  components: { FormFile, Alert },
  mixins: [VuelidateMixin],
  props: {
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
  },
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
    certificateTypes() {
      return this.$store.getters['certificates/availableUploadTypes'];
    },
    certificateOptions() {
      const filteredCertificates = this.certificateTypes
        .filter((certificate) => {
          if (certificate.type === 'Admin reset certificate') {
            return false;
          }
          if (
            certificate.type === 'ServiceLogin Certificate' &&
            this.isNotAdmin
          ) {
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
        this.form.certificateType === filteredCertificates?.[0]?.value;
      }
      return filteredCertificates;
    },
    fileFormat() {
      if (
        this.certificate?.certificate === 'ServiceLogin Certificate' ||
        this.form.certificateType === 'ServiceLogin Certificate' ||
        this.certificate?.certificate === 'BMC shell ACF certificate' ||
        this.form.certificateType === 'BMC shell ACF certificate' ||
        this.certificate?.certificate === 'Resource dump ACF certificate' ||
        this.form.certificateType === 'Resource dump ACF certificate'
      ) {
        return '.acf';
      } else {
        return '.pem';
      }
    },
    isNotAdmin() {
      return this.userRoleId !== 'Administrator';
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
    'form.certificateType'(newValue) {
      if (newValue) {
        this.$v.form.file.$reset();
      }
    },
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
    handleSubmit() {
      this.fileTypeMismatch = false;
      this.$v.$touch();
      if (this.$v.$invalid) return;
      if (
        this.form.certificateType === 'BMC shell ACF certificate' ||
        this.form.certificateType === 'Resource dump ACF certificate' ||
        this.form.certificateType === 'ServiceLogin Certificate'
      ) {
        const file = this.form.file;
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const base64String = reader.result;
            const cleanBase64 = base64String.replace(/^data:.*;base64,/, '');
            const decoded = atob(cleanBase64);
            if (decoded.includes('resourcedump')) {
              if (
                this.form.certificateType === 'Resource dump ACF certificate'
              ) {
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
            } else {
              this.fileTypeMismatch = true;
              this.$v.form.file.$touch();
              return;
            }
            this.$emit('ok', {
              addNew: !this.certificate,
              file: this.form.file,
              location: this.certificate ? this.certificate.location : null,
              type: this.certificate
                ? this.certificate.certificate
                : this.form.certificateType,
            });
            this.closeModal();
          } catch (error) {
            console.error('Error during file processing:', error);
          }
        };
        reader.readAsDataURL(file);
      } else {
        this.$emit('ok', {
          addNew: !this.certificate,
          file: this.form.file,
          location: this.certificate ? this.certificate.location : null,
          type: this.certificate
            ? this.certificate.certificate
            : this.form.certificateType,
        });
        this.closeModal();
      }
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
    resetForm() {
      this.form.certificateType = this.certificateOptions.length
        ? this.certificateOptions[0].value
        : null;
      this.form.file = null;
      this.fileTypeMismatch = false;
      this.$v.$reset();
    },
    onOk(bvModalEvt) {
      // prevent modal close
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
