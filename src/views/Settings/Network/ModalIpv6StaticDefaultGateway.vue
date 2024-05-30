<template>
  <b-modal
    id="modal-add-ipv6-default-gateway"
    ref="modal"
    :title="
      editModal
        ? $t('pageNetwork.table.editIpv6StaticDefaultGateway')
        : $t('pageNetwork.table.addIpv6StaticDefaultGateway')
    "
    @hidden="resetForm"
  >
    <b-form id="form-ipv6-default-gateway" @submit.prevent="handleSubmit">
      <b-row>
        <b-col sm="6">
          <b-form-group :label="$t('pageNetwork.modal.ipAddress')" label-for="ipAddress">
            <b-form-input
              id="ipAddress"
              v-model="form.ipAddress"
              type="text"
              :state="getValidationState($v.form.ipAddress)"
              @input="$v.form.ipAddress.$touch()"
            />
            <b-form-invalid-feedback role="alert">
              <template v-if="!$v.form.ipAddress.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="!$v.form.ipAddress.pattern">
                {{ $t('global.form.invalidFormat') }}
              </template>
            </b-form-invalid-feedback>
          </b-form-group>
        </b-col>
        <b-col sm="6">
          <b-form-group :label="$t('pageNetwork.modal.prefixLength')" label-for="prefixLength">
            <b-form-input
              id="prefixLength"
              v-model="form.prefixLength"
              type="number"
              :state="getValidationState($v.form.prefixLength)"
              @blur="$v.form.prefixLength.$touch()"
            />
            <b-form-invalid-feedback role="alert">
              <template v-if="!$v.form.prefixLength.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="!$v.form.prefixLength.minLength || !$v.form.prefixLength.maxLength">
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 0,
                    max: 128,
                  })
                }}
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
      <b-button form="form-ipv6-default-gateway" type="submit" variant="primary" @click="onOk">
        {{ $t('global.action.add') }}
      </b-button>
    </template>
  </b-modal>
</template>

<script>
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import { required, minValue, maxValue, helpers } from 'vuelidate/lib/validators';

export default {
  mixins: [VuelidateMixin],
  props: {
    prefixLength: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    editModal: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      form: {
        ipAddress: '',
        prefixLength: 0,
      },
    };
  },
  watch: {
    ipAddress() {
      this.form.ipAddress = this.ipAddress;
    },
    prefixLength() {
      this.form.prefixLength = this.prefixLength;
    },
  },
  validations() {
    return {
      form: {
        ipAddress: {
          required,
          pattern: helpers.regex(
            'pattern',
            /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/,
          ),
        },
        prefixLength: {
          required,
          minValue: minValue(0),
          maxValue: maxValue(128),
        },
      },
    };
  },
  methods: {
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$emit('ok', {
        Address: this.form.ipAddress,
        PrefixLength: Number(this.form.prefixLength),
      });
      this.closeModal();
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
    resetForm() {
      const item = {
        Address: '',
      };
      this.$root.$emit('edit-address', item);
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
