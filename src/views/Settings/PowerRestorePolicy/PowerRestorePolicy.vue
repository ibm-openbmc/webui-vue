<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.powerRestorePolicy')"
      :description="$t('pagePowerRestorePolicy.description')"
    />
    <BRow>
      <BCol>
        <alert v-if="isOperatingModeManual" variant="warning" class="mb-5">
          <BRow align-v="center">
            <BCol>
              <p class="mb-0">
                {{ $t('pagePowerRestorePolicy.alert.manualOperatingMode') }}
              </p>
            </BCol>
            <BCol>
              <div>
                <router-link to="/operations/server-power-operations">
                  {{ $t('pagePowerRestorePolicy.alert.changeServerOpMode') }}
                </router-link>
              </div>
            </BCol>
          </BRow>
        </alert>
      </BCol>
    </BRow>
    <BRow>
      <BCol sm="8" md="6" xl="12" class="mb-4">
        <BFormGroup :label="$t('pagePowerRestorePolicy.powerPoliciesLabel')">
          <BFormRadioGroup
            v-model="currentPowerRestorePolicy"
            :disabled="isOperatingModeManual"
            role="radio"
            aria-checked="true"
            :options="options"
            name="power-restore-policy"
            stacked
          ></BFormRadioGroup>
        </BFormGroup>
      </BCol>
    </BRow>

    <BButton
      variant="primary"
      :disabled="isOperatingModeManual"
      type="submit"
      @click="submitForm"
    >
      {{ $t('global.action.save') }}
    </BButton>
  </BContainer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import { onBeforeRouteLeave } from 'vue-router';
import Alert from '@/components/Global/Alert.vue';
import i18n from '@/i18n';
import useToastComposable from '@/components/Composables/useToastComposable';
import { usePowerRestorePolicy } from '@/api/composables/usePowerRestorePolicy';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';

const { successToast, errorToast } = useToastComposable();

const {
  powerRestorePolicies,
  powerRestoreCurrentPolicy,
  isLoading,
  isFetching,
  isError,
  setPowerRestorePolicy,
  isOperatingModeManual,
} = usePowerRestorePolicy();

const { startLoader, endLoader } = usePageLoadingBar(isFetching, isError);

const policyValue = ref(null);
const options = ref([]);

// Watch for policies data and update options
watch(
  () => powerRestorePolicies.value,
  (policies) => {
    if (policies && policies.length > 0) {
      options.value = policies.map((item) => ({
        text: i18n.global.t(
          `pagePowerRestorePolicy.policiesDesc.${item.state}`,
        ),
        value: item.state,
      }));
    }
  },
  { immediate: true },
);

const currentPowerRestorePolicy = computed({
  get() {
    return policyValue.value !== null
      ? policyValue.value
      : powerRestoreCurrentPolicy.value;
  },
  set(policy) {
    policyValue.value = policy;
  },
});

const submitForm = async () => {
  startLoader();
  try {
    await setPowerRestorePolicy(
      policyValue.value || currentPowerRestorePolicy.value,
    );
    successToast(
      i18n.global.t('pagePowerRestorePolicy.toast.successSaveSettings'),
    );
  } catch (error) {
    // Reset the radio button to the original value on error
    policyValue.value = null;
    errorToast(error.message);
  } finally {
    endLoader();
  }
};
</script>
