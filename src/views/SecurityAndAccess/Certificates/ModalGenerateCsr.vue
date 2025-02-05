<template>
  <div>
    <BModal
      v-model="modal"
      id="generate-csr"
      size="lg"
      no-stacking
      :title="$t('pageCertificates.modal.generateACertificateSigningRequest')"
      :ok-title="$t('pageCertificates.generateCsr')"
      @ok="onOkGenerateCsrModal"
      @cancel="resetForm"
      @hidden="resetCsr()"
    >
      <BForm id="generate-csr-form" novalidate @submit.prevent>
        <BContainer fluid>
          <BRow>
            <BCol lg="9">
              <BRow>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.certificateType')"
                    label-for="certificate-type"
                  >
                    <BFormSelect
                      id="certificate-type"
                      v-model="form.certificateType"
                      data-test-id="modalGenerateCsr-select-certificateType"
                      :options="certificateOptions"
                      :state="getValidationState(v$.form.certificateType)"
                      @update:model-value="v$.form.certificateType.$touch()"
                    >
                      <template #first>
                        <BFormSelectOption :value="null" disabled>
                          {{ $t('global.form.selectAnOption') }}
                        </BFormSelectOption>
                      </template>
                    </BFormSelect>
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.country')"
                    label-for="country"
                  >
                    <BFormSelect
                      id="country"
                      v-model="form.country"
                      data-test-id="modalGenerateCsr-select-country"
                      :options="countryOptions"
                      :state="getValidationState(v$.form.country)"
                      @update:model-value="v$.form.country.$touch()"
                    >
                      <template #first>
                        <BFormSelectOption :value="null" disabled>
                          {{ $t('global.form.selectAnOption') }}
                        </BFormSelectOption>
                      </template>
                    </BFormSelect>
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.state')"
                    label-for="state"
                  >
                    <BFormInput
                      id="state"
                      v-model="form.state"
                      type="text"
                      data-test-id="modalGenerateCsr-input-state"
                      :state="getValidationState(v$.form.state)"
                    />
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.city')"
                    label-for="city"
                  >
                    <BFormInput
                      id="city"
                      v-model="form.city"
                      type="text"
                      data-test-id="modalGenerateCsr-input-city"
                      :state="getValidationState(v$.form.city)"
                    />
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.companyName')"
                    label-for="company-name"
                  >
                    <BFormInput
                      id="company-name"
                      v-model="form.companyName"
                      type="text"
                      data-test-id="modalGenerateCsr-input-companyName"
                      :state="getValidationState(v$.form.companyName)"
                    />
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.companyUnit')"
                    label-for="company-unit"
                  >
                    <BFormInput
                      id="company-unit"
                      v-model="form.companyUnit"
                      type="text"
                      data-test-id="modalGenerateCsr-input-companyUnit"
                      :state="getValidationState(v$.form.companyUnit)"
                    />
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="6">
                  <BFormGroup
                    :label="$t('pageCertificates.modal.commonName')"
                    label-for="common-name"
                  >
                    <BFormInput
                      id="common-name"
                      v-model="form.commonName"
                      type="text"
                      data-test-id="modalGenerateCsr-input-commonName"
                      :state="getValidationState(v$.form.commonName)"
                    />
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
                <BCol lg="6">
                  <BFormGroup label-for="contact-person">
                    <template #label>
                      {{ $t('pageCertificates.modal.contactPerson') }} -
                      <span class="form-text d-inline">
                        {{ $t('global.form.optional') }}
                      </span>
                    </template>
                    <BFormInput
                      id="contact-person"
                      v-model="form.contactPerson"
                      type="text"
                      data-test-id="modalGenerateCsr-input-contactPerson"
                    />
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="6">
                  <BFormGroup label-for="email-address">
                    <template #label>
                      {{ $t('pageCertificates.modal.emailAddress') }} -
                      <span class="form-text d-inline">
                        {{ $t('global.form.optional') }}
                      </span>
                    </template>
                    <BFormInput
                      id="email-address"
                      v-model="form.emailAddress"
                      type="text"
                      data-test-id="modalGenerateCsr-input-emailAddress"
                    />
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="12">
                  <BFormGroup label-for="alternate-name">
                    <template #label>
                      {{ $t('pageCertificates.modal.alternateName') }} -
                      <span class="form-text d-inline">
                        {{ $t('global.form.optional') }}
                      </span>
                    </template>
                    <BFormText id="alternate-name-help-block">
                      {{ $t('pageCertificates.modal.alternateNameHelperText') }}
                    </BFormText>
                    <BFormTags
                      v-model="form.alternateName"
                      :remove-on-delete="true"
                      :tag-pills="true"
                      input-id="alternate-name"
                      size="lg"
                      separator=" "
                      :input-attrs="{
                        'aria-describedby': 'alternate-name-help-block',
                      }"
                      :duplicate-tag-text="
                        $t('pageCertificates.modal.duplicateAlternateName')
                      "
                      placeholder=""
                      data-test-id="modalGenerateCsr-input-alternateName"
                      add-button-variant="link-primary"
                    >
                      <template #add-button-text>
                        <icon-add /> {{ $t('global.action.add') }}
                      </template>
                    </BFormTags>
                  </BFormGroup>
                </BCol>
              </BRow>
            </BCol>
            <BCol lg="3">
              <BRow>
                <BCol lg="12">
                  <p class="col-form-label">
                    {{ $t('pageCertificates.modal.privateKey') }}
                  </p>
                  <BFormGroup
                    :label="$t('pageCertificates.modal.keyPairAlgorithm')"
                    label-for="key-pair-algorithm"
                  >
                    <BFormSelect
                      id="key-pair-algorithm"
                      v-model="form.keyPairAlgorithm"
                      data-test-id="modalGenerateCsr-select-keyPairAlgorithm"
                      :options="keyPairAlgorithmOptions"
                      :state="getValidationState(v$.form.keyPairAlgorithm)"
                      @update:model-value="v$.form.keyPairAlgorithm.$touch()"
                    >
                      <template #first>
                        <BFormSelectOption :value="null" disabled>
                          {{ $t('global.form.selectAnOption') }}
                        </BFormSelectOption>
                      </template>
                    </BFormSelect>
                    <BFormInvalidFeedback role="alert">
                      {{ $t('global.form.fieldRequired') }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
              </BRow>
              <BRow>
                <BCol lg="12">
                  <template v-if="v$.form.keyPairAlgorithm.$model === 'EC'">
                    <BFormGroup
                      :label="$t('pageCertificates.modal.keyCurveId')"
                      label-for="key-curve-id"
                    >
                      <BFormSelect
                        id="key-curve-id"
                        v-model="form.keyCurveId"
                        data-test-id="modalGenerateCsr-select-keyCurveId"
                        :options="keyCurveIdOptions"
                        :state="getValidationState(v$.form.keyCurveId)"
                        @update:model-value="v$.form.keyCurveId.$touch()"
                      >
                        <template #first>
                          <BFormSelectOption :value="null" disabled>
                            {{ $t('global.form.selectAnOption') }}
                          </BFormSelectOption>
                        </template>
                      </BFormSelect>
                      <BFormInvalidFeedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </BFormInvalidFeedback>
                    </BFormGroup>
                  </template>
                  <template v-if="v$.form.keyPairAlgorithm.$model === 'RSA'">
                    <BFormGroup
                      :label="$t('pageCertificates.modal.keyBitLength')"
                      label-for="key-bit-length"
                    >
                      <BFormSelect
                        id="key-bit-length"
                        v-model="form.keyBitLength"
                        data-test-id="modalGenerateCsr-select-keyBitLength"
                        :options="keyBitLengthOptions"
                        :state="getValidationState(v$.form.keyBitLength)"
                        @update:model-value="v$.form.keyBitLength.$touch()"
                      >
                        <template #first>
                          <BFormSelectOption :value="null" disabled>
                            {{ $t('global.form.selectAnOption') }}
                          </BFormSelectOption>
                        </template>
                      </BFormSelect>
                      <BFormInvalidFeedback role="alert">
                        {{ $t('global.form.fieldRequired') }}
                      </BFormInvalidFeedback>
                    </BFormGroup>
                  </template>
                </BCol>
              </BRow>
            </BCol>
          </BRow>
        </BContainer>
      </BForm>
      <template #modal-footer>
        <BButton variant="secondary">
          {{ $t('global.action.cancel') }}
        </BButton>
        <BButton
          form="generate-csr-form"
          type="submit"
          variant="primary"
          data-test-id="modalGenerateCsr-button-ok"
        >
          {{ $t('pageCertificates.generateCsr') }}
        </BButton>
      </template>
    </BModal>
    <BModal
      v-model="openCsrModal"
      id="csr-string"
      no-stacking
      size="lg"
      @cancel="copyCsrString"
      :cancel-title="
        csrStringCopied ? $t('global.status.copied') : $t('global.action.copy')
      "
      @ok="downloadCsr"
      :ok-title="$t('global.action.download')"
      :title="$t('pageCertificates.modal.certificateSigningRequest')"
      @hidden="onHiddenCsrStringModal"
    >
      <span class="span-csr-string">{{ csrString }}</span>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';

import { required, requiredIf } from '@vuelidate/validators';
import { CertificatesStore } from '@/store';

import IconAdd from '@carbon/icons-vue/es/add--alt/20';

import useToast from '@/components/Composables/useToastComposable';
import { COUNTRY_LIST } from './CsrCountryCodes';
import { CERTIFICATE_TYPES } from '@/store/modules/SecurityAndAccess/CertificatesStore';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import eventBus from '@/eventBus';

const { errorToast } = useToast();

const { getValidationState } = useVuelidateComposable();
const openCsrModal = ref(false);
const uploadCertificate = CertificatesStore();
const initialFormState = {
  certificateType: null,
  country: null,
  state: null,
  city: null,
  companyName: null,
  companyUnit: null,
  commonName: null,
  contactPerson: null,
  emailAddress: null,
  alternateName: [],
  keyPairAlgorithm: null,
  keyCurveId: null,
  keyBitLength: null,
};
const form = ref({ ...initialFormState });
const certificateOptions = CERTIFICATE_TYPES.reduce((arr, cert) => {
  if (
    cert.type === 'TrustStore Certificate' ||
    cert.type === 'ServiceLogin Certificate'
  )
    return arr;
  arr.push({
    text: cert.label,
    value: cert.type,
  });
  return arr;
}, []);
const countryOptions = COUNTRY_LIST.map((country) => ({
  text: country.label,
  value: country.code,
}));
const keyPairAlgorithmOptions = ['EC', 'RSA'];
const keyCurveIdOptions = ['prime256v1', 'secp521r1', 'secp384r1'];
const keyBitLengthOptions = ['2048'];
const csrString = ref('');
const csrStringCopied = ref(false);

const rules = computed(() => ({
  form: {
    certificateType: { required },
    country: { required },
    state: { required },
    city: { required },
    companyName: { required },
    companyUnit: { required },
    commonName: { required },
    contactPerson: {},
    emailAddress: {},
    alternateName: {},
    keyPairAlgorithm: { required },
    keyCurveId: {
      requiredIf: requiredIf(function () {
        return form.keyPairAlgorithm === 'EC';
      }),
    },
    keyBitLength: {
      requiredIf: requiredIf(function () {
        return form.keyPairAlgorithm === 'RSA';
      }),
    },
  },
}));
const v$ = useVuelidate(rules, { form });
const modal = ref(false);

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  uploadCertificate
    .generateCsr(form.value)
    .then(({ data: { CSRString } }) => {
      csrString.value = CSRString;
      modal.value = false;
      openCsrModal.value = true;
      v$.value.form.$reset();
    })
    .catch(({ message }) => errorToast(message));
};

