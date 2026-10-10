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
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import { useRebootBmc } from '@/api/composables/useRebootBmc';
import { useBootSettings } from '@/api/composables/useBootSettings';
import stores from '@/store';

const { errorToast, infoToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();

const { lastBmcRebootTime, isFetching, isError, rebootBmc } = useRebootBmc();
const { systemDumpActive } = useBootSettings();
const globalStore = stores.GlobalStore();

const openModal = ref(false);

usePageLoadingBar(isFetching, isError);

function onClick() {
  openModal.value = true;
}

function handleOK() {
  openModal.value = false;
  rebootBmc()
    .then(() => {
      infoToast(i18n.global.t('pageRebootBmc.toast.successRebootStart'));
      startLoader();

      // Phase 1: Wait for the BMC to go offline (requests start failing).
      // The reboot command was just issued but the BMC is still alive for a
      // few seconds, so getSystemInfo() would succeed as a false positive
      // if polled immediately. Poll until a request *fails* first.
      const waitForOffline = (attempts = 0) => {
        if (attempts > 60) {
          // BMC never went offline — surface an error and stop.
          endLoader();
          return errorToast(
            i18n.global.t('pageRebootBmc.toast.errorRebootStart'),
          );
        }
        globalStore
          .getSystemInfo()
          .then(() => {
            // Still online — check again after 1s.
            setTimeout(() => waitForOffline(attempts + 1), 1000);
          })
          .catch(() => {
            // BMC is now offline — start polling for recovery.
            waitForOnline();
          });
      };

      // Phase 2: Poll until getSystemInfo() succeeds (BMC is back online).
      const waitForOnline = (attempts = 0) => {
        if (attempts > 10) {
          endLoader();
          return errorToast(
            i18n.global.t('pageRebootBmc.toast.errorRebootStart'),
          );
        }
        globalStore
          .getSystemInfo()
          .then(() => {
            infoToast(
              i18n.global.t('pageRebootBmc.toast.successRebootCompleted'),
            );
            endLoader();
          })
          .catch(() => {
            // Still offline — retry after 1 minute.
            setTimeout(() => waitForOnline(attempts + 1), 60000);
          });
      };

      waitForOffline();
    })
    .catch(() => {
      return errorToast(i18n.global.t('pageRebootBmc.toast.errorRebootStart'));
    });
}
</script>
