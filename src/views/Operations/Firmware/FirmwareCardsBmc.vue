<template>
  <div>
    <page-section :section-title="sectionTitle">
      <BCardGroup deck>
        <!-- Running image -->
        <BCard>
          <template #header>
            <h5 class="fw-bold m-0">
              {{ $t('pageFirmware.cardTitleRunning') }}
            </h5>
          </template>
          <dl class="mb-0">
            <dt>{{ $t('pageFirmware.cardBodyVersion') }}</dt>
            <dd class="mb-0">{{ runningVersion }}</dd>
          </dl>
          <template #footer>
            <div v-if="firmwareBootSide === 'Temp'">
              <p class="m-0">{{ $t('pageFirmware.temporary') }}</p>
            </div>
            <div v-else>
              <p class="m-0">{{ $t('pageFirmware.permanent') }}</p>
            </div>
          </template>
        </BCard>

        <!-- Backup image -->
        <BCard>
          <template #header>
            <h5 class="fw-bold m-0">
              {{ $t('pageFirmware.cardTitleBackup') }}
            </h5>
          </template>
          <dl>
            <dt>{{ $t('pageFirmware.cardBodyVersion') }}</dt>
            <dd>
              <status-icon v-if="showBackupImageStatus" status="danger" />
              <span v-if="showBackupImageStatus" class="sr-only">
                {{ backupStatus }}
              </span>
              {{ backupVersion }}
            </dd>
          </dl>
          <template #footer>
            <div v-if="firmwareBootSide === 'Temp'">
              <p class="m-0">{{ $t('pageFirmware.permanent') }}</p>
            </div>
            <div v-else>
              <p class="m-0">{{ $t('pageFirmware.temporary') }}</p>
            </div>
          </template>
          <BButton
            v-if="!switchToBackupImageDisabled"
            data-test-id="firmware-button-switchToRunning"
            variant="link"
            size="sm"
            class="py-0 px-1 mt-2"
            :disabled="isPageDisabled || !backup || !isServerOff"
            @click="showConfirmationModal"
          >
            <icon-switch class="d-none d-sm-inline-block" />
            {{ $t('pageFirmware.cardActionSwitchToRunning') }}
          </BButton>
        </BCard>
      </BCardGroup>
    </page-section>
    <modal-switch-to-running :backup="backupVersion" @ok="switchToRunning" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import PageSection from '@/components/Global/PageSection.vue';
import ModalSwitchToRunning from './FirmwareModalSwitchToRunning.vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import IconSwitch from '@carbon/icons-vue/es/arrows--horizontal/20';
import stores from '@/store';

const { errorToast, infoToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();

const globalStore = stores.GlobalStore();
const firmwareStore = stores.FirmwareStore();

const emit = defineEmits(['loadingStatus']);

defineProps({
  isPageDisabled: {
    required: true,
    type: Boolean,
    default: false,
  },
  isServerOff: {
    required: true,
    type: Boolean,
    default: false,
  },
});

const switchToBackupImageDisabled = ref(
  import.meta.env.VITE_APP_SWITCH_TO_BACKUP_IMAGE_DISABLED === 'true',
);

const bootProgress = computed(() => {
  return globalStore.bootProgressGetter;
});

const isSingleFileUploadEnabled = computed(() => {
  return firmwareStore.isSingleFileUploadEnabled;
});

const sectionTitle = computed(() => {
  if (isSingleFileUploadEnabled.value) {
    return i18n.global.t('pageFirmware.sectionTitleBmcCardsCombined');
  }
  return i18n.global.t('pageFirmware.sectionTitleBmcCards');
});

const running = computed(() => {
  return firmwareStore.activeBmcFirmware;
});

const backup = computed(() => {
  return firmwareStore.backupBmcFirmware;
});

const runningVersion = computed(() => {
  return running.value?.version || '--';
});

const backupVersion = computed(() => {
  return backup.value?.version || '--';
});

const backupStatus = computed(() => {
  return backup.value?.status || null;
});

const showBackupImageStatus = computed(() => {
  return backupStatus.value === 'Critical' || backupStatus.value === 'Warning';
});

const firmwareBootSide = computed(() => {
  return firmwareStore.firmwareBootSideGetter;
});

const isReadonly = () => {
  return globalStore.isReadOnlyUser;
};

watch(loading, (value) => {
  emit('loadingStatus', value);
});

function showConfirmationModal() {
  eventBus.emit('modal-switch-to-running');
}

function switchToRunning() {
  startLoader();
  emit('loadingStatus', loading.value);
  console.log('confirm');

  // Set firmware switch in progress
  globalStore.setFirmwareSwitchInProgress(true);

  // Step 1 - Switch firmware
  const switchFirmware = () => {
    if (!isReadonly()) {
      infoToast(
        i18n.global.t('pageFirmware.toast.switchToRunning.step1Message'),
        {
          title: i18n.global.t('pageFirmware.toast.switchToRunning.step1'),
          timestamp: true,
        },
      );
    }
    firmwareStore
      .switchBmcFirmwareAndReboot()
      .then(async () => bmcReboot())
      .catch(({ message }) => {
        endLoader();
        globalStore.setFirmwareSwitchInProgress({
          inProgress: false,
          success: false,
        });
        errorToast(message);
      });
  };

  // Step 2 - BMC Reboot
  const bmcReboot = () => {
    globalStore.setFirmwareSwitchStep(2);
    infoToast(
      i18n.global.t('pageFirmware.toast.switchToRunning.step2Message'),
      {
        title: i18n.global.t('pageFirmware.toast.switchToRunning.step2'),
        timestamp: true,
      },
    );
    const timer = (checkCounter = 0) => {
      checkCounter++;

      // This counter goes up by 1 every time this function runs
      // If the function successfully goes to last toast, it won't run anymore
      // if this function runs more than 10 times, it won't run anymore
      if (checkCounter > 10) {
        endLoader();
        globalStore.setFirmwareSwitchInProgress({
          inProgress: false,
          success: false,
        });
        return errorToast(
          i18n.global.t('pageFirmware.toast.errorSwitchImages'),
        );
      }
      globalStore.getBootProgress().then(() => {
        if (bootProgress.value) {
          step3();
        } else {
          setTimeout(() => {
            timer(checkCounter);
          }, 60000); // 1 minute;
        }
      });
    };
    timer();
  };

  // Step 3 - Firmware switch complete
  const step3 = () => {
    globalStore.setFirmwareSwitchStep(3);
    setTimeout(() => {
      endLoader();
      globalStore.setFirmwareSwitchInProgress({
        inProgress: false,
        success: true,
      });
      return infoToast(
        i18n.global.t('pageFirmware.toast.switchToRunning.step3Message'),
        {
          title: i18n.global.t('pageFirmware.toast.switchToRunning.step3'),
          refreshAction: true,
          timestamp: true,
        },
      );
    }, 120000); // 2 minutes
  };

  switchFirmware();
}
</script>
