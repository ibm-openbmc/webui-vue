<template>
  <div>
    <div class="form-background p-3">
      <BForm @submit.prevent="onSubmitUpload">
        <!-- Workstation Upload -->
        <BFormGroup
          :label="$t('pageFirmware.form.updateFirmware.imageFile')"
          aria-label="image-file"
          label-for="image-file-from"
        >
          <FormFile
            id="image-file-from"
            :disabled="isPageDisabled"
            accept=".tar"
            :state="getValidationState(v$.file)"
            @input="onFileUpload($event)"
          >
            <template #invalid>
              <BFormInvalidFeedback role="alert">
                {{ $t('global.form.required') }}
              </BFormInvalidFeedback>
            </template>
          </FormFile>
        </BFormGroup>
        <BButton
          data-test-id="firmware-button-startUpdate"
          type="submit"
          variant="primary"
          :disabled="isPageDisabled"
        >
          {{ $t('pageFirmware.form.updateFirmware.startUpdate') }}
        </BButton>
      </BForm>

      <!-- Progress Bar -->
      <BProgress v-if="showProgressBar" :max="100" animated class="mt-3">
        <BProgressBar :value="progress" :variant="progressVariant">
          {{ progress }}%
        </BProgressBar>
      </BProgress>

      <!-- Progress Text -->
      <div v-if="showProgressBar" class="progress-text mt-2">
        {{ progressText }}
      </div>
    </div>

    <!-- Modals -->
    <modal-update-firmware @ok="updateFirmware" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import i18n from '@/i18n';
import useLoadingBar, {
  loading,
} from '@/components/Composables/useLoadingBarComposable';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import IconInfo from '@carbon/icons-vue/es/information/16';
import FormFile from '@/components/Global/FormFile.vue';
import ModalUpdateFirmware from './FirmwareModalUpdateFirmware.vue';
import stores from '@/store';
import eventBus from '@/eventBus';
import { useFirmware } from '@/api/composables/useFirmware';

