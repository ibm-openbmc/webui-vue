<template>
  <b-modal
    id="modal-otp-generate"
    ref="modal"
    size="lg"
    :title="$t('pageLogin.modal.register')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    hide-header-close
    no-close-on-backdrop
    @ok="okFormSubmit"
    @cancel="resetForm"
    @hidden="resetForm"
  >
    <b-row>
      <b-col>
        <b-row>
          <qrcode-vue
            v-if="qrValue"
            class="qrcode-styling"
            :value="qrValue"
            :size="size"
            level="H"
            render-as="canvas"
          />
          <div v-else class="emptyQrStyle"></div>
        </b-row>
        <b-row>
          <b-col>
            {{ $t('pageUserManagement.modal.secretKey') }}:
            {{ dataFormatter(secretKey) }}
          </b-col>
          <b-button @click="copySecretKey">
            <template v-if="secretKeyCopied">
              <icon-checkmark title="Copied" />
            </template>
            <template v-else>
              <icon-copy title="Copy Secret key" />
            </template>
          </b-button>
        </b-row>
      </b-col>
      <b-col>
        <b-form
          id="otp-generate-form"
          style="margin-top: 45px"
          novalidate
          @submit.prevent
        >
          <b-container fluid="xl">
            <div class="login-form__section mb-3">
              <label>{{ $t('pageUserManagement.modal.otp') }}</label>
              <b-form-group>
                <b-form-input
                  v-model="otpValue"
                  :state="getValidationState($v.otpValue)"
                  @input="$v.otpValue.$touch()"
                />
                <b-form-invalid-feedback role="alert">
                  <template v-if="!$v.otpValue.required">
                    {{ $t('global.form.fieldRequired') }}
                  </template>
                </b-form-invalid-feedback>
              </b-form-group>
            </div>
          </b-container>
        </b-form>
      </b-col>
    </b-row>
    <template #modal-footer="{ ok, cancel }">
      <b-button variant="secondary" size="sm" @click="cancel()">
        {{ $t('pageServerPowerOperations.modal.networkSettings.cancel') }}
      </b-button>
      <b-button
        form="otp-generate-form"
        type="submit"
        variant="primary"
        size="sm"
        @click="ok()"
      >
        {{ $t('pageLogin.modal.login') }}
      </b-button>
    </template>
  </b-modal>
</template>
<script>
import { required } from 'vuelidate/lib/validators';
import IconCopy from '@carbon/icons-vue/es/copy/16';
import IconCheckmark from '@carbon/icons-vue/es/checkmark/16';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import QrcodeVue from 'qrcode.vue';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
export default {
  components: { IconCopy, IconCheckmark, QrcodeVue },
  mixins: [DataFormatterMixin, BVToastMixin, VuelidateMixin],
  data() {
    return {
      issuer: 'bmc',
      accountName: localStorage.getItem('storedUsername'),
      otpValue: null,
      secretKeyCopied: false,
      qrValue: null,
      size: 350,
    };
  },
  computed: {
    secretKey() {
      return this.$store.getters['userManagement/secretKeyInfo'];
    },
  },
  validations() {
    return {
      otpValue: { required },
    };
  },
  watch: {
    secretKey(value) {
      if (value === null) {
        this.qrValue = null;
      } else {
        this.qrValue = `otpauth://totp/${this.issuer}:${this.accountName}?secret=${value}&issuer=${this.issuer}`;
      }
    },
  },
  methods: {
    copySecretKey() {
      navigator.clipboard.writeText(this.secretKey).then(() => {
        // Show copied text for 5 seconds
        this.secretKeyCopied = true;
        setTimeout(() => {
          this.secretKeyCopied = false;
        }, 5000 /*5 seconds*/);
      });
    },
    okFormSubmit(bvModalEvt) {
      // prevent modal close
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    resetForm() {
      this.otpValue = null;
      this.$v.$reset();
    },
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$store
        .dispatch('userManagement/verifyRegisterTotp', {
          otpValue: this.otpValue,
        })
        .then(() => {
          const username = localStorage.getItem('storedUsername');
          Promise.all([
            this.$store.dispatch('global/getCurrentUser', username),
            this.$store.dispatch('global/getSystemInfo'),
          ])
            .then(() => {
              this.closeModal();
              this.$router.push('/');
            })
            .catch(() => {
              this.closeModal();
              Promise.all([
                this.$store.dispatch('authentication/unauthlogin'),
                this.$store.dispatch('authentication/logout'),
              ]);
            });
        })
        .catch(({ message }) => this.errorToast(message));
    },
    closeModal() {
      this.$nextTick(() => {
        this.$refs.modal.hide();
      });
    },
  },
};
</script>
<style scoped>
.qrcode-styling {
  margin-left: 15px;
  max-width: 350px;
}
.row {
  margin-left: 0px;
  margin-right: 0px;
}
.emptyQrStyle {
  width: 350px;
  height: 350px;
}
</style>
