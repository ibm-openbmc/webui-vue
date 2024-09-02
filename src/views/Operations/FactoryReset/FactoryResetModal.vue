<template>
  <BModal
    id="modal-reset"
    ref="modal"
    :title="$t(`pageFactoryReset.modal.${resetType}Title`)"
    title-tag="h2"
    :ok-title="$t(`pageFactoryReset.modal.${resetType}SubmitText`)"
    @ok="handleConfirm"
    @hidden="resetConfirm"
  >
    <p class="mb-2">
      <strong>{{ $t(`pageFactoryReset.modal.${resetType}Header`) }}</strong>
    </p>
    <ul class="pl-3 mb-4">
      <li
        v-for="(item, index) in Object.keys(
          factoryResetMessage[`${resetType}SettingsList`],
        )"
        :key="index"
        class="mt-1 mb-1"
      >
        {{ $t(`pageFactoryReset.modal.${resetType}SettingsList.${item}`) }}
      </li>
    </ul>

    <!-- Warning message -->
    <template v-if="!isServerOff">
      <p class="d-flex mb-2">
        <status-icon status="danger" />
        <span id="reset-to-default-warning" class="ml-1">
          {{ $t(`pageFactoryReset.modal.resetWarningMessage`) }}
        </span>
      </p>
      <BFormCheckbox
        v-model="confirm"
        aria-describedby="reset-to-default-warning"
        @input="$v.confirm.$touch()"
      >
        {{ $t(`pageFactoryReset.modal.resetWarningCheckLabel`) }}
      </BFormCheckbox>
      <BFormInvalidFeedback
        role="alert"
        :state="getValidationState(v$.confirm)"
      >
        {{ $t('global.form.fieldRequired') }}
      </BFormInvalidFeedback>
    </template>
  </BModal>
</template>

<script setup>
import { computed, defineProps, ref, defineEmits } from 'vue';
import { GlobalStore } from '@/store';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import i18n from '@/i18n';
import eventBus from '@/eventBus';

const messagesEn = i18n.global.getLocaleMessage('en-US');
const factoryResetMessage = messagesEn?.pageFactoryReset?.modal;
const { getValidationState } = useVuelidateComposable();
const global = GlobalStore();
defineProps({
  resetType: {
    type: String,
    default: null,
  },
});
const modal = ref(null);
eventBus.on('modal-reset', () => {
  modal.value.show();
});
const confirm = ref(false);
const serverStatus = computed(() => global.serverStatus);
const isServerOff = computed(() =>
  serverStatus.value === 'off' ? true : false,
);
const rules = {
  confirm: {
    mustBeTrue: (value) => isServerOff.value || value === true,
  },
};
const v$ = useVuelidate(rules, { confirm });
const emit = defineEmits(['okConfirm']);

const handleConfirm = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('okConfirm');
  resetConfirm();
};
function resetConfirm() {
  confirm.value = false;
  v$.value.$reset();
}
</script>
