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
import { onBeforeRouteLeave } from 'vue-router';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import stores from '@/store';
import i18n from '@/i18n';

const { errorToast, infoToast } = useToast();
const { hideLoader, startLoader, endLoader } = useLoadingBar();

const controlStore = stores.ControlStore();
const bootSettingsStore = stores.BootSettingsStore();
const globalStore = stores.GlobalStore();

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

const bootProgress = computed(() => {
  return globalStore.bootProgressGetter;
});

function rebootBmc() {
  globalStore.setBmcRebootInProgress(true);
  controlStore
    .rebootBmc()
    .then((message) => {
      infoToast(message);
      startLoader();

      // Step 2 - reboot in progress
      globalStore.setBmcRebootStep(2);

      // Start checking BMC status after reboot
      const timer = (checkCounter = 0) => {
        checkCounter++;
        // This counter goes up by 1 every time this function runs
        // If the function successfully goes to last toast, it won't run anymore
        // if this function runs more than 10 times, it won't run anymore
        if (checkCounter > 10) {
          endLoader();
          globalStore.setBmcRebootInProgress({
            inProgress: false,
            success: false,
          });
          return errorToast(message);
        }
        globalStore.getBootProgress().then(() => {
          if (bootProgress.value) {
            globalStore.setBmcRebootStep(3);
            infoToast(
              i18n.global.t('pageRebootBmc.toast.successRebootCompleted'),
            );
            endLoader();
            globalStore.setBmcRebootInProgress({
              inProgress: false,
              success: true,
            });
          } else {
            setTimeout(() => {
              timer(checkCounter);
            }, 60000); // 1 minute
          }
        });
      };
      timer();
    })
    .catch(({ message }) => {
      globalStore.setBmcRebootInProgress({
        inProgress: false,
        success: false,
      });
      errorToast(message);
    });
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
