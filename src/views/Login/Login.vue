<template>
  <div class="login-form">
    <BForm
      class="mb-4 pb-5 section-divider"
      novalidate
      @submit.prevent="login()"
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
      <BFormGroup label-for="username" :label="t('pageLogin.username')">
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
      <div class="login-form__section mb-3">
        <label for="password">{{ t('pageLogin.password') }}</label>
        <input-password-toggle @updatePassView="updatePasswordType">
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
          {{ $filters.formatTime(loginPageDetails.dateTime)}}
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
    <!-- Uncomment the below line once env based cofiguration is done -->
    <!-- v-if="acfUploadButton && loginPageDetails.acfWindowActive" -->
    <BButton
      v-if="loginPageDetails.acfWindowActive"
      class="mt-3 p-0 block"
      variant="link"
      @click="initModalUploadCertificate"
    >
      <icon-upload />
      {{ t('pageLogin.uploadServiceLoginCertificate') }}
    </BButton>

    <!-- Modals -->
    <modal-upload-certificate @ok="onModalOk" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
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

const passwordType = ref('password');
const router = useRouter();
const globalStore = stores.GlobalStore();
const { getValidationState } = useVuelidateComposable();
const authenticationStore = stores.AuthenticationStore();
const certificatesStore = stores.CertificatesStore();
const { dataFormatter } = useDataFormatterGlobal();
const { successToast, errorToast } = useToast();
const { t } = useI18n();
const userInfo = reactive({ username: null, password: null });
const rules = { username: { required }, password: { required } };
const acfUploadButton = ref(
  import.meta.env.VITE_APP_ACF_UPLOAD_REQUIRED === 'true'
);
const v$ = useVuelidate(rules, userInfo);
const isBusy = ref(true);
const { startLoader, endLoader } = useLoadingBar();
const disableSubmitButton = ref(false);
const languages = ref([
        {
          value: 'en-US',
          text: 'English',
        },
      ]);

    const authError = computed(() => {
      return authenticationStore.authErrorGetter;
    });
    const unauthError = computed(() => {
      return authenticationStore.unauthErrorGetter;
    });
    const loginPageDetails = computed(() => {
      return authenticationStore.loginPageDetailsGetter;
    });

  onBeforeMount(() => {
    startLoader();
    authenticationStore.dateAndTime().finally(() => {
      endLoader();
      isBusy.value = false;
    });
  });

    const login = () => {
      v$.value.$touch();
      if (v$.value.$invalid) return;
      disableSubmitButton.value = true;
      const username = userInfo.username;
      const password = userInfo.password;
      authenticationStore.login({username, password})
        .then(() => {
          localStorage.setItem('storedLanguage', i18n.locale);
          localStorage.setItem('storedUsername', username);
          globalStore.username = username;
          globalStore.languagePreference = i18n.locale;
          return authenticationStore.checkPasswordChangeRequired(username);
        })
        .then((passwordChangeRequired) => {
          if (passwordChangeRequired) {
            router.push('/change-password');
          } else {
            Promise.all([
              globalStore.getCurrentUser(userInfo.username),
              globalStore.getSystemInfo(),
            ])
              .then(() => {
                router.push('/');
              })
              .catch(() => {
                Promise.all([
                  authenticationStore.unauthlogin(),
                  authenticationStore.logout(),
                ]);
              });
          }
        })
        .catch((error) => console.log(error))
        .finally(() => (disableSubmitButton.value = false));
    }
const initModalUploadCertificate = () => {
  eventBus.emit('upload-login-certificate');
}
const onModalOk = ({ file }) => {
  addNewCertificate(file);
}
const updatePasswordType = (type) => {
  passwordType.value = type;
}
const addNewCertificate = (file) => {
  const type = 'ServiceLogin Certificate';
  certificatesStore
    .addNewACFCertificateOnLoginPage({
      file,
      type,
    })
    .then((success) => successToast(success))
    .catch(({ message }) => errorToast(message));
}
</script>
