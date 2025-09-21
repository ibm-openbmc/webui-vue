<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.ldap')"
      :description="$t('pageLdap.pageDescription')"
    />
    <page-section :section-title="$t('pageLdap.settings')">
      <b-form novalidate @submit.prevent="handleSubmit">
        <b-row>
          <b-col>
            <b-form-group
              class="mb-3"
              :label="$t('pageLdap.form.ldapAuthentication')"
              :disabled="loading"
            >
              <b-form-checkbox
                v-model="formLdap.ldapAuthenticationEnabled"
                data-test-id="ldap-checkbox-ldapAuthenticationEnabled"
                @change="onChangeldapAuthenticationEnabled"
              >
                {{ $t('global.action.enable') }}
              </b-form-checkbox>
            </b-form-group>
          </b-col>
        </b-row>
        <div class="form-background p-3">
          <b-form-group
            class="m-0"
            :label="$t('pageLdap.ariaLabel.ldapSettings')"
            label-class="sr-only"
            :disabled="!formLdap.ldapAuthenticationEnabled || loading"
          >
            <b-row>
              <b-col md="3" lg="4" xl="3">
                <b-form-group
                  class="mb-4"
                  :label="$t('pageLdap.form.secureLdapUsingSsl')"
                >
                  <b-form-text id="enable-secure-help-block">
                    {{ $t('pageLdap.form.secureLdapHelper') }}
                  </b-form-text>
                  <b-form-checkbox
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
                  </b-form-checkbox>
                </b-form-group>
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
                  <b-link
                    class="d-inline-block mb-4 m-md-0"
                    to="/security-and-access/certificates"
                  >
                    {{ $t('pageLdap.form.manageSslCertificates') }}
                  </b-link>
                </span>
              </b-col>
              <b-col md="9" lg="8" xl="9">
                <b-row>
                  <b-col>
                    <b-form-group :label="$t('pageLdap.form.serviceType')">
                      <b-form-radio
                        v-model="formLdap.activeDirectoryEnabled"
                        data-test-id="ldap-radio-activeDirectoryEnabled"
                        :value="false"
                        @change="onChangeServiceType"
                      >
                        {{ $t('pageLdap.form.openLDAP') }}
                      </b-form-radio>
                      <b-form-radio
                        v-model="formLdap.activeDirectoryEnabled"
                        data-test-id="ldap-radio-activeDirectoryEnabled"
                        :value="true"
                        @change="onChangeServiceType"
                      >
                        {{ $t('pageLdap.form.activeDirectory') }}
                      </b-form-radio>
                    </b-form-group>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col sm="6" xl="4">
                    <b-form-group label-for="server-uri">
                      <template #label>
                        {{ $t('pageLdap.form.serverUri') }}
                        <info-tooltip
                          :title="$t('pageLdap.form.serverUriTooltip')"
                        />
                      </template>
                      <b-input-group :prepend="ldapProtocol">
                        <b-form-input
                          id="server-uri"
                          v-model="formLdap.serverUri"
                          data-test-id="ldap-input-serverUri"
                          :state="getValidationState(v$.formLdap.serverUri)"
                          @change="v$.formLdap.serverUri.$touch()"
                        />
                        <b-form-invalid-feedback role="alert">
                          {{ $t('global.form.fieldRequired') }}
                        </b-form-invalid-feedback>
                      </b-input-group>
                    </b-form-group>
                  </b-col>
                  <b-col sm="6" xl="4">
                    <b-form-group
                      :label="$t('pageLdap.form.bindDn')"
                      label-for="bind-dn"
                    >
                      <b-form-input
                        id="bind-dn"
                        v-model="formLdap.bindDn"
                        data-test-id="ldap-input-bindDn"
                        :state="getValidationState(v$.formLdap.bindDn)"
                        @change="v$.formLdap.bindDn.$touch()"
                      />
                      <b-form-invalid-feedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </b-col>
                  <b-col sm="6" xl="4">
                    <b-form-group
                      :label="$t('pageLdap.form.bindPassword')"
                      label-for="bind-password"
                    >
                      <input-password-toggle
                        data-test-id="ldap-input-togglePassword"
                        @updatePassView="updateInputType"
                      >
                        <b-form-input
                          id="bind-password"
                          v-model="formLdap.bindPassword"
                          autocomplete="off"
                          :type="inputType"
                          :state="getValidationState(v$.formLdap.bindPassword)"
                          class="form-control-with-button"
                          @change="v$.formLdap.bindPassword.$touch()"
                        />
                        <b-form-invalid-feedback role="alert">
                          {{ $t('global.form.fieldRequired') }}
                        </b-form-invalid-feedback>
                      </input-password-toggle>
                    </b-form-group>
                  </b-col>
                  <b-col sm="6" xl="4">
                    <b-form-group
                      :label="$t('pageLdap.form.baseDn')"
                      label-for="base-dn"
                    >
                      <b-form-input
                        id="base-dn"
                        v-model="formLdap.baseDn"
                        data-test-id="ldap-input-baseDn"
                        :state="getValidationState(v$.formLdap.baseDn)"
                        @change="v$.formLdap.baseDn.$touch()"
                      />
                      <b-form-invalid-feedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </b-form-invalid-feedback>
                    </b-form-group>
                  </b-col>
                  <b-col sm="6" xl="4">
                    <b-form-group label-for="user-id-attribute">
                      <template #label>
                        {{ $t('pageLdap.form.userIdAttribute') }} -
                        <span class="form-text d-inline">
                          {{ $t('global.form.optional') }}
                        </span>
                      </template>
                      <b-form-input
                        id="user-id-attribute"
                        v-model="formLdap.userIdAttribute"
                        data-test-id="ldap-input-userIdAttribute"
                        @change="v$.formLdap.userIdAttribute.$touch()"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col sm="6" xl="4">
                    <b-form-group label-for="group-id-attribute">
                      <template #label>
                        {{ $t('pageLdap.form.groupIdAttribute') }} -
                        <span class="form-text d-inline">
                          {{ $t('global.form.optional') }}
                        </span>
                      </template>
                      <b-form-input
                        id="group-id-attribute"
                        v-model="formLdap.groupIdAttribute"
                        data-test-id="ldap-input-groupIdAttribute"
                        @change="v$.formLdap.groupIdAttribute.$touch()"
                      />
                    </b-form-group>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>
          </b-form-group>
        </div>
        <b-row class="mt-4 mb-5">
          <b-col>
            <b-button
              variant="primary"
              type="submit"
              data-test-id="ldap-button-saveSettings"
              :disabled="loading"
            >
              {{ $t('global.action.save') }}
            </b-button>
          </b-col>
        </b-row>
      </b-form>
    </page-section>

    <!-- Role groups -->
    <page-section :section-title="$t('pageLdap.roleGroups')">
      <table-role-groups />
    </page-section>
  </b-container>
