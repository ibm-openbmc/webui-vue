<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.serviceLogin')">
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
      <BRow class="d-flex">
        <BCol
          sm="6"
          lg="5"
          xl="4"
          class="d-flex flex-column justify-content-end"
        >
          <BForm id="form-new-dump">
            <BFormGroup
              :label="$t('pageServiceLoginConsoles.selectConsoleType')"
              label-for="selectConsoleType"
            >
              <BFormSelect
                id="selectConsoleType"
                v-model="selectConsoleType"
                :options="consoleTypeOptions"
                value-field="value"
                text-field="text"
              >
              </BFormSelect>
            </BFormGroup>
          </BForm>
        </BCol>
      </BRow>
    </page-section>

    <page-section class="mb-0">
      <service-login-consoles
        v-show="selectConsoleType === 'bmc-console'"
        :is-full-window="false"
        :console-type="'bmc-console'"
      />
      <service-login-consoles
        v-show="selectConsoleType === 'hypervisor-console'"
        :is-full-window="false"
        :console-type="'console1'"
      />
    </page-section>

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="serviceLoginConsolesSearchContent"
      @action="handleHelpAction"
    />
  </BContainer>
</template>

<script setup>
import { ref } from 'vue';
import i18n from '@/i18n';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import ServiceLoginConsoles from './ServiceLoginConsoles.vue';
import IconHelp from '@carbon/icons-vue/es/help/20';
import HelpModal from '@/components/Global/HelpModal.vue';
import { serviceLoginConsolesSearchContent } from './ServiceLoginConsolesSearchContent.js';

const showHelpModal = ref(false);

function handleHelpAction(action) {
  // Handle quick actions from help modal
  switch (action) {
    case 'select-bmc':
      selectConsoleType.value = 'bmc-console';
      break;
    case 'select-hypervisor':
      selectConsoleType.value = 'hypervisor-console';
      break;
    case 'open-new-tab':
      // Trigger open in new tab functionality if available
      break;
    default:
      break;
  }
}

const selectConsoleType = ref('bmc-console');
const consoleTypeOptions = ref([
  {
    value: 'bmc-console',
    text: i18n.global.t('pageServiceLoginConsoles.bmcConsole'),
  },
  {
    value: 'hypervisor-console',
    text: i18n.global.t('pageServiceLoginConsoles.hypervisorConsole'),
  },
]);
</script>
