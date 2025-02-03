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
                label-for="input-license-key"
                :label-sr-only="true"
                class="mb-0 mr-0 form-group-activation"
              >
                <BInputGroup class="input-group-activation">
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
import { LicenseStore, GlobalStore } from '@/store';

const { getValidationState } = useVuelidateComposable();
const { successToast, errorToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();
const global = GlobalStore();
const licenseStore = LicenseStore();

const licenseKey = ref('');
const maxLengthVal = ref(34);
const accessKeyLink = ref('www.ibm.com/servers/eserver/ess');

const rules = computed(() => ({
      licenseKey: {
        required,
        minLength: minLength(maxLengthVal.value),
        maxLength: maxLength(maxLengthVal.value),
      },
    }));
const v$ = useVuelidate(rules, { licenseKey });

const isInPhypStandby = computed(() => {
      return global.isInPhypStandby();
    });
const isActivationDisabled = computed(() => {
      if (
        licenseStore.licensesGetter?.UAK?.Status?.State ===
          'Enabled' &&
        isInPhypStandby
      ) {
        return false;
      } else {
        return true;
      }
    });

onMounted(() => {
    Promise.all([
      global.getSystemInfo(),
      global.getBootProgress(),
      licenseStore.getLicenses(),
    ]);
  });

const submitForm = () => {
      v$.value.$touch();
      if (!v$.value.$invalid) {
        startLoader();
        licenseStore.activateLicense(licenseKey.value)
          .then((success) => successToast(success))
          .catch(({ message }) => errorToast(message))
          .finally(() => endLoader());
      }
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
