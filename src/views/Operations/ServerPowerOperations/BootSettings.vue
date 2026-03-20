<template>
  <BForm novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="form.attributes && form.attributeValues"
      :attribute-values="form.attributeValues"
      :disabled="disabled"
      :is-in-phyp-standby="isInPhypStandby"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
    />
  </BForm>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import BiosSettings from './BiosSettings.vue';
import useToast from '@/components/Composables/useToastComposable';
import stores from '@/store';
import { useServerPowerOperations } from '@/api/composables/useServerPowerOperations';

const { successToast, infoToast, errorToast } = useToast();

const globalStore = stores.GlobalStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

// Use the new composable
const {
  biosAttributes,
  attributeValues,
  saveSettings,
  isSavingBios,
  refetchBios,
  refetchBiosRegistry,
} = useServerPowerOperations();

const props = defineProps({
  isInPhypStandby: {
    type: Boolean,
    default: false,
  },
  isUpdated: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits('update-standby');

const isLinuxKvmValid = ref(true);
const isSaving = ref(false);
const form = ref({
  attributes: biosAttributes.value,
  attributeValues: attributeValues.value,
});

onBeforeMount(() => {
  Promise.all([refetchBios(), refetchBiosRegistry()]).finally(() => {
    eventBus.emit('server-power-operations-boot-settings-complete');
  });
});

const disabled = computed(() => {
  return isSavingBios.value;
});

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

// Only update form values from composable if not currently saving
watch(attributeValues, function (value) {
  if (!isSaving.value && value) {
    form.value.attributeValues = value;
  }
});

watch(biosAttributes, function (value) {
  if (!isSaving.value && value) {
    form.value.attributes = value;
  }
});

watch(
  () => props.isUpdated,
  (newValue) => {
    if (newValue) {
      handleSubmit();
    }
  },
);

function updateAttributeKeys(attributeKeys) {
  form.value.attributes = attributeKeys;
}

function linuxKvmValue(value) {
  isLinuxKvmValid.value = value;
}

function handleSubmit() {
  isSaving.value = true;
  let settings;
  let biosSettings = form.value.attributes;
  settings = { biosSettings };

  saveSettings(settings)
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
          Promise.all([refetchBios(), refetchBiosRegistry()])
            .catch((error) => console.log(error))
            .finally(() => {
              isSaving.value = false;
              resolve();
            });
        }, 5000);
      });
    })
    .catch(({ message }) => {
      errorToast(message);
      isSaving.value = false;
    })
    .finally(() => {
      if (props.isUpdated) {
        emit('update-standby', props.isUpdated);
      }
    });
}
</script>
