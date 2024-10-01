<template>
  <b-modal
    id="modal-otp-generate"
    ref="modal"
    size="lg"
    title="Register"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
    @ok="okFormSubmit"
    @cancel="resetForm"
  >
    <b-row>
      <b-col>
        <b-row>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/d/dd/Qr-code-ver-40.svg"
            alt="QR Code"
            style="max-width: 350px"
          />
        </b-row>
        <b-row>
          <b-col> Secret key: sfghdkhjdshjzgueygweyfvwhjwqdh </b-col
          ><icon-copy />
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
                <span>
                  The user ID which HMC uses will not be able to use MFA
                  feature.
                </span>
              </alert>
              <!-- <label for="username">{{ $t('pageLogin.username') }}</label>
              <b-form-input
                id="username"
                type="text"
                value="adminmfa"
                autofocus="autofocus"
                disabled
              >
              </b-form-input> -->
            </div>
            <!-- <div class="login-form__section mb-3">
              <label for="password">{{ $t('pageLogin.password') }}</label>
              <input-password-toggle>
                <b-form-input
                  id="password"
                  autocomplete="off"
                  aria-describedby="login-error-alert password-required"
                  type="password"
                  data-test-id="login-input-password"
                  class="form-control-with-button"
                >
                </b-form-input>
              </input-password-toggle>
            </div> -->
            <div class="login-form__section mb-3">
              <label>OTP</label>
              <b-form-group>
                <b-form-input v-model="otpValue"> </b-form-input>
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
        Log in
      </b-button>
    </template>
  </b-modal>
</template>
<script>
import IconCopy from '@carbon/icons-vue/es/copy/16';
import Alert from '@/components/Global/Alert';
export default {
  components: { IconCopy, Alert },
  //   methods: {
  //     okFormSubmit() {
  //       this.login();
  //     },
  //   },
};
</script>
