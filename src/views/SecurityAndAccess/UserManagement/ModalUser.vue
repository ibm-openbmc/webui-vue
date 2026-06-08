<template>
  <BModal
    id="modal-user"
    v-model="modalUser"
    :title="
      newUser
        ? $t('pageUserManagement.addUser')
        : $t('pageUserManagement.editUser')
    "
    :ok-title="
      newUser ? $t('pageUserManagement.addUser') : $t('global.action.save')
    "
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="form-user" novalidate>
      <BContainer>
        <!-- Manual unlock form control -->
        <BRow v-if="!newUser && manualUnlockPolicy && user.Locked">
          <BCol sm="9">
            <alert :show="true" variant="warning" small>
              <template v-if="!v$.form.manualUnlock.$dirty">
                {{ $t('pageUserManagement.modal.accountLocked') }}
              </template>
              <template v-else>
                {{ $t('pageUserManagement.modal.clickSaveToUnlockAccount') }}
              </template>
            </alert>
          </BCol>
          <BCol sm="3">
            <input
              v-model="form.manualUnlock"
              data-test-id="userManagement-input-manualUnlock"
              type="hidden"
              value="false"
            />
            <BButton
              variant="primary"
              :disabled="v$.form.manualUnlock.$dirty"
              data-test-id="userManagement-button-manualUnlock"
              @click="v$.form.manualUnlock.$touch()"
            >
              {{ $t('pageUserManagement.modal.unlock') }}
            </BButton>
          </BCol>
        </BRow>
        <BRow>
          <BCol>
            <BFormGroup
              :label="$t('pageUserManagement.modal.accountStatus')"
              class="radioButtonStyle"
            >
              <BFormRadio
                v-model="form.status"
                name="user-status"
                :value="true"
                data-test-id="userManagement-radioButton-statusEnabled"
                @input="v$.form.status.$touch()"
              >
                {{ $t('global.status.enabled') }}
              </BFormRadio>
              <BFormRadio
                v-model="form.status"
                name="user-status"
                data-test-id="userManagement-radioButton-statusDisabled"
                :value="false"
                @input="v$.form.status.$touch()"
              >
                {{ $t('global.status.disabled') }}
              </BFormRadio>
            </BFormGroup>
            <!-- Todo - replace editDisabled with computed property notService -->
            <BFormGroup
              v-if="editDisabled"
              :label="$t('pageUserManagement.modal.username')"
              aria-label="UserName"
              label-for="username"
            >
              <BFormText id="username-help-block">
                {{ $t('pageUserManagement.modal.cannotStartWithANumber') }}
                <br />
                {{
                  $t(
                    'pageUserManagement.modal.noSpecialCharactersExceptUnderscore',
                  )
                }}
              </BFormText>
              <BFormInput
                id="username"
                v-model="form.username"
                type="text"
                aria-describedby="username-help-block"
                data-test-id="userManagement-input-username"
                :state="getValidationState(v$.form.username)"
                :disabled="!newUser && originalUsername === 'root'"
                @input="v$.form.username.$touch()"
              />
              <BFormInvalidFeedback role="alert">
                <template
                  v-if="
                    v$.form.username.$errors.length > 0
                      ? v$.form.username.$errors[0].$validator === 'required'
                      : false
                  "
                >
                  {{ $t('global.form.fieldRequired') }}
                </template>
                <template
                  v-else-if="
                    v$.form.username.$errors.length > 0
                      ? v$.form.username.$errors[0].$validator === 'maxLength'
                      : false
                  "
                >
                  {{
                    $t('global.form.lengthMustBeBetween', { min: 1, max: 16 })
                  }}
                </template>
                <template
                  v-else-if="
                    v$.form.username.$errors.length > 0
                      ? v$.form.username.$errors[0].$validator === 'pattern'
                      : false
                  "
                >
                  {{ $t('global.form.invalidFormat') }}
                </template>
              </BFormInvalidFeedback>
            </BFormGroup>
            <BFormGroup
              v-show="notService && notReadyOnly"
              :label="$t('pageUserManagement.modal.privilege')"
              label-for="privilege"
            >
              <BFormSelect
                id="privilege"
                v-model="form.privilege"
                :options="privilegeTypes"
                data-test-id="userManagement-select-privilege"
                :state="getValidationState(v$.form.privilege)"
                @change="v$.form.privilege.$touch()"
              >
                <template #first>
                  <BFormSelectOption :value="null" disabled>
                    {{ $t('global.form.selectAnOption') }}
                  </BFormSelectOption>
                </template>
              </BFormSelect>
              <BFormInvalidFeedback role="alert">
                <template
                  v-if="
                    v$.form.privilege.$errors.length > 0
                      ? v$.form.privilege.$errors[0].$validator === 'required'
                      : false
                  "
                >
                  {{ $t('global.form.fieldRequired') }}
                </template>
              </BFormInvalidFeedback>
            </BFormGroup>
          </BCol>
          <BCol>
            <BFormGroup
              v-show="notService"
              :label="$t('pageUserManagement.modal.userPassword')"
              label-for="password"
              aria-label="user-password"
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
                  :type="passwordType"
                  data-test-id="userManagement-input-password"
                  :state="getValidationState(v$.form.password)"
                  class="form-control-with-button"
                  @input="v$.form.password.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                  <template
                    v-if="
                      v$.form.password.$errors.length > 0
                        ? v$.form.password.$errors[0].$validator === 'required'
                        : false
                    "
                  >
                    {{ $t('global.form.fieldRequired') }}
                  </template>
                  <template
                    v-if="
                      v$.form.password.$errors.length > 0
                        ? v$.form.password.$errors[0].$validator ===
                            'minLength' ||
                          v$.form.password.$errors[0].$validator === 'maxLength'
                        : false
                    "
                  >
                    {{
                      $t('pageUserManagement.modal.passwordMustBeBetween', {
                        min: passwordRequirements.minLength,
                        max: passwordRequirements.maxLength,
                      })
                    }}
                  </template>
                </BFormInvalidFeedback>
              </input-password-toggle>
            </BFormGroup>
            <BFormGroup
              v-show="notService"
              :label="$t('pageUserManagement.modal.confirmUserPassword')"
              label-for="password-confirmation"
              aria-label="confirm-user-password"
            >
              <input-password-toggle
                @update-pass-view="updateConfirmPasswordType"
              >
                <BFormInput
                  id="password-confirmation"
                  v-model="form.passwordConfirmation"
                  autocomplete="off"
                  data-test-id="userManagement-input-passwordConfirmation"
                  :type="confirmPasswordType"
                  :state="getValidationState(v$.form.passwordConfirmation)"
                  class="form-control-with-button"
                  @input="v$.form.passwordConfirmation.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                  <template
                    v-if="
                      v$.form.passwordConfirmation.$errors.length > 0
                        ? v$.form.passwordConfirmation.$errors[0].$validator ===
                          'required'
                        : false
                    "
                  >
                    {{ $t('global.form.fieldRequired') }}
                  </template>
                  <template
                    v-else-if="
                      v$.form.passwordConfirmation.$errors.length > 0
                        ? v$.form.passwordConfirmation.$errors[0].$validator ===
                          'sameAsPassword'
                        : false
                    "
                  >
                    {{ $t('pageUserManagement.modal.passwordsDoNotMatch') }}
                  </template>
                </BFormInvalidFeedback>
              </input-password-toggle>
            </BFormGroup>
            <BFormCheckbox
              v-if="(isAdminUser || isServiceUser) && newUser && globalMfaValue"
              v-model="mfaByPass"
            >
              {{ $t('pageUserManagement.table.mfaByPass') }}
            </BFormCheckbox>
          </BCol>
        </BRow>
      </BContainer>
    </BForm>
  </BModal>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import {
  required,
  maxLength,
  minLength,
  sameAs,
  helpers,
  requiredIf,
} from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import InfoTooltipPassword from '@/components/Global/InfoTooltipPassword.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const globalStore = stores.GlobalStore();
const userManagementStore = stores.UserManagementStore();
const uploadCertificate = stores.CertificatesStore();

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  passwordRequirements: {
    type: Object,
    required: true,
  },
});

