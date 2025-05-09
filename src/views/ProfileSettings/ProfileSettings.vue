<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.profileSettings')" />

    <BRow>
      <BCol md="8" lg="8" xl="6">
        <page-section
          :section-title="$t('pageProfileSettings.profileInfoTitle')"
        >
          <dl>
            <dt>{{ $t('pageProfileSettings.username') }}</dt>
            <dd>
              {{ username }}
            </dd>
          </dl>
        </page-section>
      </BCol>
    </BRow>

    <BForm @submit.prevent="submitForm">
      <BRow>
        <BCol sm="8" md="6" xl="3">
          <page-section
            v-if="!isServiceUser"
            :section-title="$t('pageProfileSettings.changePassword')"
          >
            <BFormGroup
              id="input-group-1"
              :label="$t('pageProfileSettings.newPassword')"
              label-for="input-1"
            >
              <template #label>
                {{ $t('pageUserManagement.modal.userPassword') }}
                <info-tooltip-password />
              </template>
              <BFormText id="password-help-block">
                {{
                  $t('pageUserManagement.modal.passwordMustBeBetween', {
                    min: passwordRequirements.minLength,
                    max: passwordRequirements.maxLength,
                  })
                }}
              </BFormText>
              <input-password-toggle @updatePassView="updatePasswordType">
                <BFormInput
                  id="password"
                  v-model="form.newPassword"
                  autocomplete="off"
                  :type="inputType"
                  aria-describedby="password-help-block"
                  :disabled="isServiceUser"
                  :state="getValidationState(v$.form.newPassword)"
                  data-test-id="profileSettings-input-newPassword"
                  class="form-control-with-button"
                  @input="v$.form.newPassword.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                  <template
                    v-if="
                      v$.form.newPassword.$errors.length > 0 ? (v$.form.newPassword.$errors[0].$validator === 'minLength' || v$.form.newPassword.$errors[0].$validator === 'maxLength') : false
                    ">
                    {{
                      $t('pageProfileSettings.newPassLabelTextInfo', {
                        min: passwordRequirements.minLength,
                        max: passwordRequirements.maxLength,
                      })
                    }}
                  </template>
                </BFormInvalidFeedback>
              </input-password-toggle>
            </BFormGroup>
            <BFormGroup
              id="input-group-2"
              :label="$t('pageProfileSettings.confirmPassword')"
              label-for="input-2"
            >
              <input-password-toggle @updatePassView="updateConfirmPasswordType">
                <BFormInput
                  id="password-confirmation"
                  v-model="form.confirmPassword"
                  autocomplete="off"
                  :type="confirmPasswordType"
                  :disabled="isServiceUser"
                  :state="getValidationState(v$.form.confirmPassword)"
                  data-test-id="profileSettings-input-confirmPassword"
                  class="form-control-with-button"
                  @input="v$.form.confirmPassword.$touch()"
                />
                
                <BFormInvalidFeedback role="alert">
                  <template v-if="v$.form.confirmPassword.$errors.length > 0 ? v$.form.confirmPassword.$errors[0].$validator === 'sameAsPassword' : false">
                    {{ $t('pageProfileSettings.passwordsDoNotMatch') }}
                  </template>
                </BFormInvalidFeedback>
              </input-password-toggle>
            </BFormGroup>
          </page-section>
        </BCol>
      </BRow>
      <page-section :section-title="$t('pageProfileSettings.timezoneDisplay')">
        <p>{{ $t('pageProfileSettings.timezoneDisplayDesc') }}</p>
        <BRow>
          <BCol md="9" lg="8" xl="9">
            <BFormGroup :label="$t('pageProfileSettings.timezone')">
              <BFormRadio
                v-model="form.isUtcDisplay"
                :value="true"
                data-test-id="profileSettings-radio-defaultUTC"
              >
                {{ $t('pageProfileSettings.defaultUTC') }}
              </BFormRadio>
              <BFormRadio
                v-model="form.isUtcDisplay"
                :value="false"
                data-test-id="profileSettings-radio-browserOffset"
              >
                {{
                  $t('pageProfileSettings.browserOffset', {
                    timezone,
                  })
                }}
              </BFormRadio>
            </BFormGroup>
          </BCol>
        </BRow>
      </page-section>
      <BButton
        variant="primary"
        type="submit"
        data-test-id="profileSettings-button-saveSettings"
      >
        {{ $t('global.action.save') }}
      </BButton>
    </BForm>
  </BContainer>
