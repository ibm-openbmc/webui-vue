<template>
  <b-modal
    id="modal-asset-tag"
    ref="modal"
    :title="$t('pageOverview.modal.editAssetTag')"
    @hidden="resetForm"
  >
    <b-form id="asset-settings" @submit.prevent="handleSubmit">
      <b-row>
        <b-col sm="8">
          <b-form-group
            :label="$t('pageOverview.assetTag')"
            label-for="asset-tag"
          >
            <b-form-input
              id="asset-tag"
              v-model="form.assetTag"
              type="text"
              :state="getValidationState($v.form.assetTag)"
              @input="$v.form.assetTag.$touch()"
            />
            <b-form-invalid-feedback role="alert">
              <template v-if="!$v.form.assetTag.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
      </b-row>
    </b-form>
    <template #modal-footer="{ cancel }">
      <b-button variant="secondary" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </b-button>
      <b-button
        form="asset-settings"
        type="submit"
        variant="primary"
        @click="onOk"
      >
        {{ $t('global.action.save') }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import { required } from 'vuelidate/lib/validators';

export default {
  mixins: [VuelidateMixin],
  props: {
    tag: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      form: {
        assetTag: this.tag ? this.tag : '',
      },
    };
  },
  watch: {
    tag() {
      this.form.assetTag = this.tag;
    },
  },
  validations() {
    return {
      form: {
        assetTag: {
          required,
        },
      },
    };
  },
  methods: {
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$emit('ok', { AssetTag: this.form.assetTag });
      this.closeModal();
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
    resetForm() {
      this.form.assetTag = this.tag;
      this.$v.$reset();
      this.$emit('hidden');
    },
    onOk(bvModalEvt) {
      // prevent modal close
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
  },
};
</script>