const resetCsr = () => {
  // Reset validation
  if (v$.value) {
    v$.value.$reset();
  }

  // Reset the form to its initial state
  Object.assign(form.value, initialFormState);
};

const resetForm = () => {
  for (let key of Object.keys(form.value)) {
    if (key === 'alternateName') {
      form[key] = [];
    } else {
      form[key] = null;
    }
  }
  Object.assign(form.value, initialFormState);
};
const onOkGenerateCsrModal = (event) => {
  // prevent modal close
  event.preventDefault();
  handleSubmit();
};
const onHiddenCsrStringModal = () => {
  csrString.value = '';
  resetCsr();
};
const copyCsrString = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  navigator.clipboard.writeText(csrString.value).then(() => {
    // Show copied text for 5 seconds
    csrStringCopied.value = true;
    setTimeout(() => {
      csrStringCopied.value = false;
    }, 5000 /*5 seconds*/);
  });
};

const downloadCsr = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(csrString.value)}`;
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = 'certificate-signing-request.txt'; // Specify the file name
  document.body.appendChild(link);
  link.click(); // Trigger the download
  document.body.removeChild(link); // Clean up
};
</script>

<style scoped>
.span-csr-string {
  white-space: pre;
}

.b-form-tags :deep(ul li .d-flex) {
  margin-bottom: 0px;
}

:deep(.btn-close) {
  top: 0px;
  font-size: 100% !important;
  --bs-btn-close-bg: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%232d60e5'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e");
}
</style>
