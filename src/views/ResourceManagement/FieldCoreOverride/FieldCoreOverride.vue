<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.fieldCoreOverride')"
      :description="$t('pageFieldCoreOverride.pageDescription')"
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
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-5">
          <h5 class="mb-0 fw-bold">
            {{ $t('pageFieldCoreOverride.alert.title') }}
          </h5>
          <p>
            {{ $t('pageFieldCoreOverride.alert.description') }}
          </p>
        </alert>
      </BCol>
    </BRow>

    <current-configuration />
    <change-configuration />

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="searchContent"
      @action="handleHelpAction"
    />
  </BContainer>
</template>

<script setup>
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import IconHelp from '@carbon/icons-vue/es/help/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import HelpModal from '@/components/Global/HelpModal.vue';
import stores from '@/store';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';
import { searchContent } from './FieldCoreOverrideSearchContent.js';

const { startLoader, endLoader, hideLoader } = useLoadingBar();

const systemStore = stores.SystemStore();
const fieldCoreOverrideStore = stores.FieldCoreOverrideStore();
const licenseStore = stores.LicenseStore();

const showHelpModal = ref(false);

const handleHelpAction = (action) => {
  showHelpModal.value = false;
  // Add any specific actions if needed
};

onBeforeMount(() => {
  startLoader();
  Promise.all([
    licenseStore.getLicenses(),
    systemStore.getSystem(),
    fieldCoreOverrideStore.getBiosAttributes(),
  ]).finally(() => endLoader());
});

onBeforeRouteLeave(() => {
  hideLoader();
});
</script>
