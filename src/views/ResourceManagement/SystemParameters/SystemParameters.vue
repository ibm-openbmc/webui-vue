<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.systemParameters')">
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
    <lateral-cast-out :is-server-off="isServerOff" />
    <frequency-cap :is-server-off="isServerOff" />
    <aggressive-prefetch :is-server-off="isServerOff" />
    <runtime-processor-diagnostic :is-server-off="isServerOff" />
    <help-modal
      v-model="showHelpModal"
      :help-content="searchContent"
      @action="handleHelpAction"
    />
  </BContainer>
</template>

<script setup>
import IconHelp from '@carbon/icons-vue/es/help/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import HelpModal from '@/components/Global/HelpModal.vue';
import LateralCastOut from './LateralCastOut.vue';
import FrequencyCap from './FrequencyCap.vue';
import AggressivePrefetch from './AggressivePrefetch.vue';
import RuntimeProcessorDiagnostic from './RuntimeProcessorDiagnostic.vue';
import { searchContent } from './SystemParametersSearchContent.js';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';
import { onBeforeMount, computed, ref } from 'vue';

const { startLoader, endLoader } = useLoadingBar();

const systemParametersStore = stores.SystemParametersStore();
const global = stores.GlobalStore();

const showHelpModal = ref(false);

const handleHelpAction = (action) => {
  showHelpModal.value = false;
  // Handle specific actions if needed
};

onBeforeMount(() => {
  startLoader();
  systemParametersStore.getBiosAttributesRegistry().finally(() => endLoader());
});

const serverStatus = computed(() => {
  return global.serverStatus;
});
const isServerOff = computed(() => {
  return serverStatus.value === 'off' ? true : false;
});
</script>