const modalUser = ref(false);

eventBus.on('modal-user', () => {
  modalUser.value = true;
  nextTick(() => {
    if (props.user) {
      form.value.username = props.user.username;
      form.value.status = props.user.Enabled;
      form.value.privilege =
        props.user.privilege === 'Read only'
          ? 'ReadOnly'
          : props.user.privilege;
    }
  });
});

const originalUsername = ref('');
const mfaByPass = ref(false);
const form = ref({
  status: true,
  username: '',
  privilege: null,
  password: '',
  passwordConfirmation: '',
  manualUnlock: false,
});
const passwordType = ref('password');
const confirmPasswordType = ref('password');

const certificateTypes = computed(() => {
  return uploadCertificate.availableUploadTypesGetter;
});

const globalMfaValue = computed(() => {
  return userManagementStore.isGlobalMfaEnabledGetter;
});
const editDisabled = computed(() => {
  return !props.user?.RoleId;
});
const isAdminUser = computed(() => {
  return globalStore.isAdminUser;
});

const isServiceUser = computed(() => {
  return globalStore.isServiceUser;
});

const newUser = computed(() => {
  return props.user ? false : true;
});
const notService = computed(() => {
  return props.user?.RoleId !== 'OemIBMServiceAgent';
});
const notReadyOnly = computed(() => {
  const cUser = globalStore?.currentUserGetter;
  const RoleId = cUser?.RoleId;
  return RoleId !== 'ReadOnly';
});
const currentUser = computed(() => {
  return globalStore.currentUserGetter;
});
const accountSettings = computed(() => {
  return userManagementStore.accountSettingsGetter;
});
const manualUnlockPolicy = computed(() => {
  return !accountSettings.value.accountLockoutDuration;
});
const privilegeTypes = computed(() => {
  return userManagementStore.accountRolesGetter.filter(
    (privilege) =>
      privilege !== 'OemIBMServiceAgent' &&
      privilege !== 'ServiceAgent' &&
      privilege !== 'Operator',
  );
});

