<template>
  <b-modal id="upload-certificate" ref="modal" @ok="onOk" @hidden="resetForm">
    <template #modal-title> {{ $t('pageLogin.modal.addNewServiceLoginCertificate') }}</template>
    <b-form>
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
import { required } from 'vuelidate/lib/validators';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import FormFile from '@/components/Global/FormFile';
export default {
  components: { FormFile },
  mixins: [VuelidateMixin],
  data() {
    return {
      form: {
        file: null,
      },
    };
  },
  computed: {},
  validations() {
    return {
      form: {
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
      this.form.file = null;
      this.$v.$reset();
    },
    onOk(bvModalEvt) {
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
  },
};
</script>
