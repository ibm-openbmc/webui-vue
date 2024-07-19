<template>
  <div>
    <BContainer fluid="xl">
      <page-title
        :title="$t('appPageTitle.keyClear')"
        :description="$t('pageKeyClear.description')"
      />
      <BRow>
        <BCol md="8" xl="6">
          <alert variant="info" class="mb-4">
            <div class="title">
              {{ $t('pageKeyClear.alert.title') }}
            </div>
            <div>
              {{ $t('pageKeyClear.alert.description') }}
            </div>
          </alert>
        </BCol>
      </BRow>
      <!-- Reset Form -->
      <BForm id="key-clear" @submit.prevent="onKeyClearSubmit(keyOption)">
        <BRow>
          <BCol md="8">
            <BFormGroup
              class="fieldset"
              :label="$t('pageKeyClear.form.keyClearOptionsLabel')"
            >
              <BFormRadioGroup
                id="key-clear-options"
                v-model="keyOption"
                stacked
              >
                <BFormRadio class="radioButton" value="NONE">
                  {{ $t('pageKeyClear.form.none') }}
                </BFormRadio>
                <BFormText
                  id="key-clear-not-requested"
                  class="ms-4 mb-3 formText"
                >
                  {{ $t('pageKeyClear.form.keyClearNotRequested') }}
                </BFormText>
                <BFormRadio class="radioButton" value="ALL">
                  {{ $t('pageKeyClear.form.clearAllLabel') }}
                </BFormRadio>
                <BFormText id="clear-all" class="ms-4 mb-3 formText">
                  {{ $t('pageKeyClear.form.clearAllHelperText') }}
                </BFormText>
                <BFormRadio class="radioButton" value="POWERVM_SYSKEY">
                  {{ $t('pageKeyClear.form.clearHypervisorSystemKeyLabel') }}
                </BFormRadio>
                <BFormText id="clear-hypervisor-key" class="ms-4 mb-3 formText">
                  {{
                    $t('pageKeyClear.form.clearHypervisorSystemKeyHelperText')
                  }}
                </BFormText>
                <template v-if="username == 'service'">
                  <BFormRadio class="radioButton" value="MFG_ALL">
                    {{ $t('pageKeyClear.form.clearAllSetGenesisIPL') }}
                  </BFormRadio>
                  <BFormRadio class="radioButton" value="MFG">
                    {{ $t('pageKeyClear.form.setFactoryDefault') }}
                  </BFormRadio>
                </template>
              </BFormRadioGroup>
            </BFormGroup>
            <BButton
              type="submit"
              variant="primary"
              data-test-id="keyClear-button-submit"
            >
              {{ $t('pageKeyClear.form.clear') }}
            </BButton>
          </BCol>
        </BRow>
      </BForm>
    </BContainer>
    <BModal
      v-model="openModal"
      :title="$t('pageKeyClear.modal.clearAllTitle')"
      :ok-title="$t('pageKeyClear.modal.clear')"
      ok-variant="danger"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOK"
    >
      <p>{{ $t('pageKeyClear.modal.clearAllMessage') }}</p>
    </BModal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { GlobalStore, KeyClearStore } from '@/store';
import Alert from '@/components/Global/Alert.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import useToast from '@/components/Composables/useToastComposable';

const globalStore = GlobalStore();
const keyOption = ref('NONE');
const username = ref(globalStore.username);
const openModal = ref(false);
const selectedKey = ref('');

const keyClear = KeyClearStore();
const { successToast, errorToast } = useToast();

function onKeyClearSubmit(valueSelected) {
  openModal.value = true;
  selectedKey.value = valueSelected;
}
const handleOK = () => {
  keyClear
    .clearEncryptionKeys(selectedKey.value)
    .then((message) => {
      openModal.value = false;
      successToast(message);
    })
    .catch(({ message }) => {
      openModal.value = false;
      errorToast(message);
    });
};
</script>

<style lang="scss" scoped>
.title {
  font-weight: bold;
}
.formText {
  display: inline-block;
}
.fieldset {
  margin-bottom: 1rem;
}
</style>
