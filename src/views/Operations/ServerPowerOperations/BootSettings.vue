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
      :save-operating-mode-settings="props.saveOperatingModeSettings"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
    />
  </BForm>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import i18n from '@/i18n';
import BiosSettings from './BiosSettings.vue';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import stores from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

const props = defineProps({
  isInPhypStandby: {
    type: Boolean,
    default: false,
  },
  isUpdated: {
    type: Boolean,
    default: false,
  },
  attributeValues: {
    type: Object,
    default: null,
  },
  biosAttributes: {
    type: Object,
    default: null,
  },
  ibmiLoadSourceValue: {
    type: String,
    default: '',
  },
  ibmiAltLoadSourceValue: {
    type: String,
    default: '',
  },
  ibmiConsoleValue: {
    type: String,
    default: '',
  },
  linuxKvmPercentageValue: {
    type: Number,
    default: null,
  },
  linuxKvmPercentageInitialValue: {
    type: Number,
    default: null,
  },
  linuxKvmPercentageCurrentValue: {
    type: Number,
    default: null,
  },
  powerRestorePolicy: {
    type: String,
    default: '',
  },
  locationCodes: {
    type: Array,
    default: () => [],
  },
  saveBiosSettings: {
    type: Function,
    required: true,
  },
  saveOperatingModeSettings: {
    type: Function,
    required: true,
  },
  refetch: {
    type: Function,
    required: true,
  },
  isSavingBios: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update-standby']);

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

const componentKey = ref(0);
const isLinuxKvmValid = ref(true);
const localAttributeKeys = ref({ ...props.biosAttributes });

function updateAttributeKeys(attributeKeys) {
  localAttributeKeys.value = attributeKeys;
}

function linuxKvmValue(value) {
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
