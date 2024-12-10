<template>
  <b-modal
    id="register-otp-modal"
    ref="modal"
    size="lg"
    :title="$t('pageUserManagement.modal.enableMfa')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
    @ok="okFormSubmit"
    @cancel="resetMfa"
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
            <b-button v-b-toggle.collapse-2 class="m-1 buttonStyle">
              <icon-chevron />
              {{ $t('pageUserManagement.modal.secretKey') }}</b-button
            >
            <b-collapse id="collapse-2">
              {{ dataFormatter(secretKey) }}
            </b-collapse>
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
              <alert variant="warning" class="mb-4">
                <dt>
                  {{ $t('pageOverview.bmcTime') }}:
                  {{ bmcTime | formatDate }}
                  {{ bmcTime | formatTime }}
                </dt>
                <span>
                  {{ $t('pageUserManagement.mfaTimeMatch') }}
                  <b-link to="/settings/date-time">
                    {{ $t('appPageTitle.dateTime') }}</b-link
                  >
                </span>
              </alert>
            </div>
            <div class="login-form__section mb-3">
              <alert variant="info" class="mb-4">
                <span>
                  {{ $t('pageUserManagement.modal.mfaInfoAlert') }}
                </span>
              </alert>
            </div>
            <div class="login-form__section mb-3">
              <label>{{ $t('pageUserManagement.modal.otp') }}</label>
              <info-tooltip class="ml-1" :title="formattedTooltip">
              </info-tooltip>
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
        {{ $t('pageUserManagement.modal.validate') }}
      </b-button>
    </template>
  </b-modal>
</template>
<script>
import { required } from 'vuelidate/lib/validators';
import IconCopy from '@carbon/icons-vue/es/copy/16';
import IconCheckmark from '@carbon/icons-vue/es/checkmark/16';
import Alert from '@/components/Global/Alert';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import QrcodeVue from 'qrcode.vue';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import InfoTooltip from '@/components/Global/InfoTooltip';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';

export default {
  components: {
    IconCopy,
    Alert,
    IconCheckmark,
    IconChevron,
    QrcodeVue,
    InfoTooltip,
  },
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
    formattedTooltip() {
      return (
        this.$t('pageUserManagement.modal.helptext') +
        '</br>' +
        this.$t('pageUserManagement.modal.helptextStep1') +
        '</br>' +
        this.$t('pageUserManagement.modal.helptextStep2EnableMfa')
      );
    },
    bmcTime() {
      return this.$store.getters['global/bmcTime'];
    },
    currentMfaBypassed() {
      return this.$store.getters['userManagement/isCurrentUserMfaBypassed'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
    secretKey() {
      return this.$store.getters['userManagement/secretKeyInfo'];
    },
  },
  watch: {
    secretKey(value) {
      this.$store.dispatch('global/getBmcTime');
      if (value === null) {
        this.qrValue = null;
      } else {
        this.qrValue = `otpauth://totp/${this.issuer}:${this.accountName}?secret=${value}&issuer=${this.issuer}`;
      }
    },
  },
  validations() {
    return {
      otpValue: { required },
    };
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
    resetMfa() {
      this.$emit('disable-mfa');
      this.otpValue = null;
      this.$v.$reset();
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
          this.$store
            .dispatch('userManagement/updateGlobalMfa', {
              globalMfa: true,
            })
            .then((message) => {
              this.successToast(message);
              this.closeModal();
              this.resetForm();
              if (!this.isServiceUser && !this.currentMfaBypassed) {
                this.$store.dispatch('authentication/logout');
              }
            })
            .catch(({ message }) => this.errorToast(message));
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
<style lang="scss" scoped>
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
.buttonStyle {
  margin-left: 0px !important;
}
.btn {
  svg {
    margin-right: 4px;
  }
}
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
</style>
