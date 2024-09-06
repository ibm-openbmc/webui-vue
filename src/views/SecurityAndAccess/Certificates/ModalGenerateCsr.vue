<template>
  <div>
    <BModal
      id="generate-csr"
      ref="modal"
      size="lg"
      no-stacking
      :title="$t('pageCertificates.modal.generateACertificateSigningRequest')"
      @ok="onOkGenerateCsrModal"
      @cancel="resetForm"
      @hidden="v$.$reset()"
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
      <template #modal-footer="{ ok, cancel }">
        <BButton variant="secondary" @click="cancel()">
          {{ $t('global.action.cancel') }}
        </BButton>
        <BButton
          form="generate-csr-form"
          type="submit"
          variant="primary"
          data-test-id="modalGenerateCsr-button-ok"
          @click="ok()"
        >
          {{ $t('pageCertificates.generateCsr') }}
        </BButton>
      </template>
    </BModal>
    <BModal
      id="csr-string"
      no-stacking
      size="lg"
      :title="$t('pageCertificates.modal.certificateSigningRequest')"
      @hidden="onHiddenCsrStringModal"
    >
      <span class="span-csr-string">{{ csrString }}</span>
      <template #modal-footer>
        <BButton variant="secondary" @click="copyCsrString">
          <template v-if="csrStringCopied">
            <icon-checkmark />
            {{ $t('global.status.copied') }}
          </template>
          <template v-else>
            {{ $t('global.action.copy') }}
          </template>
        </BButton>
        <a
          :href="`data:text/plain;charset=utf-8,${encodeURIComponent(
            csrString,
          )}`"
          download="certificate.txt"
          class="btn btn-primary"
        >
          {{ $t('global.action.download') }}
        </a>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
// import IconAdd from '@carbon/icons-vue/es/add--alt/20';
// import IconCheckmark from '@carbon/icons-vue/es/checkmark/20';

import { required, requiredIf } from '@vuelidate/validators';
import { CertificatesStore } from '@/store';

import { COUNTRY_LIST } from './CsrCountryCodes';
import { CERTIFICATE_TYPES } from '@/store/modules/SecurityAndAccess/CertificatesStore';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import eventBus from '@/eventBus';
// import BVToastMixin from '@/components/Mixins/BVToastMixin';
// import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';

// export default {
//   name: 'ModalGenerateCsr',
//   components: { IconAdd, IconCheckmark },
//   // mixins: [BVToastMixin, VuelidateMixin],
//   data() {
//     return {
const { getValidationState } = useVuelidateComposable();
const uploadCertificate = CertificatesStore();
const form = ref({
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
});
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
const keyBitLengthOptions = [2048];
const csrString = ref('');
const csrStringCopied = ref(false);

//   },
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
      reuired: requiredIf(function (form) {
        return form.keyPairAlgorithm === 'EC';
      }),
    },
    keyBitLength: {
      reuired: requiredIf(function (form) {
        return form.keyPairAlgorithm === 'RSA';
      }),
    },
  },
}));
const v$ = useVuelidate(rules, { form });
const modal = ref(null);
//   methods: {
const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  uploadCertificate.generateCsr(form).then(({ data: { CSRString } }) => {
    csrString.value = CSRString;
    // this.$bvModal.show('csr-string');
    eventBus.on('csr-string', () => {
      modal.value.show();
    });
    v$.$reset();
  });
};
const resetForm = () => {
  for (let key of Object.keys(form)) {
    if (key === 'alternateName') {
      form[key] = [];
    } else {
      form[key] = null;
    }
  }
};
const onOkGenerateCsrModal = (event) => {
  // prevent modal close
  event.preventDefault();
  handleSubmit();
};
const onHiddenCsrStringModal = () => {
  csrString.value = '';
  resetForm();
};
const copyCsrString = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  navigator.clipboard.writeText(this.csrString).then(() => {
    // Show copied text for 5 seconds
    csrStringCopied.value = true;
    setTimeout(() => {
      csrStringCopied.value = false;
    }, 5000 /*5 seconds*/);
  });
};
// },
// };
</script>

<style scoped>
.span-csr-string {
  white-space: pre;
}
</style>
