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
      <b-form novalidate @submit.prevent="changePassword">
        <BFormGroup
          label-for="password"
          :label="$t('pageChangePassword.newPassword')"
        >
          <template #label>
            {{ $t('pageUserManagement.modal.userPassword') }}
            <info-tooltip-password />
          </template>
          <input-password-toggle>
            <BFormInput
              id="password"
              v-model="form.password"
              autocomplete="off"
              autofocus="autofocus"
              type="password"
              :state="getValidationState(v$.form.password)"
              class="form-control-with-button"
              @change="v$.form.password.$touch()"
            >
            </BFormInput>
            <BFormInvalidFeedback role="alert">
              <template v-if="!v$.form.password.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
            </BFormInvalidFeedback>
          </input-password-toggle>
        </BFormGroup>
        <BFormGroup
          label-for="password-confirm"
          :label="$t('pageChangePassword.confirmNewPassword')"
        >
          <input-password-toggle>
            <BFormInput
              id="password-confirm"
              v-model="form.passwordConfirm"
              autocomplete="off"
              type="password"
              :state="getValidationState(v$.form.passwordConfirm)"
              class="form-control-with-button"
              @change="v$.form.passwordConfirm.$touch()"
            >
            </BFormInput>
            <BFormInvalidFeedback role="alert">
              <template v-if="!v$.form.passwordConfirm.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-else-if="!v$.form.passwordConfirm.sameAsPassword">
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

<script>
import { ref, computed} from 'vue'
import { UserManagementStore, GlobalStore, AuthenticationStore } from '@/store';
import { required, sameAs } from '@vuelidate/validators';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import Alert from '@/components/Global/Alert.vue';
import InfoTooltipPassword from '@/components/Global/InfoTooltipPassword.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import { useRouter } from 'vue-router';

const global = GlobalStore();
const userManagementStore = UserManagementStore();
const authenticationStore = AuthenticationStore();

const router = useRouter();
const { getValidationState } = useVuelidateComposable();

const form = ref({
        password: null,
        passwordConfirm: null,
      });
const username = ref(global.usernameGetter);
const changePasswordError = ref(false);

const rules = computed(() => ({
      form: {
        password: { required },
        passwordConfirm: {
          required,
          sameAsPassword: sameAs('password'),
        },
      },
    }));
const v$ = useVuelidate(rules, {form});

const goBack = () => {
      // Remove session created if navigating back to the Login page
      authenticationStore.logout();
    };
const changePassword = () => {
      v$.value.$touch();
      if (v$.value.$invalid) return;
      let data = {
        originalUsername: username.value,
        password: form.value.password,
      };

      userManagementStore.updateUser(data)
        .then(() => {
          Promise.all([
            userManagementStore.getUsers(),
            global.getCurrentUser(username.value),
            global.getSystemInfo(),
          ])
        })
        .then(() => router.push('/'))
        .catch(() => (changePasswordError.value = true));
      };
</script>
<style lang="scss" scoped>
.change-password__form-container {
  @include media-breakpoint-up('md') {
    max-width: 360px;
  }
}
</style>
