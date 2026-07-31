<template>
  <BForm novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="props.attributeValues"
      :key="componentKey"
      :attribute-values="props.attributeValues"
      :disabled="props.isSavingBios"
      :is-in-phyp-standby="props.isInPhypStandby"
      :bios-attributes="props.biosAttributes"
      :hmc-managed="props.hmcManaged"
      :ibmi-load-source-value="props.ibmiLoadSourceValue"
      :ibmi-alt-load-source-value="props.ibmiAltLoadSourceValue"
      :ibmi-console-value="props.ibmiConsoleValue"
      :linux-kvm-percentage-value="props.linuxKvmPercentageValue"
      :linux-kvm-percentage-initial-value="props.linuxKvmPercentageInitialValue"
      :linux-kvm-percentage-current-value="props.linuxKvmPercentageCurrentValue"
      :is-atleast-phyp-in-standby="props.isAtleastPhypInStandby"
      :power-restore-policy="props.powerRestorePolicy"
      :location-codes="props.locationCodes"
      :save-operating-mode-settings="props.saveOperatingModeSettings"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
    />
  </BForm>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import BiosSettings from './BiosSettings.vue';
// @ts-ignore - useToastComposable is a JS module
import useToast from '@/components/Composables/useToastComposable';
// @ts-ignore - useLoadingBarComposable is a JS module
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import type { BiosAttributes } from '@/api/composables/useServerPowerOperations';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

// ─── Props & Emits ───────────────────────────────────────────────────────────

const props = defineProps<{
  isInPhypStandby?: boolean;
  isUpdated?: boolean;
  isAtleastPhypInStandby: boolean;
  // BIOS data passed from parent
  attributeValues: Record<string, Array<{ value: string; text: string }>> | null;
  biosAttributes: BiosAttributes | null;
  hmcManaged: string | null;
  ibmiLoadSourceValue: string;
  ibmiAltLoadSourceValue: string;
  ibmiConsoleValue: string;
  linuxKvmPercentageValue: number | null;
  linuxKvmPercentageInitialValue: number | null;
  linuxKvmPercentageCurrentValue: number | null;
  powerRestorePolicy: string;
  locationCodes: string[];
  // Actions passed from parent
  saveBiosSettings: (settings: BiosAttributes) => Promise<string>;
  saveOperatingModeSettings: (payload: { powerRestorePolicy: string; automaticRetryConfig: string; bootFault: string }) => Promise<void>;
  refetch: () => void;
  isSavingBios: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-standby', value: boolean): void;
}>();

// ─── Local state ─────────────────────────────────────────────────────────────

const componentKey = ref(0);
const isLinuxKvmValid = ref(true);
const localAttributeKeys = ref<BiosAttributes>({ ...props.biosAttributes });

// ─── Methods ──────────────────────────────────────────────────────────────────

function updateAttributeKeys(attributeKeysFromChild: BiosAttributes): void {
  localAttributeKeys.value = attributeKeysFromChild;
}

function linuxKvmValue(value: boolean): void {
  isLinuxKvmValid.value = value;
}

async function handleSubmit(): Promise<void> {
  startLoader();
  const biosSettings = { ...localAttributeKeys.value };
  try {
    const message = await props.saveBiosSettings(biosSettings);
    componentKey.value += 1;
    const hmcManaged = props.hmcManaged;

    if (!props.isUpdated) {
      if (biosSettings.pvm_default_os_type === 'Linux KVM') {
        successToast(
          i18n.global.t(
            'pageServerPowerOperations.toast.successSaveLinuxKvmSettings',
          ),
        );
      } else if (
        (biosSettings.pvm_default_os_type === 'IBM I' &&
          props.isAtleastPhypInStandby) ||
        (biosSettings.pvm_default_os_type === 'Default' &&
          props.isAtleastPhypInStandby)
      ) {
        if (props.isInPhypStandby) {
          if (hmcManaged !== 'Enabled') {
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
          if (hmcManaged !== 'Enabled') {
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

    // Wait 5 seconds then refetch
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        props.refetch();
        resolve();
      }, 5000);
    });
  } catch (error: any) {
    errorToast(error?.message ?? error);
  } finally {
    if (props.isUpdated) {
      emit('update-standby', props.isUpdated);
    }
    endLoader();
  }
}

// ─── Watch isUpdated prop ─────────────────────────────────────────────────────

watch(
  () => props.isUpdated,
  (newValue) => {
    if (newValue) handleSubmit();
  },
);
</script>