</template>

<script setup>
import i18n from '@/i18n';
import { ref, computed, onBeforeMount } from 'vue';
import useToast from '@/components/Composables/useToastComposable';
import InfoTooltipPassword from '@/components/Global/InfoTooltipPassword.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useLocalTimezoneLabelComposable from '../../components/Composables/useLocalTimezoneLabelComposable';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import { UserManagementStore, GlobalStore } from '@/store';
import {
  minLength,
  maxLength,
  sameAs,
} from '@vuelidate/validators';

const { successToast, errorToast } = useToast();
const { getValidationState } = useVuelidateComposable();
const { startLoader, endLoader } = useLoadingBar();
const { localOffset } = useLocalTimezoneLabelComposable();

const global = GlobalStore();
const userManagementStore = UserManagementStore()

const form = ref({
        newPassword: '',
        confirmPassword: '',
        isUtcDisplay: global.isUtcDisplayGetter,
      });
const inputType = ref('password')
const confirmPasswordType = ref('password')

onBeforeMount(() => {
    startLoader();
    Promise.all([
      userManagementStore.getAccountSettings(),
      checkForUserData(),
    ]).finally(() => {
      endLoader();
    });
  });

const username = computed(() => {
      return global.usernameGetter;
    });
const currentUser = computed(() => {
      return global.currentUserGetter;
    });
const isServiceUser = computed(() => {
      return global.isServiceUser;
    });
const passwordRequirements = computed(() => {
      if (currentUser.value?.AccountTypes?.includes('IPMI')) {
        return {
          minLength: 8,
          maxLength: 20,
        };
      } else {
        return userManagementStore.accountPasswordRequirementsGetter
      }
    });
const timezone = computed(() => {
      return localOffset();
    });

const rules = computed(() => ({
  form: {
        newPassword: {
          minLength: minLength(passwordRequirements.value.minLength),
          maxLength: maxLength(passwordRequirements.value.maxLength),
        },
        confirmPassword: {
          sameAsPassword: sameAs(form.value.newPassword),
        },
      },
    }));
const v$ = useVuelidate(rules, {form});

const checkForUserData = () => {
      if (!currentUser.value) {
        userManagementStore.getUsers();
        global.getCurrentUser();
      }
    };
const saveNewPasswordInputData = () => {
      v$.value.form.confirmPassword.$touch();
      v$.value.form.newPassword.$touch();
      if (v$.value.$invalid) return;
      let userData = {
        originalUsername: username.value,
        password: form.value.newPassword,
      };
      userManagementStore.updateUser(userData)
        .then((message) => {
          (form.value.newPassword = ''), (form.value.confirmPassword = '');
          v$.value.$reset();
          successToast(message);
        })
        .catch(({ message }) => errorToast(message));
    };
const saveTimeZonePrefrenceData = () => {
      localStorage.setItem('storedUtcDisplay', form.value.isUtcDisplay);
      global.setUtcTime(form.value.isUtcDisplay);
      successToast(
        i18n.global.t('pageProfileSettings.toast.successUpdatingTimeZone'),
      );
    };
const submitForm = () => {
      if (form.value.confirmPassword || form.value.newPassword) {
        saveNewPasswordInputData();
      }
      saveTimeZonePrefrenceData();
    };
const updatePasswordType = (passwordType) => {
  inputType.value=passwordType
};
const updateConfirmPasswordType = (passwordType) => {
  confirmPasswordType.value=passwordType
};
</script>
