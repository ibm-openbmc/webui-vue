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

const { errorToast, infoToast } = useToast();
const { startLoader, endLoader } = useLoadingBar();
const { getValidationState } = useVuelidateComposable();

const globalStore = stores.GlobalStore();
const bmcStore = stores.BmcStore();
const firmwareStore = stores.FirmwareStore();

const emit = defineEmits(['loadingStatus']);

defineProps({
  isPageDisabled: {
    required: true,
    type: Boolean,
    default: false,
  },
});

const file = ref(null);
const isServerPowerOffRequired = ref(
  import.meta.env.VITE_APP_SERVER_OFF_REQUIRED === 'true',
);

onBeforeMount(() => {
  bmcStore.getBmcInfo();
  firmwareStore.getUpdateServiceSettings();
});

const bmcPowerState = computed(() => {
  return bmcStore.bmcGetter?.powerState;
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

function updateFirmware() {
  startLoader();
  emit('loadingStatus', loading.value);

  // Step 1 - Upload
  const uploadFirmware = () => {
    if (!isReadonly()) {
      infoToast(
        i18n.global.t('pageFirmware.toast.updateFirmware.step1Message'),
        {
          title: i18n.global.t('pageFirmware.toast.updateFirmware.step1'),
          timestamp: true,
        },
      );
    }
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
      infoToast(
        i18n.global.t('pageFirmware.toast.updateFirmware.step2Message'),
        {
          title: i18n.global.t('pageFirmware.toast.updateFirmware.step2'),
          timestamp: true,
        },
      );
      currentTaskProgress(0, taskLink);
    } else {
      endLoader();
      return errorToast(i18n.global.t('pageFirmware.toast.errorActivation'));
    }
  };

  // Step 3 - BMC Reboot
  const bmcReboot = async () => {
    infoToast(i18n.global.t('pageFirmware.toast.updateFirmware.step3Message'), {
      title: i18n.global.t('pageFirmware.toast.updateFirmware.step3'),
      timestamp: true,
    });

    const rebootProgress = (checkCounter = 0) => {
      checkCounter++;

      // This counter goes up by 1 every time this function runs
      // If the function successfully goes to last toast, it won't run anymore
      // if this function runs more than 36 times, it won't run anymore
      if (checkCounter > 36) {
        endLoader();
        return errorToast(i18n.global.t('pageFirmware.toast.errorActivation'));
      }

      setTimeout(() => {
        bmcStore
          .getBmcInfo()
          .then(() => {
            if (bmcPowerState.value) {
              // Power state is available — original logic
              if (bmcPowerState.value === 'On') {
                activationComplete();
              } else {
                rebootProgress(checkCounter);
              }
            } else {
              // Power state unavailable (passive BMC) —
              // getBmcInfo() responding is sufficient to confirm BMC is back
              activationComplete();
            }
          })
          .catch(() => {
            // BMC not responding yet, retry
            rebootProgress(checkCounter);
          });
      }, 180000); // 3 minutes
    };
    rebootProgress();
  };

  // Step 4 - Activation complete
  const activationComplete = () => {
    endLoader();
    return infoToast(
      i18n.global.t('pageFirmware.toast.updateFirmware.step4Message'),
      {
        title: i18n.global.t('pageFirmware.toast.updateFirmware.step4'),
        refreshAction: true,
        timestamp: true,
      },
    );
  };

  uploadFirmware(); // This must be here to run the entire function
}

function dispatchWorkstationUpload(activateFirmware) {
  firmwareStore
    .uploadFirmware(file.value)
    .then(async ({ data }) => {
      activateFirmware(data);
    })
    .catch(({ message }) => {
      endLoader();
      errorToast(message);
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
