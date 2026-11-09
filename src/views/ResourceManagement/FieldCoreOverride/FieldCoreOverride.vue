<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.fieldCoreOverride')"
      :description="$t('pageFieldCoreOverride.pageDescription')"
    />
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

    <!-- Reboot confirmation (opened from the context menu) -->
    <BModal
      v-model="isRebootModalOpen"
      :title="$t('pageFieldCoreOverride.contextMenu.rebootModalTitle')"
      :ok-title="$t('global.action.confirm')"
      :cancel-title="$t('global.action.cancel')"
      @ok="onRebootConfirm"
    >
      <p>{{ $t('pageFieldCoreOverride.contextMenu.rebootModalMessage') }}</p>
    </BModal>
  </BContainer>
</template>

<script setup>
import { onBeforeMount, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useContextMenu } from '@/components/ContextMenu';
import useToast from '@/components/Composables/useToastComposable';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import PageTitle from '@/components/Global/PageTitle.vue';
import Alert from '@/components/Global/Alert.vue';
import stores from '@/store';
import { useFieldCoreOverride } from '@/api/composables/useFieldCoreOverride';
import { useServerReboot } from '@/api/composables/useServerReboot';
import CurrentConfiguration from './FieldCoreOverrideInfo.vue';
import ChangeConfiguration from './FieldCoreOverrideConfiguration.vue';

const systemStore = stores.SystemStore();
const licenseStore = stores.LicenseStore();

const { isFetching, isError, refetch } = useFieldCoreOverride();

// Expose refetch for parent components
defineExpose({
  refetch,
});

// 1120-vue3 waited for getLicenses() + getSystem() + getBiosAttributes().
// Track the Vuex side-calls as an extra loading flag.
const isExtraLoading = ref(true);

// Combined: BIOS query (shared with children) + Vuex side-calls
const isPageFetching = computed(() => isFetching.value || isExtraLoading.value);

onBeforeMount(() => {
  Promise.all([licenseStore.getLicenses(), systemStore.getSystem()]).finally(
    () => {
      isExtraLoading.value = false;
    },
  );
});

usePageLoadingBar(isPageFetching, isError);

// ── Context menu: reboot server ─────────────────────────────────────────────
const { t } = useI18n();
const { errorToast, warningToast, infoToast, successToast } = useToast();
const { isRebootInProgress, requestReboot } = useServerReboot();
const isRebootModalOpen = ref(false);

// Disabled only while a reboot is in progress: from the moment it is
// confirmed until the server is back on (or the tracking fails / times out).
function onRebootConfirm() {
  requestReboot({
    onRebooted: () => {
      refetch();
      successToast(t('pageFieldCoreOverride.contextMenu.rebootCompleted'));
    },
    onFailed: (reason) => {
      refetch();
      warningToast(
        t(
          reason === 'notOff'
            ? 'pageFieldCoreOverride.contextMenu.rebootNotOff'
            : 'pageFieldCoreOverride.contextMenu.rebootNotOn',
        ),
      );
    },
  })
    .then(() => infoToast(t('pageFieldCoreOverride.contextMenu.rebootStarted')))
    .catch(() =>
      errorToast(t('pageFieldCoreOverride.contextMenu.rebootError')),
    );
}

useContextMenu({
  items: computed(() => [
    {
      key: 'rebootServer',
      label: t('pageFieldCoreOverride.contextMenu.reboot'),
      disabled: isRebootInProgress.value,
    },
  ]),
  handlers: {
    rebootServer: () => {
      if (isRebootInProgress.value) return;
      isRebootModalOpen.value = true;
    },
  },
});
</script>
