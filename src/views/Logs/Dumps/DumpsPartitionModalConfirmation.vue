<template>
  <BModal
    v-model="modal"
    id="modal-partition-dump-confirmation"
    ref="modal"
    :title="
      selected === 'partition'
        ? $t('pageDumps.modal.initiatePartitionDump')
        : $t('pageDumps.modal.initiateRetryPartitionDump')
    "
    @show="resetForm"
  >
    <p>
      <strong>
        {{ $t('pageDumps.modal.initiateSystemDumpMessage1') }}
      </strong>
    </p>
    <p>
      <status-icon status="danger" />
      {{ $t('pageDumps.modal.initiatePartitionDumpMessage1') }}
    </p>
    <BFormCheckbox v-model="confirmed" @update:modelValue="v$.confirmed.$touch()">
      {{ $t('pageDumps.modal.initiatePartitionDumpMessage2') }}
    </BFormCheckbox>
    <BFormInvalidFeedback
      :state="getValidationState(v$.confirmed)"
      role="alert"
    >
      {{ $t('global.form.required') }}
    </BFormInvalidFeedback>
    <template #footer="{ cancel }">
      <BButton variant="secondary" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </BButton>
      <BButton variant="danger" @click="handleSubmit()">
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

const emit = defineEmits(['ok']);

const { getValidationState } = useVuelidateComposable();

defineProps({
    selected: {
      type: String,
      required: true,
    },
  });

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
      modal.value=false;
      eventBus.emit('partition-modal-close');
    };
const handleSubmit = () => {
      v$.value.$touch();
      if (v$.value.$invalid) return;
      emit('ok');
      closeModal();
    };
const resetForm = () => {
      confirmed.value = false;
      v$.value.$reset();
    };

</script>