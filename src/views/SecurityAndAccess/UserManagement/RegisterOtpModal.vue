<template>
  <BModal
    id="register-otp-modal"
    v-model="modal"
    size="lg"
    :title="$t('pageUserManagement.modal.enableMfa')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
    :ok-title="$t('pageUserManagement.modal.validate')"
    :cancel-title="$t('global.action.cancel')"
    @ok="okFormSubmit"
    @cancel="resetMfa"
    @hidden="resetForm"
  >
    <BRow>
      <BCol>
        <div class="qr-wrapper">
          <qrcode-vue
            v-if="qrValue"
            class="qrcode-styling"
            :value="qrValue"
            :size="size"
            level="H"
            render-as="canvas"
          />
          <div v-else class="emptyQrStyle"></div>
        </div>
        <div class="secret-key-buttons-container">
          <div>
            <BButton
              v-b-toggle.collapse-2
              class="m-1 buttonStyle"
              data-test-id="register-secret-key"
            >
              <icon-chevron />
              {{ $t('pageUserManagement.modal.secretKey') }}</BButton
            >
            <BCollapse id="collapse-2" data-test-id="secret-key-value">
              {{ dataFormatter(secretKey) }}
            </BCollapse>
          </div>
          <BButton class="m-1" @click="copySecretKey">
            <template v-if="secretKeyCopied">
              <icon-checkmark title="Copied" />
            </template>
            <template v-else>
              <icon-copy title="Copy Secret key" />
            </template>
          </BButton>
        </div>
      </BCol>
      <BCol>
        <BForm
          id="otp-generate-form"
          style="margin-top: 45px"
          novalidate
          @submit.prevent
        >
          <BContainer fluid="xl">
            <div class="login-form__section mb-3">
              <alert variant="warning" class="mb-4">
                <dt>
                  {{ $t('pageOverview.bmcTime') }}:
                  {{ $filters.formatDate(bmcTime) }}
                  {{ $filters.formatTime(formatTime) }}
                </dt>
                <span>
                  {{ $t('pageUserManagement.mfaTimeMatch') }}
                  <router-link to="/settings/date-time">
                    {{ $t('appPageTitle.dateTime') }}</router-link
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
              <BFormGroup>
                <BFormInput
                  v-model="otpValue"
                  :state="getValidationState(v$.otpValue)"
                  data-test-id="register-totp-value"
                  @input="v$.otpValue.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                  {{ $t('global.form.fieldRequired') }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </div>
          </BContainer>
        </BForm>
      </BCol>
    </BRow>
    <template #modal-footer="{ ok, cancel }">
      <BButton variant="secondary" size="sm" @click="cancel()">
        {{ $t('pageServerPowerOperations.modal.networkSettings.cancel') }}
      </BButton>
      <BButton
        form="otp-generate-form"
        type="submit"
        variant="primary"
        size="sm"
        @click="ok()"
      >
        {{ $t('pageUserManagement.modal.validate') }}
      </BButton>
    </template>
  </BModal>
</template>
<script setup>
import { required } from '@vuelidate/validators';
import IconCopy from '@carbon/icons-vue/es/copy/16';
import IconCheckmark from '@carbon/icons-vue/es/checkmark/16';
import Alert from '@/components/Global/Alert.vue';
import QrcodeVue from 'qrcode.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import GlobalStore from '../../../store/modules/GlobalStore';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import useDataFormatterGlobal from '../../../components/Composables/useDataFormatterGlobal';
import UserManagementStore from '../../../store/modules/SecurityAndAccess/UserManagementStore';
import AuthenticationStore from '../../../store/modules/Authentication/AuthenticationStore';
import { ref, computed, watch, nextTick } from 'vue';
import useVuelidate from '@vuelidate/core';
import i18n from '@/i18n';
import eventBus from '@/eventBus';

const modal = ref(false);
const issuer = ref('bmc');
const globalStore = GlobalStore();
const userManagementStore = UserManagementStore();
const authenticationStore = AuthenticationStore();
const { dataFormatter } = useDataFormatterGlobal();
const { getValidationState } = useVuelidateComposable();
const accountName = ref(localStorage.getItem('storedUsername'));
const otpValue = ref(null);
const secretKeyCopied = ref(false);
const qrValue = ref(null);
const size = ref(355);

const { errorToast, successToast } = useToast();

const formattedTooltip = computed(() => {
  return (
    i18n.global.t('pageUserManagement.modal.helptext') +
    '</br>' +
    i18n.global.t('pageUserManagement.modal.helptextStep1') +
    '</br>' +
    i18n.global.t('pageUserManagement.modal.helptextStep2EnableMfa')
  );
});

const emit = defineEmits('disable-mfa');

eventBus.on('otp-register-modal', () => {
  modal.value = true;
});

const bmcTime = computed(() => {
  return globalStore.bmcTimeGetter;
});

const currentMfaBypassed = computed(() => {
  return userManagementStore.isCurrentUserMfaBypassedGetter;
});

const isServiceUser = computed(() => {
  return globalStore.isServiceUser;
});

const secretKey = computed(() => {
  return userManagementStore.secretKeyInfoGetter;
});

watch(secretKey, (newValue) => {
  globalStore.getBmcTime();
  if (newValue === null) {
    qrValue.value = null;
  } else {
    qrValue.value = `otpauth://totp/${issuer.value}:${accountName.value}?secret=${newValue}&issuer=${issuer.value}`;
  }
});

const rules = computed(() => ({
  otpValue: modal.value
    ? {
        required,
      }
    : {},
}));

const v$ = useVuelidate(rules, { otpValue });

function copySecretKey() {
  navigator.clipboard.writeText(secretKey.value).then(() => {
    // Show copied text for 5 seconds
    secretKeyCopied.value = true;
    setTimeout(() => {
      secretKeyCopied.value = false;
    }, 5000 /*5 seconds*/);
  });
}

function okFormSubmit(bvModalEvt) {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
}

function resetMfa() {
  emit('disable-mfa');
  otpValue.value = null;
  v$.value.$reset();
}

function resetForm() {
  otpValue.value = null;
  v$.value.$reset();
}

function handleSubmit() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  userManagementStore
    .verifyRegisterTotp({ otpValue: otpValue.value })
    .then(() => {
      userManagementStore
        .updateGlobalMfa({
          globalMfa: true,
        })
        .then((message) => {
          successToast(message);
          closeModal();
          resetForm();
          if (!isServiceUser.value && !currentMfaBypassed.value) {
            authenticationStore.logout();
          }
        })
        .catch(({ message }) => errorToast(message));
    })
    .catch(({ message }) => errorToast(message));
}

function closeModal() {
  nextTick(() => {
    modal.value = false;
  });
}
</script>
<style lang="scss" scoped>
.qrcode-styling {
  margin-left: 15px;
}
.qr-wrapper {
  max-width: none !important;
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

.secret-key-buttons-container {
  display: flex;
  justify-content: space-between;
}
</style>