</template>

<script setup>
import { find } from 'lodash';
import { requiredIf } from '@vuelidate/validators';
import IconView from '@carbon/icons-vue/es/view/20';
import IconViewOff from '@carbon/icons-vue/es/view--off/20';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import TableRoleGroups from './TableRoleGroups.vue';
import stores from '../../../store';
import { onBeforeMount, reactive } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '../../../components/Composables/useLoadingBarComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import useToast from '@/components/Composables/useToastComposable';

const { t } = useI18n();
const isPasswordVisible = ref(false);
const inputType = ref('password');
const ldapStore = stores.LdapStore();
const certificatesStore = stores.CertificatesStore();
const { getValidationState } = useVuelidateComposable();
const { hideLoader, startLoader, endLoader, loading } = useLoadingBar();
const { successToast, errorToast } = useToast();

onBeforeRouteLeave(() => {
  hideLoader();
});

const initialFormState = {
  ldapAuthenticationEnabled: ldapStore.isServiceEnabledGetter,
  secureLdapEnabled: false,
  activeDirectoryEnabled: ldapStore.isActiveDirectoryEnabledGetter,
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
      requiredIf: requiredIf(function () {
        return formLdap.ldapAuthenticationEnabled;
      }),
    },
    serverUri: {
      requiredIf: requiredIf(function () {
        return formLdap.ldapAuthenticationEnabled;
      }),
    },
    bindDn: {
      requiredIf: requiredIf(function () {
        return formLdap.ldapAuthenticationEnabled;
      }),
    },
    bindPassword: {
      requiredIf: requiredIf(function () {
        return formLdap.ldapAuthenticationEnabled;
      }),
    },
    baseDn: {
      requiredIf: requiredIf(function () {
        return formLdap.ldapAuthenticationEnabled;
      }),
    },
    userIdAttribute: {},
    groupIdAttribute: {},
  },
}));
const v$ = useVuelidate(rules, { formLdap });

const isServiceEnabled = computed(() => {
  return ldapStore.isServiceEnabledGetter;
});
const isActiveDirectoryEnabled = computed(() => {
  return ldapStore.isActiveDirectoryEnabledGetter;
});
const ldap = computed(() => {
  return ldapStore.ldapGetter;
});
const activeDirectory = computed(() => {
  return ldapStore.activeDirectoryGetter;
});

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

onBeforeMount(() => {
  startLoader();
  ldapStore.getAccountSettings().finally(() => endLoader());
  certificatesStore.getCertificates().finally(() => endLoader());
  setFormValues();
});

function setFormValues(serviceType) {
  if (!serviceType) {
    serviceType = isActiveDirectoryEnabled.value
      ? activeDirectory.value
      : ldap.value;
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
  ldapStore
    .saveAccountSettings(data)
    .then((success) => {
      successToast(success);
    })
    .catch(({ message }) => {
      errorToast(message);
    })
    .finally(() => {
      formLdap.bindPassword = '';
      v$.value.formLdap.$reset();
      endLoader();
    });
}
function onChangeServiceType(event) {
  v$.value.formLdap.activeDirectoryEnabled.$touch();
  const isActiveDirectoryEnabled = event.target.value;
  const serviceType =
    isActiveDirectoryEnabled === 'true' ? activeDirectory.value : ldap.value;
  // Set form values according to user selected
  // service type
  setFormValues(serviceType);
}
function onChangeldapAuthenticationEnabled(event) {
  const isServiceEnabled = event.target.value;
  v$.value.formLdap.ldapAuthenticationEnabled.$touch();
  if (!isServiceEnabled.value) {
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
  ::v-deep a {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
