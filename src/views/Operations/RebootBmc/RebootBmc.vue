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
  // Capture the reboot time before we start so we can detect when it changes
  const rebootTimeBeforeStart = controlStore.getLastBmcRebootTime
    ? new Date(controlStore.getLastBmcRebootTime).getTime()
    : null;

  globalStore.setBmcRebootInProgress(true);
  controlStore
    .rebootBmc()
    .then((message) => {
      infoToast(message);
      startLoader();

      // Step 2 - reboot in progress
      globalStore.setBmcRebootStep(2);

      // Poll until LastResetTime on /redfish/v1/Managers/bmc changes to a
      // newer value — that is the definitive signal the BMC has rebooted
      const timer = (checkCounter = 0) => {
        checkCounter++;
        if (checkCounter > 10) {
          endLoader();
          globalStore.setBmcRebootInProgress({
            inProgress: false,
            success: false,
          });
          return errorToast(message);
        }
        controlStore.fetchLastBmcRebootTime().then(() => {
          const newRebootTime = controlStore.getLastBmcRebootTime
            ? new Date(controlStore.getLastBmcRebootTime).getTime()
            : null;
          const rebootComplete =
            newRebootTime !== null &&
            (rebootTimeBeforeStart === null ||
              newRebootTime > rebootTimeBeforeStart);
          if (rebootComplete) {
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
