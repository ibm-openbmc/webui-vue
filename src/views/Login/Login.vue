<!-- TODO: Work Requird -->
<template>
  <BForm class="login-form" novalidate @submit.prevent="login">
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
        type="text"
        autofocus="autofocus"
        data-test-id="login-input-username"
        :state="getValidationState(v$.username)"
      >
      </BFormInput>
      <BFormInvalidFeedback id="username-required" role="alert">
        <template v-if="v$.username.required">
          {{ t('global.form.fieldRequired') }}
        </template>
      </BFormInvalidFeedback>
    </BFormGroup>
    <BFormGroup label-for="password" :label="t('pageLogin.password')">
      <BFormInput
        id="password"
        v-model="userInfo.password"
        aria-describedby="login-error-alert password-required"
        type="password"
        data-test-id="login-input-password"
        class="form-control-with-button"
        :state="getValidationState(v$.password)"
      >
      </BFormInput>
      <BFormInvalidFeedback id="password-required" role="alert">
        <template v-if="v$.password.required">
          {{ t('global.form.fieldRequired') }}
        </template>
      </BFormInvalidFeedback>
    </BFormGroup>
    <BButton
      class="mt-3 btn-primary"
      type="submit"
      variant="primary"
      data-test-id="login-button-submit"
      :disabled="disableSubmitButton"
    >
      {{ $t('pageLogin.logIn') }}
    </BButton>
  </BForm>
  <!-- Service login -->
  <b-row class="mt-3">
    <b-col>
      <dl>
        <dt>{{ $t('pageLogin.dateAndTime') }}</dt>
        <dd v-if="loginPageDetails.dateTime">
          {{ $filters.formatDate(loginPageDetails.dateTime) }}
          {{ $filters.formatTime(loginPageDetails.dateTime)}}
        </dd>
        <dd v-else>--</dd>
      </dl>
      <dl>
        <dt>{{ $t('pageLogin.serialNumber') }}</dt>
        <dd>{{ dataFormatter(loginPageDetails.serial) }}</dd>
      </dl>
      <dl>
        <dt>{{ $t('pageLogin.model') }}</dt>
        <dd>{{ dataFormatter(loginPageDetails.model) }}</dd>
      </dl>
    </b-col>
  </b-row>
  <b-button
    v-if="loginPageDetails.acfWindowActive"
    class="mt-3 p-0 block"
    variant="link"
    @click="initModalUploadCertificate"
  >
    <icon-upload />
    {{ $t('pageLogin.uploadServiceLoginCertificate') }}
  </b-button>

  <!-- Modals -->
  <modal-upload-certificate @ok="onModalOk" />
</template>

<script setup>
import { ref, reactive, computed, onBeforeMount } from 'vue';
import { useI18n } from 'vue-i18n';
import { AuthenticationStore, CertificatesStore } from '@/store';
import i18n from '@/i18n';
import { useRouter } from 'vue-router';
import eventBus from '@/eventBus';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import IconUpload from '@carbon/icons-vue/es/upload/20';
// import GlobalStore from '../../store/modules/GlobalStore';
import { GlobalStore } from '@/store';
import useDataFormatterGlobal from '../../components/Composables/useDataFormatterGlobal';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import ModalUploadCertificate from './ModalUploadCertificate.vue';

const router = useRouter();
const globalStore = GlobalStore();
const { getValidationState } = useVuelidateComposable();
const Authentication = AuthenticationStore();
const certificatesStore = CertificatesStore();
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
const languages = ref([
  {
    value: 'en-US',
    text: 'English',
  },
  {
    value: 'es',
    text: 'Español',
  },
  {
    value: 'ru-RU',
    text: 'Русский',
  },
]);

const loginPageDetails = computed(() => {
  return Authentication.loginPageDetailsGetter;
});

onBeforeMount(() => {
  startLoader();
  Authentication.dateAndTime().finally(() => {
    endLoader();
    isBusy.value = false;
  });
});

const login = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  Authentication.login(userInfo.username, userInfo.password)
    .then(() => {
      localStorage.setItem('storedLanguage', i18n.locale);
      localStorage.setItem('storedUsername', userInfo.username);
      globalStore.username = userInfo.username;
      globalStore.languagePreference = i18n.locale;
      // router.push('/');
      return Authentication.getUserInfo(userInfo.username);
    })
    .then(({ PasswordChangeRequired, RoleId }) => {
      if (PasswordChangeRequired) {
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
              Authentication.unauthlogin(),
              Authentication.logout(),
            ]);
          });
      }
      if (RoleId) {
        globalStore.userPrivilege = RoleId;
      }
    })
    .catch((error) => console.log(error));
};
function initModalUploadCertificate() {
  eventBus.emit('upload-login-certificate');
}
function onModalOk({ file }) {
  addNewCertificate(file);
}

function addNewCertificate(file) {
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
<style lang="scss" scoped>
.login-form {
  @include media-breakpoint-up('md') {
    max-width: 360px;
  }
}

.form-label {
  margin-top: 2rem;
}
.btn-primary {
  color: #ffffff;
  background-color: #0068b5;
  border-color: #0068b5;
  border-radius: 0;
  padding-top: 10px;
  padding-right: $spacer;
  padding-bottom: 10px;
  padding-left: $spacer;
  &:hover {
    color: #ffffff;
    background-color: #005ca1;
    border-color: #005ca1;
  }
  &:active {
    color: #ffffff;
    background-color: #005ca1;
    border-color: #005ca1;
  }
  &:focus {
    color: #ffffff;
    background-color: #005ca1;
    border-color: #005ca1;
  }
}
</style>
