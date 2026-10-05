<template>
  <!-- Custom right-click context menu -->
  <context-menu
    ref="contextMenuRef"
    :items="contextMenuItems"
    @action="onContextMenuAction"
  />

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
              role="radio"
              aria-checked="true"
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
            :disabled="serverStatus !== 'off' || isResetting"
            data-test-id="factoryReset-button-submit"
          >
            {{ $t('global.action.reset') }}
          </BButton>
        </BCol>
      </BRow>
    </BForm>

    <!-- Modals -->
    <modal-reset :reset-type="resetOption" @ok-confirm="onOkConfirm" />

    <!-- Power confirmation modal -->
    <BModal
      v-model="powerModalOpen"
      :title="powerModalTitle"
      ok-variant="primary"
      :ok-title="$t('global.action.confirm')"
      :cancel-title="$t('global.action.cancel')"
      @ok="onPowerConfirm"
    >
      <p>{{ powerModalMessage }}</p>
    </BModal>

    <!-- Screenshot preview modal -->
    <BModal
      v-model="screenshotModalOpen"
      :title="$t('pageFactoryReset.contextMenu.screenshotTitle')"
      ok-only
      :ok-title="$t('pageFactoryReset.contextMenu.screenshotDownload')"
      size="xl"
      @ok="downloadScreenshot"
    >
      <img
        v-if="screenshotDataUrl"
        :src="screenshotDataUrl"
        alt="Page screenshot"
        style="width: 100%; height: auto"
      />
    </BModal>
  </BContainer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Alert from '@/components/Global/Alert.vue';
import PageTitle from '@/components/Global/PageTitle.vue';
import ModalReset from './FactoryResetModal.vue';
import ContextMenu from '@/components/Global/ContextMenu.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToastComposable from '@/components/Composables/useToastComposable';
import stores from '@/store';
import eventBus from '@/eventBus';
import { useFactoryReset } from '@/api/composables/useFactoryReset';
import { useSystemInfo } from '@/api/composables/useSystemInfo';
import {
  useServerPowerControl,
  useServerBmcInfo,
} from '@/api/composables/useServerPowerOperations';

const { t } = useI18n();
const toast = useToastComposable();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

const { resetBios, resetToDefaults, isResetting } = useFactoryReset();

const authentication = stores.AuthenticationStore();
const { serverStatus } = useSystemInfo();

const { bmc } = useServerBmcInfo();
const { serverPowerOn, serverSoftPowerOff } = useServerPowerControl();

const resetOption = ref('resetBios');

// ── Context menu state ───────────────────────────────────────────────────────
const contextMenuRef = ref(null);
const screenshotModalOpen = ref(false);
const screenshotDataUrl = ref(null);
const powerModalOpen = ref(false);
const powerModalTitle = ref('');
const powerModalMessage = ref('');
const powerAction = ref('');

const contextMenuItems = computed(() => [
  {
    key: 'selectAll',
    label: t('pageFactoryReset.contextMenu.selectAll'),
  },
  {
    key: 'screenshot',
    label: t('pageFactoryReset.contextMenu.screenshot'),
  },
  { divider: true, key: 'div1' },
  {
    key: 'back',
    label: t('pageFactoryReset.contextMenu.back'),
    disabled: !window.history || window.history.length <= 1,
  },
  {
    key: 'reload',
    label: t('pageFactoryReset.contextMenu.reload'),
  },
  {
    key: 'inspect',
    label: t('pageFactoryReset.contextMenu.inspect'),
    hint: t('pageFactoryReset.contextMenu.inspectHint'),
  },
  {
    key: 'savePageAs',
    label: t('pageFactoryReset.contextMenu.savePageAs'),
  },
  { divider: true, key: 'div2' },
  {
    // Single toggle item: label and action flip with server state
    key: serverStatus.value === 'off' ? 'powerOn' : 'powerOff',
    label:
      serverStatus.value === 'off'
        ? t('pageFactoryReset.contextMenu.powerOn')
        : t('pageFactoryReset.contextMenu.powerOff'),
  },
]);

let _contextMenuHandler;
onMounted(() => {
  _contextMenuHandler = (event) => {
    event.preventDefault();
    contextMenuRef.value?.open(event);
  };
  document.addEventListener('contextmenu', _contextMenuHandler);
});
onBeforeUnmount(() => {
  document.removeEventListener('contextmenu', _contextMenuHandler);
});

async function onContextMenuAction(key) {
  switch (key) {
    case 'selectAll':
      window.getSelection()?.selectAllChildren(document.body);
      break;
    case 'screenshot':
      await captureScreenshot();
      break;
    case 'back':
      window.history.back();
      break;
    case 'reload':
      window.location.reload();
      break;
    case 'savePageAs':
      window.print();
      break;
    case 'powerOn':
      powerAction.value = 'on';
      powerModalTitle.value = t('pageFactoryReset.contextMenu.powerOnTitle');
      powerModalMessage.value = t(
        'pageFactoryReset.contextMenu.powerOnMessage',
      );
      powerModalOpen.value = true;
      break;
    case 'powerOff':
      powerAction.value = 'off';
      powerModalTitle.value = t('pageFactoryReset.contextMenu.powerOffTitle');
      powerModalMessage.value = t(
        'pageFactoryReset.contextMenu.powerOffMessage',
      );
      powerModalOpen.value = true;
      break;
  }
}

async function onPowerConfirm() {
  if (powerAction.value === 'on') {
    if (
      bmc.value?.powerState === 'On' &&
      bmc.value?.statusState === 'Enabled' &&
      bmc.value?.health === 'OK'
    ) {
      serverPowerOn()
        .then(() =>
          toast.successToast(t('pageFactoryReset.contextMenu.powerOnSuccess')),
        )
        .catch(() =>
          toast.errorToast(t('pageFactoryReset.contextMenu.powerOnError')),
        );
    } else {
      toast.errorToast(t('pageFactoryReset.contextMenu.powerOnError'));
    }
  } else {
    serverSoftPowerOff()
      .then(() =>
        toast.successToast(t('pageFactoryReset.contextMenu.powerOffSuccess')),
      )
      .catch(() =>
        toast.errorToast(t('pageFactoryReset.contextMenu.powerOffError')),
      );
  }
}

async function captureScreenshot() {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(document.body, { useCORS: true });
    screenshotDataUrl.value = canvas.toDataURL('image/png');
    screenshotModalOpen.value = true;
  } catch {
    toast.infoToast(t('pageFactoryReset.contextMenu.screenshotUnavailable'));
  }
}

function downloadScreenshot() {
  if (!screenshotDataUrl.value) return;
  const a = document.createElement('a');
  a.href = screenshotDataUrl.value;
  a.download = `factory-reset-screenshot-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, '-')}.png`;
  a.click();
}
// ── End context menu ─────────────────────────────────────────────────────────

onBeforeRouteLeave(() => {
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
  resetBios()
    .then((message) => {
      toast.successToast(message);
    })
    .catch(({ message }) => {
      toast.errorToast(message);
    });
};
const onResetToDefaultsConfirm = () => {
  startLoader();
  resetBios()
    .then(() => {
      return resetToDefaults();
    })
    .then((message) => {
      toast.successToast(message);
      setTimeout(() => {
        authentication.logout();
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
