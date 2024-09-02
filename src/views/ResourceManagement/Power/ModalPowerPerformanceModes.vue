<template>
  <BModal
    id="modal-power-performance-modes"
    ref="modal"
    :title="$t(`pagePower.modalEnablePowerPerformanceMode.title${title}`)"
    :ok-title="$t(`pagePower.modalEnablePowerPerformanceMode.title${title}`)"
  >
    <p>
      <strong>
        {{ $t('pagePower.modalEnablePowerPerformanceMode.subTitle') }}
      </strong>
    </p>
    <p>{{ $t('pagePower.modalEnablePowerPerformanceMode.content') }}</p>
  </BModal>
</template>

<script setup>
import { ref } from 'vue';
import eventBus from '@/eventBus';

defineProps({
  title: {
    type: String,
    default: '',
  },
});

const modal = ref(null);

eventBus.on('modal-power-performance-modes', () => {
  modal.value.show();
});
</script>