watch(
  () => props.user,
  (value) => {
    if (value === null) return;
    if (value.length) {
      originalUsername.value = value.username;
      form.value.username = value.username;
      form.value.status = value.Enabled;
      form.value.privilege = value.privilege;
    }
  },
);

const rules = computed(() => ({
  form: {
    status: {
      required,
    },
    username: {
      required,
      maxLength: maxLength(16),
      pattern: helpers.regex(/^([a-zA-Z_][a-zA-Z0-9_]*)/),
    },
    privilege: {
      required,
    },
    password: {
      required: requiredIf(function () {
        return requirePassword();
      }),
      minLength: minLength(props.passwordRequirements.minLength),
      maxLength: maxLength(props.passwordRequirements.maxLength),
    },
    passwordConfirmation: {
      required: requiredIf(function () {
        return requirePassword();
      }),
      sameAsPassword: sameAs(form.value.password),
    },
    manualUnlock: {},
  },
}));
const v$ = useVuelidate(rules, { form });

function handleSubmit() {
  let userData = {};

  if (newUser.value) {
    if (!notReadyOnly.value && form.value.privilege === null) {
      form.value.privilege = 'ReadOnly';
    }
    v$.value.$touch();
    if (v$.value.$invalid) return;
    userData.username = form.value.username;
    userData.status = form.value.status;
    userData.privilege = form.value.privilege;
    userData.password = form.value.password;
  } else {
    form.value.username = props.user.username;
    if (v$.value.$invalid) return;
    userData.originalUsername = form.value.username;
    userData.currentUser = currentUser.value;
    if (v$.value.form.status.$dirty) {
      userData.status = form.value.status;
    }
    if (v$.value.form.username.$dirty) {
      userData.username = form.value.username;
    }
    if (v$.value.form.privilege.$dirty) {
      userData.privilege = form.value.privilege;
    }
    if (v$.value.form.password.$dirty) {
      userData.password = form.value.password;
    }
    if (v$.value.form.manualUnlock.$dirty) {
      // If form manualUnlock control $dirty then
      // set user Locked property to false
      userData.locked = false;
    }
    if (Object.entries(userData).length === 1) {
      closeModal();
      return;
    }
  }

  eventBus.emit('okUser', {
    isNewUser: newUser.value,
    userData,
    mfaByPass: mfaByPass.value,
  });
  closeModal();
}
function closeModal() {
  nextTick(() => {
    mfaByPass.value = false;
    modalUser.value = false;
  });
}
function resetForm() {
  form.value.originalUsername = '';
  form.value.status = true;
  form.value.username = '';
  form.value.privilege = null;
  form.value.password = '';
  form.value.passwordConfirmation = '';
  v$.value.$reset();
  eventBus.emit('hidden');
}
function requirePassword() {
  if (newUser.value) return true;
  if (v$.value.form.password.$dirty) return true;
  if (v$.value.form.passwordConfirmation.$dirty) return true;
  return false;
}
function onOk(bvModalEvt) {
  bvModalEvt.preventDefault();
  handleSubmit();
}
function updatePasswordType(type) {
  passwordType.value = type;
}
function updateConfirmPasswordType(type) {
  confirmPasswordType.value = type;
}
</script>

<style lang="scss" scoped>
.radioButtonStyle {
  margin-bottom: 1rem;
}
</style>
