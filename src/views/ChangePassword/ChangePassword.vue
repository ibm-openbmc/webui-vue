<template>
  <div class="change-password-container">
    <alert variant="danger" class="mb-4">
      <p v-if="changePasswordError">
        {{ $t('pageChangePassword.changePasswordError') }}
      </p>
      <p v-else>{{ $t('pageChangePassword.changePasswordAlertMessage') }}</p>
    </alert>
    <div class="change-password__form-container">
      <dl>
        <dt>{{ $t('pageChangePassword.username') }}</dt>
        <dd>{{ username }}</dd>
      </dl>
      <b-form novalidate @submit.prevent="changePassword()">
        <BFormGroup
          label-for="password"
          :label="$t('pageChangePassword.newPassword')"
        >
          <template #label>
            {{ $t('pageUserManagement.modal.userPassword') }}
            <info-tooltip-password />
          </template>
          <input-password-toggle @update-pass-view="updatePasswordType">
            <BFormInput
              id="password"
              v-model="form.password"
              autocomplete="off"
              autofocus="autofocus"
              :type="inputType"
              :state="getValidationState(v$.form.password)"
              class="form-control-with-button"
              @input="v$.form.password.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.password.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template
                v-if="
                  v$.form.password.$errors.length > 0
                    ? v$.form.password.$errors[0].$validator === 'minLength'
                    : false
                "
              >
                {{ $t('pageChangePassword.passwordMustContainMin') }}
              </template>
              <template
                v-if="
                  v$.form.password.$errors.length > 0
                    ? v$.form.password.$errors[0].$validator ===
                      'hasTwoCharacterGroups'
                    : false
                "
              >
                {{ $t('global.passwordValidation.passwordMustContain') }}
              </template>
            </BFormInvalidFeedback>
          </input-password-toggle>
        </BFormGroup>
        <BFormGroup
          label-for="password-confirm"
          :label="$t('pageChangePassword.confirmNewPassword')"
        >
          <input-password-toggle @update-pass-view="updateConfirmPasswordType">
            <BFormInput
              id="password-confirm"
              v-model="form.passwordConfirm"
              autocomplete="off"
              :type="confirmPasswordType"
              :state="getValidationState(v$.form.passwordConfirm)"
              class="form-control-with-button"
              @input="v$.form.passwordConfirm.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.passwordConfirm.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template
                v-else-if="
                  v$.form.passwordConfirm.$errors.length > 0
                    ? v$.form.passwordConfirm.$errors[0].$validator ===
                      'sameAsPassword'
                    : false
                "
              >
                {{ $t('global.form.passwordsDoNotMatch') }}
              </template>
            </BFormInvalidFeedback>
          </input-password-toggle>
        </BFormGroup>
        <div class="text-right">
          <b-button type="button" variant="link" @click="goBack">
            {{ $t('pageChangePassword.goBack') }}
          </b-button>
          <b-button type="submit" variant="primary">
            {{ $t('pageChangePassword.changePassword') }}
          </b-button>
        </div>
      </b-form>
      <modal-otp-generate />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import stores from '@/store';
import { required, sameAs, minLength } from '@vuelidate/validators';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import usePasswordValidationComposable from '@/components/Composables/usePasswordValidationComposable';
import { useVuelidate } from '@vuelidate/core';
import Alert from '@/components/Global/Alert.vue';
import InfoTooltipPassword from '@/components/Global/InfoTooltipPassword.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import { useRouter } from 'vue-router';
import ModalOtpGenerate from '../Login/ModalOtpGenerate.vue';
import eventBus from '@/eventBus';

const global = stores.GlobalStore();
const userManagementStore = stores.UserManagementStore();
const authenticationStore = stores.AuthenticationStore();

const router = useRouter();
const { getValidationState } = useVuelidateComposable();
const { hasTwoCharacterGroups } = usePasswordValidationComposable();

const form = ref({
  password: '',
  passwordConfirm: '',
});
const username = ref(global.usernameGetter);
const changePasswordError = ref(false);
const inputType = ref('password');
const confirmPasswordType = ref('password');

const rules = computed(() => ({
  form: {
    password: {
      required,
      minLength: minLength(8),
      hasTwoCharacterGroups,
    },
    passwordConfirm: {
      required,
      sameAsPassword: sameAs(form.value.password),
    },
  },
}));
const v$ = useVuelidate(rules, { form });

const goBack = () => {
  // Remove session created if navigating back to the Login page
  authenticationStore.logout().then(() => {
    router.push('/login');
  });
};
const changePassword = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  let data = {
    originalUsername: username.value,
    password: form.value.password,
  };

  userManagementStore
    .updateUser(data)
    .then(() => {
      Promise.all([
        userManagementStore.getUsers(),
        global.getCurrentUser(username.value),
        global.getSystemInfo(),
      ])
        .then(() => router.push('/'))
        .catch((error) => {
          if (error?.message?.endsWith('otpRequired')) {
            userManagementStore.clearSecretKey().finally(() => {
              userManagementStore.generateSecretKey().then(() => {
                eventBus.emit('otp-generate-modal');
              });
            });
          }
        });
      v$.value.$reset();
    })
    .catch(() => (changePasswordError.value = true));
};
const updatePasswordType = (passwordType) => {
  inputType.value = passwordType;
};
const updateConfirmPasswordType = (passwordType) => {
  confirmPasswordType.value = passwordType;
};
</script>

<style lang="scss" scoped>
.change-password__form-container {
  @include media-breakpoint-up('md') {
    max-width: 360px;
  }
}
</style>
