<template>
  <BRow>
    <BCol>
      <page-section
        :section-title="$t('pageCapacityOnDemand.activation.sectionTitle')"
      >
        <BRow>
          <BCol xl="5" md="6" lg="6" sm="7">
            <alert variant="info" class="mb-4">
              <span>
                {{ $t('pageCapacityOnDemand.activation.alert') }}
              </span>
            </alert>
          </BCol>
        </BRow>
        <div>
          {{ $t('pageCapacityOnDemand.activation.helperText') }}
          <BLink
            target="_blank"
            href="https://www.ibm.com/servers/eserver/ess"
            >{{ accessKeyLink }}</BLink
          >
        </div>
        <BRow>
          <BCol sm="12" md="9" lg="9" xl="8">
            <BForm
              class="d-flex align-items-center mt-3"
              @submit.prevent="submitForm"
            >
              <BFormGroup
                :label="$t('pageCapacityOnDemand.activation.srLabel')"
                aria-label="form-group-activation"
                label-for="input-license-key"
                :label-sr-only="true"
                class="mb-0 mr-0 form-group-activation"
              >
                <BInputGroup
                  aria-label="input-group-activation"
                  class="input-group-activation"
                >
                  <BFormInput
                    id="input-license-key"
                    v-model="licenseKey"
                    class="input-form"
                    :maxlength="maxLength"
                    :disabled="isActivationDisabled"
                    :state="getValidationState(v$.licenseKey)"
                    :placeholder="
                      $t('pageCapacityOnDemand.activation.placeholder')
                    "
                    @input="v$.licenseKey.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    {{ $t('global.form.invalidCharacterLength') }}
                  </BFormInvalidFeedback>
                </BInputGroup>
              </BFormGroup>
              <BCol align-self="baseline" class="ms-3">
                <BButton
                  variant="primary"
                  type="submit"
                  :disabled="isActivationDisabled"
                >
                  {{ $t('global.action.activate') }}
                </BButton>
              </BCol>
            </BForm>
          </BCol>
        </BRow>
      </page-section>
    </BCol>
  </BRow>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { maxLength, minLength, required } from '@vuelidate/validators';
import Alert from '@/components/Global/Alert.vue';
import PageSection from '@/components/Global/PageSection.vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import { useVuelidate } from '@vuelidate/core';
import stores from '@/store';
import { useCapacityOnDemand } from '@/api/composables/useCapacityOnDemand';

const { getValidationState } = useVuelidateComposable();
const { successToast, errorToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();

const global = stores.GlobalStore();

// Use the new VueQuery composable
const { licenses, activateLicense, isActivating } = useCapacityOnDemand();

const licenseKey = ref('');
const maxLengthVal = ref(34);
const accessKeyLink = ref('www.ibm.com/servers/eserver/ess');

onMounted(() => {
  fetchInfo();
});

const rules = computed(() => ({
  licenseKey: {
    required,
    minLength: minLength(maxLengthVal.value),
    maxLength: maxLength(maxLengthVal.value),
  },
}));
const v$ = useVuelidate(rules, { licenseKey });

const isInPhypStandby = computed(() => {
  return global.isInPhypStandby;
});

const isActivationDisabled = computed(() => {
  if (
    licenses.value?.UAK?.Status?.State === 'Enabled' &&
    isInPhypStandby.value
  ) {
    return false;
  } else {
    return true;
  }
});

const submitForm = async () => {
  v$.value.$touch();
  if (!v$.value.$invalid) {
    startLoader();
    try {
      const success = await activateLicense(licenseKey.value);
      successToast(success);
      fetchInfo();
    } catch (error) {
      errorToast(error.message);
    } finally {
      endLoader();
    }
  }
};

const fetchInfo = () => {
  Promise.all([global.getSystemInfo(), global.getBootProgress()]);
};
</script>

<style lang="scss" scoped>
.input-group-activation {
  // this is needed to maintain button aligment
  // when there is an error message
  height: 3.75rem;
}
.form-group-activation {
  width: 100%;
}
.input-form {
  height: 42px;
}
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
