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

const bootProgress = computed(() => {
  return globalStore.bootProgressGetter;
});

function onClick() {
  openModal.value = true;
}

function handleOK() {
  openModal.value = false;
  rebootBmc()
    .then(() => {
      infoToast(i18n.global.t('pageRebootBmc.toast.successRebootStart'));
      startLoader();

      // Start checking BMC status after reboot
      const timer = (checkCounter = 0) => {
        checkCounter++;
        // This counter goes up by 1 every time this function runs
        // If the function successfully goes to last toast, it won't run anymore
        // if this function runs more than 10 times, it won't run anymore
        if (checkCounter > 10) {
          endLoader();
          return errorToast(
            i18n.global.t('pageRebootBmc.toast.errorRebootStart'),
          );
        }
        globalStore.getBootProgress().then(() => {
          if (bootProgress.value) {
            infoToast(
              i18n.global.t('pageRebootBmc.toast.successRebootCompleted'),
            );
            endLoader();
          } else {
            setTimeout(() => {
              timer(checkCounter);
            }, 60000); // 1 minute
          }
        });
      };
      timer();
    })
    .catch(() =>
      errorToast(i18n.global.t('pageRebootBmc.toast.errorRebootStart')),
    );
}
</script>
