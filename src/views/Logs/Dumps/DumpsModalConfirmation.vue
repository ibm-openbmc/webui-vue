<template>
  <BModal
    v-model="modal"
    id="modal-confirmation"
    ref="modal"
    :title="$t('pageDumps.modal.initiateSystemDump')"
    @hidden="resetForm"
  >
    <p>
      <strong>
        {{ $t('pageDumps.modal.initiateSystemDumpMessage1') }}
      </strong>
    </p>
    <p>
      {{ $t('pageDumps.modal.initiateSystemDumpMessage2') }}
    </p>
    <p>
      <status-icon status="danger" />
      {{ $t('pageDumps.modal.initiateSystemDumpMessage3') }}
    </p>
    <BFormCheckbox v-model="confirmed" @input="v$.confirmed.$touch()">
      {{ $t('pageDumps.modal.initiateSystemDumpMessage4') }}
    </BFormCheckbox>
    <BFormInvalidFeedback
      :state="getValidationState(v$.confirmed)"
      role="alert"
    >
      {{ $t('global.form.required') }}
    </BFormInvalidFeedback>
    <template #modal-footer="{ cancel }">
      <BButton variant="secondary" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </BButton>
      <BButton variant="danger" @click="handleSubmit">
        {{ $t('pageDumps.form.initiateDump') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const confirmed = ref(false);
const modal = ref(false);

const mustBeTrue = (value) => {
  return value === true;
}

const rules = computed(() => ({
    confirmed: {
      mustBeTrue
    },
  }));
const v$ = useVuelidate(rules, { confirmed });

const closeModal = () => {
      nextTick(() => {
        modal.value=false
      });
    };
const handleSubmit = () => {
      v$.value.$touch();
      if ( v$.value.$invalid) return;
      eventBus.emit('ok');
      closeModal();
    };
const resetForm = () => {
      confirmed.value = false;
      v$.value.$reset();
};

</script>
