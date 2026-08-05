<template>
  <BForm novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="props.attributeValues"
      :key="componentKey"
      :attribute-values="props.attributeValues"
      :disabled="props.isSavingBios"
      :is-in-phyp-standby="props.isInPhypStandby"
      :bios-attributes="props.biosAttributes"
      :ibmi-load-source-value="props.ibmiLoadSourceValue"
      :ibmi-alt-load-source-value="props.ibmiAltLoadSourceValue"
      :ibmi-console-value="props.ibmiConsoleValue"
      :linux-kvm-percentage-value="props.linuxKvmPercentageValue"
      :linux-kvm-percentage-initial-value="props.linuxKvmPercentageInitialValue"
      :linux-kvm-percentage-current-value="props.linuxKvmPercentageCurrentValue"
      :power-restore-policy="props.powerRestorePolicy"
      :location-codes="props.locationCodes"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
      @pending-operating-mode-settings="updatePendingOperatingMode"
    />
  </BForm>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import BiosSettings from './BiosSettings.vue';
// @ts-ignore - useToastComposable is a JS module
import useToast from '@/components/Composables/useToastComposable';
// @ts-ignore - useLoadingBarComposable is a JS module
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import type { BiosAttributes } from '@/api/composables/useServerPowerOperations';
import stores from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

const props = defineProps<{
  isInPhypStandby?: boolean;
  isUpdated?: boolean;
  attributeValues: Record<string, Array<{ value: string; text: string }>> | null;
  biosAttributes: BiosAttributes | null;
  ibmiLoadSourceValue: string;
  ibmiAltLoadSourceValue: string;
  ibmiConsoleValue: string;
  linuxKvmPercentageValue: number | null;
  linuxKvmPercentageInitialValue: number | null;
  linuxKvmPercentageCurrentValue: number | null;
  powerRestorePolicy: string;
  locationCodes: string[];
  saveBiosSettings: (settings: BiosAttributes) => Promise<string>;
  saveOperatingModeSettings: (payload: { powerRestorePolicy: string; automaticRetryConfig: string; bootFault: string }) => Promise<void>;
  refetch: () => void;
  isSavingBios: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-standby', value: boolean): void;
}>();

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

const componentKey = ref(0);
const isLinuxKvmValid = ref(true);
const localAttributeKeys = ref<BiosAttributes>({ ...props.biosAttributes });
const pendingOperatingModeSettings = ref<{ powerRestorePolicy: string; automaticRetryConfig: string; bootFault: string } | null>(null);

function updateAttributeKeys(attributeKeys: BiosAttributes): void {
  localAttributeKeys.value = attributeKeys;
}

function updatePendingOperatingMode(payload: { powerRestorePolicy: string; automaticRetryConfig: string; bootFault: string } | null): void {
  pendingOperatingModeSettings.value = payload;
}

function linuxKvmValue(value: boolean): void {
  isLinuxKvmValid.value = value;
}

function handleSubmit() {
  startLoader();
  let settings;
  let biosSettings = localAttributeKeys.value;
  settings = { biosSettings };
  props
    .saveBiosSettings(biosSettings)
    .then((message) => {
      if (pendingOperatingModeSettings.value) {
        return props
          .saveOperatingModeSettings(pendingOperatingModeSettings.value)
          .then(() => message);
      }
      return message;
    })
    .then((message) => {
      componentKey.value += 1;
      let hmcManaged = resourceMemoryStore.hmcManagedGetter;
      if (!props.isUpdated) {
        if (settings.biosSettings.pvm_default_os_type == 'Linux KVM') {
          successToast(
            i18n.global.t(
              'pageServerPowerOperations.toast.successSaveLinuxKvmSettings',
            ),
          );
        } else if (
          (settings.biosSettings.pvm_default_os_type == 'IBM I' &&
            isAtleastPhypInStandby.value) ||
          (settings.biosSettings.pvm_default_os_type == 'Default' &&
            isAtleastPhypInStandby.value)
        ) {
          if (props.isInPhypStandby) {
            if (hmcManaged != 'Enabled') {
              infoToast(
                i18n.global.t(
                  'pageServerPowerOperations.toast.successSaveIBMiStandby',
                ),
              );
            }
            successToast(
              i18n.global.t(
                'pageServerPowerOperations.toast.successSaveSettings',
              ),
            );
          } else {
            if (hmcManaged != 'Enabled') {
              infoToast(
                i18n.global.t(
                  'pageServerPowerOperations.toast.successSaveIbmiOsRunningInfo',
                ),
              );
            }
            successToast(
              i18n.global.t(
                'pageServerPowerOperations.toast.successSaveSettings',
              ),
            );
          }
        } else {
          successToast(message);
        }
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          props.refetch();
          resolve(undefined);
        }, 5000);
      });
    })
    .catch(({ message }) => {
      errorToast(message);
    })
    .finally(() => {
      if (props.isUpdated) {
        emit('update-standby', props.isUpdated);
      }
      endLoader();
    });
}

watch(
  () => props.isUpdated,
  (newValue) => {
    if (newValue) {
      handleSubmit();
    }
  },
);
</script>
