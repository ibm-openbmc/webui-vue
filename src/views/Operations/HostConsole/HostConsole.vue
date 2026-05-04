<template>
  <BContainer fluid="xl">
    <page-title
      class="mb-4"
      :title="$t('appPageTitle.hostConsole')"
      :description="$t('pageHostConsole.subTitle')"
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

    <page-section class="mb-0">
      <host-console-console :is-full-window="false" />
    </page-section>

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="hostConsoleSearchContent"
      @action="handleHelpAction"
    />
  </BContainer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import eventBus from '@/eventBus';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import HostConsoleConsole from './HostConsoleConsole.vue';
import IconHelp from '@carbon/icons-vue/es/help/20';
import HelpModal from '@/components/Global/HelpModal.vue';
import { hostConsoleSearchContent } from './HostConsoleSearchContent.js';

const showHelpModal = ref(false);

function handleHelpAction(action) {
  // Handle quick actions from help modal
  switch (action) {
    case 'open-new-tab':
      // Trigger open in new tab functionality if available
      break;
    default:
      break;
  }
}

onMounted(() => {
  eventBus.emit('loading-bar-status', true);
});
</script>
