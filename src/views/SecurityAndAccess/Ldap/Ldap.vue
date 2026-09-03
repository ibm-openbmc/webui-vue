<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.ldap')"
      :description="$t('pageLdap.pageDescription')"
    />
    <page-section :section-title="$t('pageLdap.settings')">
      <BForm novalidate @submit.prevent="handleSubmit">
        <BRow>
          <BCol>
            <BFormGroup
              class="mb-3"
              :label="$t('pageLdap.form.ldapAuthentication')"
              :disabled="isBusy"
            >
              <BFormCheckbox
                v-model="formLdap.ldapAuthenticationEnabled"
                data-test-id="ldap-checkbox-ldapAuthenticationEnabled"
                @change="onChangeldapAuthenticationEnabled"
              >
                {{ $t('global.action.enable') }}
              </BFormCheckbox>
            </BFormGroup>
          </BCol>
        </BRow>
        <div class="form-background p-3">
          <BFormGroup
            class="m-0"
            :label="$t('pageLdap.ariaLabel.ldapSettings')"
            label-class="sr-only"
            :disabled="!formLdap.ldapAuthenticationEnabled || isBusy"
          >
            <BRow>
              <BCol md="3" lg="4" xl="3">
                <BFormGroup
                  class="mb-4"
                  :label="$t('pageLdap.form.secureLdapUsingSsl')"
                >
                  <BFormText id="enable-secure-help-block">
                    {{ $t('pageLdap.form.secureLdapHelper') }}
                  </BFormText>
                  <BFormCheckbox
                    id="enable-secure-ldap"
                    v-model="formLdap.secureLdapEnabled"
                    aria-describedby="enable-secure-help-block"
                    data-test-id="ldap-checkbox-secureLdapEnabled"
                    :disabled="
                      !caCertificateExpiration || !ldapCertificateExpiration
                    "
                    @change="v$.formLdap.secureLdapEnabled.$touch()"
                  >
                    {{ $t('global.action.enable') }}
                  </BFormCheckbox>
                </BFormGroup>
                <dl>
                  <dt>{{ $t('pageLdap.form.caCertificateValidUntil') }}</dt>
                  <dd v-if="caCertificateExpiration">
                    {{ $filters.formatDate(caCertificateExpiration) }}
                  </dd>
                  <dd v-else>--</dd>
                  <dt>{{ $t('pageLdap.form.ldapCertificateValidUntil') }}</dt>
                  <dd v-if="ldapCertificateExpiration">
                    {{ $filters.formatDate(ldapCertificateExpiration) }}
                  </dd>
                  <dd v-else>--</dd>
                </dl>
                <span class="no-underline-link">
                  <RouterLink
                    class="d-inline-block mb-4 m-md-0"
                    to="/security-and-access/certificates"
                  >
                    {{ $t('pageLdap.form.manageSslCertificates') }}
                  </RouterLink>
                </span>
              </BCol>
              <BCol md="9" lg="8" xl="9">
                <BRow>
                  <BCol>
                    <BFormGroup :label="$t('pageLdap.form.serviceType')">
                      <BFormRadio
                        v-model="formLdap.activeDirectoryEnabled"
                        data-test-id="ldap-radio-activeDirectoryEnabled"
                        :value="false"
                        @change="onChangeServiceType"
                      >
                        {{ $t('pageLdap.form.openLDAP') }}
                      </BFormRadio>
                      <BFormRadio
                        v-model="formLdap.activeDirectoryEnabled"
                        data-test-id="ldap-radio-activeDirectoryEnabled"
                        :value="true"
                        @change="onChangeServiceType"
                      >
                        {{ $t('pageLdap.form.activeDirectory') }}
                      </BFormRadio>
                    </BFormGroup>
                  </BCol>
                </BRow>
                <BRow>
                  <BCol sm="6" xl="4">
                    <BFormGroup label-for="server-uri">
                      <template #label>
                        {{ $t('pageLdap.form.serverUri') }}
                        <info-tooltip
                          :title="$t('pageLdap.form.serverUriTooltip')"
                        />
                      </template>
                      <BInputGroup :prepend="ldapProtocol">
                        <BFormInput
                          id="server-uri"
                          v-model="formLdap.serverUri"
                          data-test-id="ldap-input-serverUri"
                          :state="getValidationState(v$.formLdap.serverUri)"
                          @change="v$.formLdap.serverUri.$touch()"
                        />
                        <BFormInvalidFeedback role="alert">
                          {{ $t('global.form.fieldRequired') }}
                        </BFormInvalidFeedback>
                      </BInputGroup>
                    </BFormGroup>
                  </BCol>
                  <BCol sm="6" xl="4">
                    <BFormGroup
                      :label="$t('pageLdap.form.bindDn')"
                      label-for="bind-dn"
                    >
                      <BFormInput
                        id="bind-dn"
                        v-model="formLdap.bindDn"
                        data-test-id="ldap-input-bindDn"
                        :state="getValidationState(v$.formLdap.bindDn)"
                        @change="v$.formLdap.bindDn.$touch()"
                      />
                      <BFormInvalidFeedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </BFormInvalidFeedback>
                    </BFormGroup>
                  </BCol>
                  <BCol sm="6" xl="4">
                    <BFormGroup
                      :label="$t('pageLdap.form.bindPassword')"
                      label-for="bind-password"
                    >
                      <input-password-toggle
                        data-test-id="ldap-input-togglePassword"
                        @update-pass-view="updateInputType"
                      >
                        <BFormInput
                          id="bind-password"
                          v-model="formLdap.bindPassword"
                          autocomplete="off"
                          :type="inputType"
                          :state="getValidationState(v$.formLdap.bindPassword)"
                          class="form-control-with-button"
                          @change="v$.formLdap.bindPassword.$touch()"
                        />
                        <BFormInvalidFeedback role="alert">
                          {{ $t('global.form.fieldRequired') }}
                        </BFormInvalidFeedback>
                      </input-password-toggle>
                    </BFormGroup>
                  </BCol>
                  <BCol sm="6" xl="4">
                    <BFormGroup
                      :label="$t('pageLdap.form.baseDn')"
                      label-for="base-dn"
                    >
                      <BFormInput
                        id="base-dn"
                        v-model="formLdap.baseDn"
                        data-test-id="ldap-input-baseDn"
                        :state="getValidationState(v$.formLdap.baseDn)"
                        @change="v$.formLdap.baseDn.$touch()"
                      />
                      <BFormInvalidFeedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </BFormInvalidFeedback>
                    </BFormGroup>
                  </BCol>
                  <BCol sm="6" xl="4">
                    <BFormGroup label-for="user-id-attribute">
                      <template #label>
                        {{ $t('pageLdap.form.userIdAttribute') }} -
                        <span class="form-text d-inline">
                          {{ $t('global.form.optional') }}
                        </span>
                      </template>
                      <BFormInput
                        id="user-id-attribute"
                        v-model="formLdap.userIdAttribute"
                        data-test-id="ldap-input-userIdAttribute"
                        @change="v$.formLdap.userIdAttribute.$touch()"
                      />
                    </BFormGroup>
                  </BCol>
                  <BCol sm="6" xl="4">
                    <BFormGroup label-for="group-id-attribute">
                      <template #label>
                        {{ $t('pageLdap.form.groupIdAttribute') }} -
                        <span class="form-text d-inline">
                          {{ $t('global.form.optional') }}
                        </span>
                      </template>
                      <BFormInput
                        id="group-id-attribute"
                        v-model="formLdap.groupIdAttribute"
                        data-test-id="ldap-input-groupIdAttribute"
                        @change="v$.formLdap.groupIdAttribute.$touch()"
                      />
                    </BFormGroup>
                  </BCol>
                </BRow>
              </BCol>
            </BRow>
          </BFormGroup>
        </div>
        <BRow class="mt-4 mb-5">
          <BCol>
            <BButton
              variant="primary"
              type="submit"
              data-test-id="ldap-button-saveSettings"
              :disabled="isBusy"
            >
              {{ $t('global.action.save') }}
            </BButton>
          </BCol>
        </BRow>
      </BForm>
    </page-section>

    <!-- Role groups -->
    <page-section :section-title="$t('pageLdap.roleGroups')">
      <table-role-groups />
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount, reactive } from 'vue';
import { requiredIf } from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { find } from 'lodash';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import TableRoleGroups from './TableRoleGroups.vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useLdap } from '@/api/composables/useLdap';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';

