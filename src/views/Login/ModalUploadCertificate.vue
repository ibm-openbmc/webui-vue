<template>
  <b-modal id="upload-certificate" ref="modal" @ok="onOk" @hidden="resetForm">
    <template #modal-title>
      {{ $t('pageLogin.modal.addNewServiceLoginCertificate') }}</template
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
    certificateOptions: function (options) {
      if (options.length) {
        this.form.certificateType = options[0].value;
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
        },
      },
    };
  },
  methods: {
    onFileChange(event) {
      this.attachment.file = event.target.files[0];
    },
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$emit('ok', {
        type: this.form.certificateType,
        file: this.form.file,
      });
      this.closeModal();
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
    resetForm() {
      (this.form.certificateType = null), (this.form.file = null);
      this.$v.$reset();
    },
    onOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
  },
};
</script>
