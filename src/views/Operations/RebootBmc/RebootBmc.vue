<template>
  <div>
    <BContainer fluid="xl">
      <page-title :title="$t('appPageTitle.rebootBmc')">
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
        <BCol md="8" lg="8" xl="6">
          <page-section>
            <BRow>
              <BRow>
                <dl>
                  <dt>
                    {{ $t('pageRebootBmc.lastReboot') }}
                  </dt>
                  <dd v-if="lastBmcRebootTime">
                    {{ $filters.formatDate(lastBmcRebootTime) }}
                    {{ $filters.formatTime(lastBmcRebootTime) }}
                  </dd>
                  <dd v-else>--</dd>
                </dl>
              </BRow>
            </BRow>
            {{ $t('pageRebootBmc.rebootInformation') }}
            <BButton
              variant="primary"
              class="d-block mt-5"
              data-test-id="rebootBmc-button-reboot"
              @click="onClick"
            >
              {{ $t('pageRebootBmc.rebootBmc') }}
            </BButton>
          </page-section>
        </BCol>
      </BRow>
    </BContainer>
    <BModal
      v-model="openModal"
      hide-header-close
      :title="$t('pageRebootBmc.modal.confirmTitle')"
      :ok-title="
        systemDumpActive
          ? $t('pageRebootBmc.rebootBmc')
          : $t('global.action.confirm')
      "
      :ok-variant="systemDumpActive ? 'danger' : 'primary'"
      :cancel-title="$t('global.action.cancel')"
      @ok="handleOK"
    >
      <p>
        {{
          `${systemDumpActive ? $t('pageRebootBmc.modal.confirmMessage2') : ''}
            ${$t('pageRebootBmc.modal.confirmMessage')}
            `
        }}
      </p>
    </BModal>

    <!-- Help Modal -->
    <help-modal
      v-model="showHelpModal"
      :help-content="rebootBmcSearchContent"
      @action="handleHelpAction"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import IconHelp from '@carbon/icons-vue/es/help/20';
import HelpModal from '@/components/Global/HelpModal.vue';
import { rebootBmcSearchContent } from './RebootBmcSearchContent.js';
import stores from '@/store';

const showHelpModal = ref(false);

function handleHelpAction(action) {
  // Handle quick actions from help modal
  switch (action) {
    case 'reboot-bmc':
      // Trigger reboot BMC functionality
      onClick();
      break;
    default:
      break;
  }
}

const { successToast, errorToast } = useToast();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

const controlStore = stores.ControlStore();
const bootSettingsStore = stores.BootSettingsStore();

const openModal = ref(false);

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  startLoader();
  controlStore.fetchLastBmcRebootTime().finally(() => {
    endLoader();
  });
});

const lastBmcRebootTime = computed(() => {
  return controlStore.getLastBmcRebootTime;
});

const systemDumpActive = computed(() => {
  return bootSettingsStore.getSystemDumpActive;
});

function rebootBmc() {
  controlStore
    .rebootBmc()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function onClick() {
  bootSettingsStore.fetchBiosAttributes().then(() => {
    openModal.value = true;
  });
}

function handleOK() {
  openModal.value = false;
  rebootBmc();
}
</script>
