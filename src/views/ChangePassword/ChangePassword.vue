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
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import stores from '@/store';
import { required, sameAs } from '@vuelidate/validators';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import Alert from '@/components/Global/Alert.vue';
import InfoTooltipPassword from '@/components/Global/InfoTooltipPassword.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import { useRouter } from 'vue-router';

const global = stores.GlobalStore();
const userManagementStore = stores.UserManagementStore();
const authenticationStore = stores.AuthenticationStore();

const router = useRouter();
const { getValidationState } = useVuelidateComposable();

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
    password: { required },
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
      ]);
      v$.value.$reset();
    })
    .then(() => router.push('/'))
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
