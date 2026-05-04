<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.deconfigurationHardware')"
      :description="$t('pageDeconfigurationHardware.description')"
      :link="$t('pageDeconfigurationHardware.link')"
      to="/logs/deconfiguration-records"
      class="hw-deconfig-title"
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
        <alert variant="info" class="mb-4">
          <div>
            {{ $t('pageDeconfigurationHardware.alert.message') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <b-row>
      <b-col md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div>
            {{ $t('pageDeconfigurationHardware.alert.warning') }}
          </div>
        </alert>
      </b-col>
    </b-row>
    <page-section>
      <BRow>
        <BCol>
          <b-card no-body>
            <b-tabs content-class="mt-3" fill>
              <b-tab :title="$t('pageDeconfigurationHardware.memoryDimms')">
                <memory-dimms />
              </b-tab>
              <b-tab :title="$t('pageDeconfigurationHardware.processorCores')">
                <processor-cores />
              </b-tab>
            </b-tabs>
          </b-card>
        </BCol>
      </BRow>
    </page-section>

    <!-- Help Modal -->
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
import PageSection from '@/components/Global/PageSection.vue';
import HelpModal from '@/components/Global/HelpModal.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import Alert from '@/components/Global/Alert.vue';
import ProcessorCores from './ProcessorCores.vue';
import MemoryDimms from './MemoryDimms.vue';
import { onBeforeMount, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { searchContent } from './HardwareDeconfigurationSearchContent.js';

const { startLoader, hideLoader } = useLoadingBar();

const showHelpModal = ref(false);

const handleHelpAction = (action) => {
  showHelpModal.value = false;
  // Add any specific actions if needed
};

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
});
</script>

<style lang="scss" scoped>
.hw-deconfig-title {
  :deep(a) {
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
