<template>
    <BModal
      v-model="modal"
      id="modal-otp-generate"
      ref="modal"
      size="lg"
      :title="$t('pageLogin.modal.register')"
      title-tag="h2"
      scrollable
      centered
      no-close-on-esc
      hide-header-close
      no-close-on-backdrop
      @ok="okFormSubmit"
      @cancel="resetForm"
      @hidden="resetForm"
    >
    <BRow>
    <BCol>
        <BRow>
        <qrcode-vue
            v-if="qrValue"
            class="qrcode-styling"
            :value="qrValue"
            :size="size"
            level="H"
            render-as="canvas"
        />
        <div v-else class="emptyQrStyle"></div>
        </BRow>
        <BRow>
        <BCol>
            <BButton
            v-b-toggle.collapse-2
            class="m-1 buttonStyle"
            data-test-id="modal-secret-key"
            >
            <icon-chevron />
            {{ $t('pageUserManagement.modal.secretKey') }}</BButton
            >
            <b-collapse id="collapse-2" data-test-id="modal-secret-key-value">
            {{ dataFormatter(secretKey) }}
            </b-collapse>
        </BCol>
        <BButton @click="copySecretKey">
            <template v-if="secretKeyCopied">
            <icon-checkmark title="Copied" />
            </template>
            <template v-else>
            <icon-copy title="Copy Secret key" />
            </template>
        </BButton>
        </BRow>
    </BCol>
    <BCol>
        <BForm
        id="otp-generate-form"
        style="margin-top: 45px"
        novalidate
        @submit.prevent
        >
        <b-container fluid="xl">
            <div class="login-form__section mb-3">
            <alert variant="info" class="mb-4">
                <dt>{{ $t('pageUserManagement.modal.helptext') }}:</dt>
                <dd>
                {{ $t('pageUserManagement.modal.helptextStep1') }}
                </dd>
                <dd>
                {{ $t('pageUserManagement.modal.helptextStep2') }}
                </dd>
            </alert>
            </div>
            <div class="login-form__section mb-3">
            <label>{{ $t('pageUserManagement.modal.otp') }}</label>
            <BFormGroup>
                <BFormInput
                v-model="otpValue"
                :state="getValidationState(v$.otpValue)"
                data-test-id="modal-totp-value"
                @input="v$.otpValue.$touch()"
                />
                <BFormInvalidFeedback role="alert">
                <template v-if="!v$.otpValue.required">
                    {{ $t('global.form.fieldRequired') }}
                </template>
                </BFormInvalidFeedback>
            </BFormGroup>
            </div>
        </b-container>
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
        {{ $t('pageLogin.modal.login') }}
    </BButton>
    </template>
</BModal>
</template>
<script>
import { computed, ref, watch, nextTick } from 'vue';
import { required } from 'vuelidate/lib/validators';
import Alert from '@/components/Global/Alert.vue';
import IconCopy from '@carbon/icons-vue/es/copy/16';
import IconCheckmark from '@carbon/icons-vue/es/checkmark/16';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import useToast from '@/components/Composables/useToastComposable';
import QrcodeVue from 'qrcode.vue';
import { useVuelidate } from '@vuelidate/core';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import eventBus from '@/eventBus';
import { UserManagementStore, GlobalStore, AuthenticationStore } from '@/store';
import { useRouter } from 'vue-router';

const { successToast, errorToast } = useToast();
const { dataFormatter } = useDataFormatterGlobal();

const router = useRouter();

const global = GlobalStore();
const userManagementStore = UserManagementStore();
const authenticationStore = AuthenticationStore();

eventBus.on('otp-generate', () => {
  modal.value = true;
});

const issuer = ref('bmc');
const accountName = ref(localStorage.getItem('storedUsername'));
const otpValue = ref(null)
const secretKeyCopied = ref(false);
const qrValue = ref(null);
const size = ref(350);
const modal = ref(False);

const secretKey = computed(() => {
    userManagementStore.secretKeyInfoGetter;
    });

const rules = computed(() => ({
    otpValue: { required },
}));
const v$ = useVuelidate(rules, { otpValue });

watch(
    () => secretKey.value,
    (value) => {
    if (value === null) {
        qrValue.value = null;
    } else {
        qrValu.value = `otpauth://totp/${issuer.value}:${accountName.value}?secret=${value}&issuer=${issuer.value}`;
    }
    }
);

const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey.value).then(() => {
        // Show copied text for 5 seconds
        secretKeyCopied.value = true;
        setTimeout(() => {
        secretKeyCopied.value = false;
        }, 5000 /*5 seconds*/);
    });
    };
const okFormSubmit = (bvModalEvt) => {
    // prevent modal close
    bvModalEvt.preventDefault();
    handleSubmit();
    };
const resetForm = () => {
    otpValue.value = null;
    v$.value.$reset();
    };
const handleSubmit = () => {
    v$.value.$touch();
    if (v$.value.$invalid) return;
    userManagementStore.verifyRegisterTotp({
        otpValue: otpValue.value,
        })
        .then(() => {
        const username = localStorage.getItem('storedUsername');
        Promise.all([
            global.getCurrentUser(username),
            global.getSystemInfo(),
        ])
            .then(() => {
            closeModal();
            router.push('/');
            })
            .catch(() => {
            closeModal();
            Promise.all([
            authenticationStore.unauthlogin(),
            authenticationStore.logout(),
            ]);
            });
        })
        .catch(({ message }) => errorToast(message));
    };
const closeModal = () => {
    nextTick(() => {
        this.$refs.modal.hide();
    });
    };
</script>
<style lang="scss" scoped>
.qrcode-styling {
margin-left: 15px;
max-width: 350px;
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
    margin-right: 11px;
}
}
.btn.collapsed {
svg {
    transform: rotate(180deg);
}
}
</style>