const { getValidationState } = useVuelidateComposable();
// Direct loader for mutation (save settings)
const { startLoader, endLoader } = useLoadingBar();

const certificatesStore = stores.CertificatesStore();

const {
  isServiceEnabled,
  isActiveDirectoryEnabled,
  ldapSettings,
  activeDirectorySettings,
  isLoading,
  isFetching,
  loadAccountSettings,
  saveAccountSettings,
} = useLdap();

// 1120-vue3 waited for getAccountSettings() + getCertificates(). Track the
// certificates Vuex call as an extra loading flag and combine with isFetching.
const isExtraLoading = ref(true);
const isPageFetching = computed(() => isFetching.value || isExtraLoading.value);

// Show the loading bar on navigation; ignore background polls
usePageLoadingBar(isPageFetching);

const inputType = ref('password');

onBeforeMount(() => {
  Promise.all([
    loadAccountSettings(),
    certificatesStore.getCertificates(),
  ]).finally(() => {
    isExtraLoading.value = false;
    // Set the ldapAuthenticationEnabled based on the actual service state
    formLdap.ldapAuthenticationEnabled = isServiceEnabled.value;
    setFormValues();
  });
});

const initialFormState = {
  ldapAuthenticationEnabled: false,
  secureLdapEnabled: false,
  activeDirectoryEnabled: false,
  serverUri: '',
  bindDn: '',
  bindPassword: '',
  baseDn: '',
  userIdAttribute: '',
  groupIdAttribute: '',
};

const formLdap = reactive({ ...initialFormState });