const { errorToast, infoToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();
const { getValidationState } = useVuelidateComposable();

const globalStore = stores.GlobalStore();
const bmcStore = stores.BmcStore();

// Use the new VueQuery composable
const { uploadFirmware } = useFirmware();

const emit = defineEmits(['loadingStatus']);

defineProps({
  isPageDisabled: {
    required: true,
    type: Boolean,
    default: false,
  },
});

const file = ref(null);
const progress = ref(0); // Track progress percentage
const showProgressBar = ref(false);
const progressText = ref('');
const progressVariant = ref('success');
const startTime = ref(null);
const finalElapsedTime = ref(0);
const isServerPowerOffRequired = ref(
  import.meta.env.VITE_APP_SERVER_OFF_REQUIRED === 'true',
);

onBeforeMount(() => {
  bmcStore.getBmcInfo();
});

const bmcPowerState = computed(() => {
  return bmcStore.bmcGetter?.powerState;
});

const bootProgress = computed(() => {
  return globalStore.bootProgressGetter;
});

const rules = computed(() => ({
  file: {
    required: required,
  },
}));

const v$ = useVuelidate(rules, {
  file,
});

watch(loading, (value) => {
  emit('loadingStatus', value);
});

const isReadonly = () => {
  return globalStore.isReadOnlyUser;
};

/**
 * Updates the progress bar and optionally shows a toast notification
 * @param {Object} options
 * @param {number} [options.percent] - Progress percentage (defaults to current)
 * @param {string} [options.title] - Toast title i18n key
 * @param {string} [options.message] - Toast message i18n key
 * @param {boolean} [options.isComplete=false] - Whether this is the final update
 * @param {boolean} [options.isError=false] - Whether this is an error state
 * @param {boolean} [options.refreshAction=false] - Include refresh action in toast
 * @param {Function} [options.onComplete] - Callback to run on completion
 * @param {Function} [options.getProgress] - Optional function to fetch dynamic progress
 * @param {boolean} [options.showToast=true] - Whether to show a toast
 */
function updateProgress({
  percent = progress.value,
  title,
  message,
  isComplete = false,
  isError = false,
  refreshAction = false,
  onComplete,
  getProgress,
  showToast = true,
}) {
  if (!loading.value) {
    startLoader();
  }
  showProgressBar.value = true;

  progressVariant.value = isError ? 'danger' : 'success';

  progress.value = getProgress ? Math.ceil(getProgress()) : Math.ceil(percent);

  if (isError) {
    errorToast(i18n.global.t(message), {
      title: i18n.global.t(title),
      timestamp: true,
    });
    endLoader();
    if (onComplete) onComplete();
    return;
  }

  if (showToast) {
    infoToast(i18n.global.t(message, { progress: progress.value }), {
      title: i18n.global.t(title),
      timestamp: true,
      ...(refreshAction && { refreshAction: true }),
    });
  }

  if (isComplete) {
    endLoader();
    if (onComplete) onComplete();
  }
}

function updateFirmware() {
  startLoader();
  emit('loadingStatus', loading.value);
  startTime.value = Date.now();

  let progressTextInterval = null;

  const formatElapsedTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Use padStart to add leading zeros if the number is a single digit
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    return `${formattedMinutes}m ${formattedSeconds}s`;
  };

  // Function to update only the progress text
  const updateElapsedTimeText = () => {
    const elapsedTime = Date.now() - startTime.value;
    progressText.value = `Update started... (Elapsed time: ${formatElapsedTime(
      elapsedTime,
    )})`;
  };

  // Start the interval for updating elapsed time text
  progressTextInterval = setInterval(updateElapsedTimeText, 1000); // Update every 1 second

  // Step 1 - Upload
  const uploadFirmware = () => {
    updateProgress({
      percent: 25,
      title: 'pageFirmware.toast.updateFirmware.step1',
      message: 'pageFirmware.toast.updateFirmware.step1Message',
      showToast: !isReadonly(),
    });
    dispatchWorkstationUpload(activateFirmware);
  };

  // Step 2 - Activation
  const activateFirmware = async (data) => {
    const taskLink = data['@odata.id'];

    const currentTask = async () => {
      return await globalStore.getCurrentTask(taskLink);
    };

    const currentTaskProgress = (checkCounter = 0, data) => {
      checkCounter++;

      // This counter goes up by 1 every time this function runs
      // If the function successfully goes to last toast, it won't run anymore
      // if this function runs more than 36 times, it won't run anymore
      if (checkCounter > 36) {
        endLoader();
        return errorToast(i18n.global.t('pageFirmware.toast.errorActivation'));
      }

      Promise.all([currentTask(data)]).then((res) => {
        // Calculate mapped progress for Step 2 (25% to 50%)
        const mappedProgress = 25 + (res[0].PercentComplete / 100) * 25;

        // Update progress bar only
        updateProgress({
          percent: mappedProgress,
          showToast: false,
        });

        // Check to see if activation was aborted
        const activationAborted = res[0].Messages.filter((message) =>
          message.MessageId.endsWith('TaskAborted'),
        )[0];

        if (activationAborted) {
          if (activationAborted?.Oem?.OpenBMC?.AbortReason) {
            const message =
              activationAborted?.Oem?.OpenBMC?.AbortReason?.split('.').pop();
            if (message === 'ExpiredAccessKey')
              return errorToast(
                i18n.global.t('pageFirmware.toast.expiredAccessKeyError'),
              );
          } else {
            return errorToast(
              i18n.global.t('pageFirmware.toast.errorActivation'),
            );
          }
        }

        // res[0].error indicates that the activation was completed and removed
        // because of BMC starting reboot
        if (res[0].PercentComplete == 100 || res[0].error) {
          bmcReboot();
        } else {
          setTimeout(() => {
            currentTaskProgress(checkCounter, data);
          }, 5000); // If the percent complete isn't 100 or complete, run again in 5 sec
        }
      });
    };

    if (taskLink) {
      updateProgress({
        title: 'pageFirmware.toast.updateFirmware.step2',
        message: 'pageFirmware.toast.updateFirmware.step2Message',
      });
      currentTaskProgress(0, taskLink);
    } else {
      endLoader();
      clearInterval(progressTextInterval);
      startTime.value = null;
      return errorToast(i18n.global.t('pageFirmware.toast.errorActivation'));
    }
  };

  // Step 3 - BMC Reboot
  const bmcReboot = async () => {
    updateProgress({
      percent: 75,
      title: 'pageFirmware.toast.updateFirmware.step3',
      message: 'pageFirmware.toast.updateFirmware.step3Message',
    });

    const rebootProgress = async () => {
      setTimeout(async () => {
        bmcStore
          .getBmcInfo()
          .then(() => {
            if (bmcPowerState.value === 'On') {
              activationComplete();
            } else {
              rebootProgress();
            }
          })
          .catch(({ message }) => {
            endLoader();
            errorToast(message);
          });
      }, 180000); // 3 minutes
    };
    rebootProgress();
  };

  // Step 4 - Activation complete
  const activationComplete = () => {
    finalElapsedTime.value = Date.now() - startTime.value;

    endLoader();
    updateProgress({
      percent: 100,
      title: 'pageFirmware.toast.updateFirmware.step4',
      message: 'pageFirmware.toast.updateFirmware.step4Message',
      isComplete: true,
      refreshAction: true,
      onComplete: () => {
        startTime.value = null; // Reset start time
        clearInterval(progressTextInterval); // Stop the elapsed time interval
        progressText.value = `Update finished. (Time taken: ${formatElapsedTime(
          finalElapsedTime.value,
        )})`;
      },
    });
  };

  uploadFirmware(); // This must be here to run the entire function
}

function dispatchWorkstationUpload(activateFirmware) {
  uploadFirmware(file.value)
    .then(async (data) => {
      activateFirmware(data);
    })
    .catch((error) => {
      endLoader();
      errorToast(error.message);
    });
}

function onSubmitUpload() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  eventBus.emit('modal-update-firmware');
}

function onFileUpload(Uploadedfile) {
  file.value = Uploadedfile;
  v$.value.file.$touch();
}
</script>
