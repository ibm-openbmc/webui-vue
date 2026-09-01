<template>
  <div class="login-form">
    <BForm
      class="mb-4 pb-5 section-divider"
      novalidate
      @submit.prevent="submitLogin()"
    >
      <alert class="login-error mb-4" :show="authError" variant="danger">
        <p id="login-error-alert">
          {{ t('pageLogin.alert.message') }}
        </p>
      </alert>
      <alert class="login-error mb-4" :show="unauthError" variant="danger">
        <p id="unauth-login-error-alert">
          {{ t('pageLogin.alert.unauthorizedMessage') }}
        </p>
      </alert>
      <BFormGroup label-for="language" :label="t('pageLogin.language')">
        <BFormSelect
          id="language"
          v-model="$i18n.locale"
          :options="languages"
          data-test-id="login-select-language"
        ></BFormSelect>
      </BFormGroup>
      <BFormGroup
        aria-label="username"
        label-for="username"
        :label="t('pageLogin.username')"
      >
        <BFormInput
          id="username"
          v-model="userInfo.username"
          aria-describedby="login-error-alert username-required"
          :state="getValidationState(v$.username)"
          type="text"
          autofocus="autofocus"
          data-test-id="login-input-username"
          @input="v$.username.$touch()"
        >
        </BFormInput>
        <BFormInvalidFeedback id="username-required" role="alert">
          <template v-if="v$.username.required">
            {{ t('global.form.fieldRequired') }}
          </template>
        </BFormInvalidFeedback>
      </BFormGroup>
      <div class="login-form__section password-style">
        <label for="password">{{ t('pageLogin.password') }}</label>
        <input-password-toggle @update-pass-view="updatePasswordType">
          <BFormInput
            id="password"
            v-model="userInfo.password"
            autocomplete="off"
            aria-describedby="login-error-alert password-required"
            :state="getValidationState(v$.password)"
            :type="passwordType"
            data-test-id="login-input-password"
            class="form-control-with-button"
            @input="v$.password.$touch()"
          >
          </BFormInput>
          <BFormInvalidFeedback id="password-required" role="alert">
            <template v-if="v$.password.required">
              {{ t('global.form.fieldRequired') }}
            </template>
          </BFormInvalidFeedback>
        </input-password-toggle>
      </div>
      <div v-if="isGlobalMfaEnabled" class="login-form__section mb-3">
        <label>TOTP</label>
        <info-tooltip class="m-1" :title="$t('pageLogin.totpTooltip')">
        </info-tooltip>
        <BFormGroup aria-label="totp">
          <BFormInput
            v-model="otpValue"
            aria-label="totp-input"
            data-test-id="login-input-totp"
          >
          </BFormInput>
        </BFormGroup>
      </div>
      <BButton
        class="mt-4 w-100"
        type="submit"
        variant="primary"
        data-test-id="login-button-submit"
        :disabled="disableSubmitButton"
        >{{ t('pageLogin.logIn') }}</BButton
      >
    </BForm>
    <!-- Service login -->
    <BRow class="mt-3">
      <BCol>
        <dl>
          <dt>{{ t('pageLogin.dateAndTime') }}</dt>
          <dd v-if="loginPageDetails.dateTime">
            {{ $filters.formatDate(loginPageDetails.dateTime) }}
            {{ $filters.formatTime(loginPageDetails.dateTime) }}
          </dd>
          <dd v-else>--</dd>
        </dl>
        <dl>
          <dt>{{ t('pageLogin.serialNumber') }}</dt>
          <dd>{{ dataFormatter(loginPageDetails.serial) }}</dd>
        </dl>
        <dl>
          <dt>{{ t('pageLogin.model') }}</dt>
          <dd>{{ dataFormatter(loginPageDetails.model) }}</dd>
        </dl>
      </BCol>
    </BRow>
    <BButton
      v-if="acfUploadButton && loginPageDetails.acfWindowActive"
      class="mt-3 p-0 block"
      variant="link"
      @click="initModalUploadCertificate"
    >
      <icon-upload />
      {{ t('pageLogin.uploadAcfCertificate') }}
    </BButton>

    <!-- Modals -->
    <modal-upload-certificate @ok="addNewCertificate" />
    <modal-otp-generate></modal-otp-generate>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';