const rules = computed(() => ({
  formLdap: {
    ldapAuthenticationEnabled: {},
    secureLdapEnabled: {},
    activeDirectoryEnabled: {
      requiredIf: requiredIf(() => formLdap.ldapAuthenticationEnabled),
    },
    serverUri: {
      requiredIf: requiredIf(() => formLdap.ldapAuthenticationEnabled),
    },
    bindDn: {
      requiredIf: requiredIf(() => formLdap.ldapAuthenticationEnabled),
    },
    bindPassword: {
      requiredIf: requiredIf(() => formLdap.ldapAuthenticationEnabled),
    },
    baseDn: {
      requiredIf: requiredIf(() => formLdap.ldapAuthenticationEnabled),
    },
    userIdAttribute: {},
    groupIdAttribute: {},
  },
}));

const v$ = useVuelidate(rules, { formLdap });

const isBusy = computed(() => isLoading.value);

const sslCertificates = computed(() => {
  return certificatesStore.allCertificatesGetter;
});

const caCertificateExpiration = computed(() => {
  const caCertificate = find(sslCertificates.value, {
    type: 'TrustStore Certificate',
  });
  if (caCertificate === undefined) return null;
  return caCertificate.validUntil;
});

const ldapCertificateExpiration = computed(() => {
  const ldapCertificate = find(sslCertificates.value, {
    type: 'LDAP Certificate',
  });
  if (ldapCertificate === undefined) return null;
  return ldapCertificate.validUntil;
});

const ldapProtocol = computed(() => {
  return formLdap.secureLdapEnabled ? 'ldaps://' : 'ldap://';
});

watch(
  () => isServiceEnabled.value,
  (value) => {
    formLdap.ldapAuthenticationEnabled = value;
  },
);

watch(
  () => isActiveDirectoryEnabled.value,
  (val) => {
    formLdap.activeDirectoryEnabled = val;
    setFormValues();
  },
);

watch(
  () => caCertificateExpiration.value,
  () => {
    setFormValues();
  },
);

watch(
  () => ldapCertificateExpiration.value,
  () => {
    setFormValues();
  },
);

watch(
  () => ldapSettings.value,
  () => {
    if (!isActiveDirectoryEnabled.value) {
      setFormValues();
    }
  },
  { deep: true },
);

watch(
  () => activeDirectorySettings.value,
  () => {
    if (isActiveDirectoryEnabled.value) {
      setFormValues();
    }
  },
  { deep: true },
);

function setFormValues(serviceType) {
  if (!serviceType) {
    serviceType = isActiveDirectoryEnabled.value
      ? activeDirectorySettings.value
      : ldapSettings.value;
  }

  const {
    serviceAddress = '',
    bindDn = '',
    baseDn = '',
    userAttribute = '',
    groupsAttribute = '',
  } = serviceType;

  const secureLdap =
    serviceAddress && serviceAddress.includes('ldaps://') ? true : false;
  const serverUri = serviceAddress
    ? serviceAddress.replace(/ldaps?:\/\//, '')
    : '';

  formLdap.secureLdapEnabled = !formLdap.ldapAuthenticationEnabled
    ? false
    : !caCertificateExpiration.value || !ldapCertificateExpiration.value
      ? false
      : secureLdap;
  formLdap.serverUri = serverUri;
  formLdap.bindDn = bindDn;
  formLdap.bindPassword = '';
  formLdap.baseDn = baseDn;
  formLdap.userIdAttribute = userAttribute;
  formLdap.groupIdAttribute = groupsAttribute;
}

function handleSubmit() {
  v$.value.$touch();
  if (v$.value.$invalid) return;

  const data = {
    serviceEnabled: formLdap.ldapAuthenticationEnabled,
    activeDirectoryEnabled: formLdap.activeDirectoryEnabled,
    serviceAddress: `${ldapProtocol.value}${formLdap.serverUri}`,
    bindDn: formLdap.bindDn,
    bindPassword: formLdap.bindPassword,
    baseDn: formLdap.baseDn,
    userIdAttribute: formLdap.userIdAttribute,
    groupIdAttribute: formLdap.groupIdAttribute,
  };

  startLoader();
  saveAccountSettings(data).finally(() => {
    formLdap.bindPassword = '';
    v$.value.formLdap.$reset();
    endLoader();
  });
}

function onChangeServiceType() {
  v$.value.formLdap.activeDirectoryEnabled.$touch();
  const serviceType = formLdap.activeDirectoryEnabled
    ? activeDirectorySettings.value
    : ldapSettings.value;
  // Set form values according to user selected service type
  setFormValues(serviceType);
}

function onChangeldapAuthenticationEnabled() {
  v$.value.formLdap.ldapAuthenticationEnabled.$touch();
  if (!formLdap.ldapAuthenticationEnabled) {
    // Request will fail if sent with empty values.
    // The frontend only checks for required fields
    // when the service is enabled. This is to prevent
    // an error if a user clears any properties then
    // disables the service.
    setFormValues();
  }
}

function updateInputType(passwordType) {
  inputType.value = passwordType;
}
</script>

<style lang="scss" scoped>
.no-underline-link {
  :deep(a) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
