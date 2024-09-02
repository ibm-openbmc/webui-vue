<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.factoryReset')"
      :description="$t('pageFactoryReset.description')"
    />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <span>
            {{ $t('pageFactoryReset.alert') }}
          </span>
        </alert>
      </BCol>
    </BRow>
    <!-- Reset Form -->
    <BForm id="factory-reset" @submit.prevent="onResetSubmit">
      <BRow>
        <BCol md="8">
          <BFormGroup
            :label="$t('pageFactoryReset.form.resetOptionsLabel')"
            class="mb-4"
          >
            <BFormRadioGroup
              id="factory-reset-options"
              v-model="resetOption"
              stacked
            >
              <BFormRadio
                class="mb-1"
                value="resetBios"
                aria-describedby="reset-bios"
                :disabled="serverStatus !== 'off'"
                data-test-id="factoryReset-radio-resetBios"
              >
                {{ $t('pageFactoryReset.form.resetBiosOptionLabel') }}
              </BFormRadio>
              <label id="reset-bios">
                {{ $t('pageFactoryReset.form.resetBiosOptionHelperText') }}
              </label>

              <BFormRadio
                class="mb-1"
                value="resetToDefaults"
                aria-describedby="reset-to-defaults"
                data-test-id="factoryReset-radio-resetToDefaults"
                :disabled="serverStatus !== 'off'"
              >
                {{ $t('pageFactoryReset.form.resetToDefaultsOptionLabel') }}
              </BFormRadio>
              <label id="reset-to-defaults">
                {{
                  $t('pageFactoryReset.form.resetToDefaultsOptionHelperText')
                }}
              </label>
            </BFormRadioGroup>
          </BFormGroup>
          <BButton
            v-b-modal.modal-reset
            type="submit"
            variant="primary"
            :disabled="serverStatus !== 'off'"
            data-test-id="factoryReset-button-submit"
          >
            {{ $t('global.action.reset') }}
          </BButton>
        </BCol>
      </BRow>
    </BForm>

    <!-- Modals -->
    <modal-reset :reset-type="resetOption" @okConfirm="onOkConfirm" />
  </BContainer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import Alert from '@/components/Global/Alert.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import ModalReset from './FactoryResetModal.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import { FactoryResetStore, AuthenticationStore, GlobalStore } from '@/store';
import eventBus from '@/eventBus';

const global = GlobalStore();
const authentication = AuthenticationStore();
const factoryReset = FactoryResetStore();
const toast = useToastComposable();
const { hideLoader, startLoader, endLoader } = useLoadingBar();
const resetOption = ref('resetBios');
const serverStatus = computed(() => {
  return global.serverStatus;
});
onMounted(() => {
  hideLoader();
});

const onResetSubmit = () => {
  eventBus.emit('modal-reset');
};
const onOkConfirm = () => {
  if (resetOption.value === 'resetBios') {
    onResetBiosConfirm();
  } else {
    onResetToDefaultsConfirm();
  }
};
const onResetBiosConfirm = () => {
  factoryReset
    .resetBios()
    .then((message) => {
      toast.successToast(message);
    })
    .catch(({ message }) => {
      toast.errorToast('', {
        title: message,
      });
    });
};
const onResetToDefaultsConfirm = () => {
  startLoader();
  factoryReset
    .resetBios()
    .then(() => {
      return factoryReset.resetToDefaults();
    })
    .then((message) => {
      toast.successToast(message);
      setTimeout(() => {
        authentication.logout;
      }, 3000);
    })
    .catch(({ message }) => toast.errorToast(message))
    .finally(() => endLoader());
};
</script>
<style scoped>
label {
  color: #666;
  margin-left: 1.5rem;
  margin-bottom: 1rem;
}
</style>
