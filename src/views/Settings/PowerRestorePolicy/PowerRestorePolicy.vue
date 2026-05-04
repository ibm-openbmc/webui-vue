<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.powerRestorePolicy')"
      :description="$t('pagePowerRestorePolicy.description')"
    >
      <template #actions>
        <BButton
          variant="link"
          class="btn-icon-only"
          @click="showHelpModal = true"
        >
          <icon-help />
          <span class="sr-only">{{ $t('global.help.title') }}</span>
        </BButton>
      </template>
    </page-title>
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

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="searchContent"
      @action="handleHelpAction"
    />
  </BContainer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import IconHelp from '@carbon/icons-vue/es/help/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import HelpModal from '@/components/Global/HelpModal.vue';
import { onBeforeRouteLeave } from 'vue-router';
import Alert from '@/components/Global/Alert.vue';
import { searchContent } from './PowerRestorePolicySearchContent.js';
import stores from '@/store';
import i18n from '@/i18n';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';

const Toast = useToastComposable();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

const powerPolicy = stores.PowerPolicyStore();
const bootSettings = stores.BootSettingsStore();

const policyValue = ref(null);
const options = ref([]);
const showHelpModal = ref(false);

const handleHelpAction = (action) => {
  showHelpModal.value = false;
  switch (action) {
    case 'select-always-on':
      currentPowerRestorePolicy.value = 'AlwaysOn';
      break;
    case 'select-always-off':
      currentPowerRestorePolicy.value = 'AlwaysOff';
      break;
    case 'select-last-state':
      currentPowerRestorePolicy.value = 'LastState';
      break;
    default:
      break;
  }
};

onBeforeRouteLeave(() => {
  hideLoader();
});

onMounted(() => {
  startLoader();
  renderPowerRestoreSettings();
});

const powerRestorePolicies = computed(() => {
  return powerPolicy.powerRestorePolicies;
});
const currentPowerRestorePolicy = computed({
  get() {
    return powerPolicy.powerRestoreCurrentPolicy;
  },
  set(policy) {
    policyValue.value = policy;
  },
});
const isOperatingModeManual = computed(() => {
  return (
    !bootSettings.biosAttributes?.pvm_system_operating_mode ||
    bootSettings.biosAttributes?.pvm_system_operating_mode === 'Manual'
  );
});

const renderPowerRestoreSettings = () => {
  Promise.all([
    bootSettings.fetchBiosAttributes(),
    powerPolicy.getPowerRestorePolicies(),
    powerPolicy.getPowerRestoreCurrentPolicy(),
  ]).finally(() => {
    options.value.length = 0;
    (powerRestorePolicies.value.map((item) => {
      options.value.push({
        text: i18n.global.t(
          `pagePowerRestorePolicy.policiesDesc.${item.state}`,
        ),
        value: `${item.state}`,
      });
    }),
      endLoader());
  });
};
const submitForm = () => {
  startLoader();
  powerPolicy
    .setPowerRestorePolicy(policyValue.value || currentPowerRestorePolicy.value)
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message))
    .finally(() => {
      renderPowerRestoreSettings();
    });
};
</script>
