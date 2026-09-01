<template>
  <div>
    <BContainer fluid="xl">
      <page-title :title="$t('appPageTitle.rebootBmc')" />
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
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import i18n from '@/i18n';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useToast from '@/components/Composables/useToastComposable';
import { useRebootBmc } from '@/api/composables/useRebootBmc';
import { useBootSettings } from '@/api/composables/useBootSettings';

const { successToast, errorToast } = useToast();

const bootSettingsStore = stores.BootSettingsStore();

const { lastBmcRebootTime, isFetching, isError, rebootBmc } = useRebootBmc();
const { systemDumpActive } = useBootSettings();

const openModal = ref(false);

usePageLoadingBar(isFetching, isError);

const systemDumpActive = computed(() => {
  return bootSettingsStore.getSystemDumpActive;
});

function onClick() {
  openModal.value = true;
}

function handleOK() {
  openModal.value = false;
  rebootBmc()
    .then(() =>
      successToast(i18n.global.t('pageRebootBmc.toast.successRebootStart')),
    )
    .catch(() =>
      errorToast(i18n.global.t('pageRebootBmc.toast.errorRebootStart')),
    );
}
</script>