import stores from '@/store';
import i18n from '@/i18n';
import { useRouter } from 'vue-router';
import eventBus from '@/eventBus';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import Alert from '@/components/Global/Alert.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import IconUpload from '@carbon/icons-vue/es/upload/20';
import useDataFormatterGlobal from '../../components/Composables/useDataFormatterGlobal';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import ModalUploadCertificate from './ModalUploadCertificate.vue';
import ModalOtpGenerate from './ModalOtpGenerate.vue';
import { useLogin } from '@/api/composables/useLogin';

const router = useRouter();
const { getValidationState } = useVuelidateComposable();
const { dataFormatter } = useDataFormatterGlobal();
const { successToast, errorToast } = useToast();
const { t } = useI18n();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

const authenticationStore = stores.AuthenticationStore();
const certificatesStore = stores.CertificatesStore();
const userManagementStore = stores.UserManagementStore();
const globalStore = stores.GlobalStore();

// ── Vue Query composable ──────────────────────────────────────────────────────
const {
  loginPageDetails,
  isGlobalMfaEnabled,
  isLoading,
  login: loginMutate,
} = useLogin();

// ── Sync loading bar with TanStack Query loading state ────────────────────────
watch(isLoading, (loading) => {
  if (loading) {
    startLoader();
  } else {
    endLoader();
  }
});

onBeforeRouteLeave(() => {
  hideLoader();
});

// ── Local state ───────────────────────────────────────────────────────────────
const passwordType = ref('password');
const acfUploadButton = ref(
  import.meta.env.VITE_APP_ACF_UPLOAD_REQUIRED === 'true',
);
const disableSubmitButton = ref(false);
const otpValue = ref('');
const languages = ref([
  {
    value: 'de',
    text: 'German',
  },
  {
    value: 'en-US',
    text: 'English',
  },
  {
    value: 'es',
    text: 'Español',
  },
  {
    value: 'fr',
    text: 'French',
  },
  {
    value: 'it',
    text: 'Italian',
  },
  {
    value: 'ja',
    text: 'Japanese',
  },
  {
    value: 'ko',
    text: 'Korean',
  },
  {
    value: 'pt-BR',
    text: 'Brazilian Portuguese',
  },
  {
    value: 'zh-CN',
    text: '简体中文 - Chinese simplified',
  },
  {
    value: 'zh-TW',
    text: '繁体中文 - Chinese traditional',
  },
]);

const userInfo = reactive({ username: null, password: null });
const rules = { username: { required }, password: { required } };
const v$ = useVuelidate(rules, userInfo);

const authError = computed(() => authenticationStore.authErrorGetter);
const unauthError = computed(() => authenticationStore.unauthErrorGetter);

// ── Login handler ─────────────────────────────────────────────────────────────
const submitLogin = async () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  disableSubmitButton.value = true;
  authenticationStore.authError = false;
  authenticationStore.unauthError = false;

  try {
    const { isGenerateOtpRequired } = await loginMutate({
      username: userInfo.username,
      password: userInfo.password,
      otpInfo: otpValue.value,
    });

    authenticationStore.authSuccess();

    localStorage.setItem('storedLanguage', i18n.global.locale.value);
    localStorage.setItem('storedUsername', userInfo.username);
    globalStore.username = userInfo.username;
    globalStore.languagePreference = i18n.global.locale.value;

    const passwordChangeRequired =
      await authenticationStore.checkPasswordChangeRequired(userInfo.username);

    if (passwordChangeRequired) {
      router.push('/change-password');
      return;
    }

    if (isGenerateOtpRequired) {
      authenticationStore.isGenerateOtpRequired = true;
      userManagementStore.clearSecretKey().finally(() => {
        userManagementStore.generateSecretKey().then(() => {
          eventBus.emit('otp-generate-modal');
        });
      });
      return;
    }

    globalStore.getCurrentUser(userInfo.username);
    await globalStore
      .getSystemInfo()
      .then(() => {
        router.push('/');
      })
      .catch(() => {
        Promise.all([
          authenticationStore.unauthlogin(),
          authenticationStore.logout(),
        ]);
      });
  } catch (error) {
    authenticationStore.authError = true;
    console.error(error);
  } finally {
    disableSubmitButton.value = false;
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const initModalUploadCertificate = () => {
  eventBus.emit('upload-login-certificate');
};

const updatePasswordType = (type) => {
  passwordType.value = type;
};

const addNewCertificate = ({ type, file }) => {
  certificatesStore
    .addNewACFCertificateOnLoginPage({ file, type })
    .then((success) => successToast(success))
    .catch(({ message }) => errorToast(message));
};
</script>

<style lang="css" scoped>
.password-style {
  margin-bottom: 2.5rem;
}
</style>
