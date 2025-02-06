<template>
  <BForm novalidate @submit.prevent="handleSubmit">
    <bios-settings
      v-if="form.attributes && form.attributeValues"
      :key="componentKey"
      :attribute-values="form.attributeValues"
      :disabled="disabled"
      :is-in-phyp-standby="isInPhypStandby"
      @is-linux-kvm-valid="linuxKvmValue"
      @updated-attributes="updateAttributeKeys"
    />
    <BButton
      variant="primary"
      type="submit"
      class="mb-3"
      :disabled="
        !isLinuxKvmValid
          ? form.attributes.pvm_default_os_type === 'Linux KVM'
            ? true
            : false
          : false
      "
    >
      {{ $t('global.action.save') }}
    </BButton>
  </BForm>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import BiosSettings from './BiosSettings.vue';
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import { GlobalStore, BootSettingsStore, ResourceMemoryStore } from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, infoToast, errorToast } = useToast();

const globalStore = GlobalStore();
const bootSettingsStore = BootSettingsStore();
const resourceMemoryStore = ResourceMemoryStore();

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

const componentKey = ref(0);
const isLinuxKvmValid = ref(true);
const form = ref({
  attributes: bootSettingsStore.getBiosAttributes,
  attributeValues: bootSettingsStore.getAttributeValues,
});

const attributeValues = computed(() => {
  return bootSettingsStore.getAttributeValues;
});

const biosAttributes = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});

const disabled = computed(() => {
  return bootSettingsStore.getDisabled;
});

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

watch(attributeValues, function (value) {
  form.value.attributeValues = value;
});

watch(biosAttributes, function (value) {
  form.value.attributes = value;
});

watch(props.isUpdated, function (newValue) {
  if (newValue) {
    handleSubmit();
  }
});

function updateAttributeKeys(attributeKeys) {
  form.value.attributes = attributeKeys;
}

function linuxKvmValue(value) {
  isLinuxKvmValid.value = value;
}

function handleSubmit() {
  startLoader();
  let settings;
  let biosSettings = form.value.attributes;
  settings = { biosSettings };
  bootSettingsStore
    .saveSettings(settings)
    .then((message) => {
      componentKey.value += 1;
      let hmcManaged = resourceMemoryStore.hmcManagedGetter;
      if (!props.isUpdated) {
        if (settings.biosSettings.pvm_default_os_type == 'Linux KVM') {
          successToast(
            i18n.global.t(
              'pageServerPowerOperations.toast.successSaveLinuxKvmSettings'
            )
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
                  'pageServerPowerOperations.toast.successSaveIBMiStandby'
                )
              );
            }
            successToast(
              i18n.global.t(
                'pageServerPowerOperations.toast.successSaveSettings'
              )
            );
          } else {
            if (hmcManaged != 'Enabled') {
              infoToast(
                i18n.global.t(
                  'pageServerPowerOperations.toast.successSaveIbmiOsRunningInfo'
                )
              );
            }
            successToast(
              i18n.global.t(
                'pageServerPowerOperations.toast.successSaveSettings'
              )
            );
          }
        } else {
          successToast(message);
        }
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          bootSettingsStore
            .fetchAttributeValues()
            .catch((error) => console.log(error))
            .finally(resolve); // Resolve the promise after the setTimeout logic
        }, 5000);
      });
    })
    .catch(({ message }) => {
      errorToast(message);
    })
    .finally(() => {
      if (props.isUpdated) {
        eventBus.emit('update-standby', props.isUpdated);
      }
      endLoader();
    });
}

onBeforeMount(() => {
  Promise.all([
    bootSettingsStore.fetchBiosAttributes(),
    bootSettingsStore.fetchAttributeValues(),
  ]).finally(() => {
    eventBus.emit('server-power-operations-boot-settings-complete');
  });
});
</script>
