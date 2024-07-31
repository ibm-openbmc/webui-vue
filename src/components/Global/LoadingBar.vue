<template>
  <BTransition name="fade">
    <BProgress v-if="!isLoadingComplete">
      <BProgressBar
        :value="loadingIndicatorValue"
        aria-label="Loading Progress"
        animated
      />
    </BProgress>
  </BTransition>
</template>

<script setup>
import { ref, onBeforeMount } from 'vue';
import eventBus from '@/eventBus';

const loadingIndicatorValue = ref(0);
const isLoadingComplete = ref(false);
const loadingIntervalId = ref(null);
const timeoutId = ref(null);

onBeforeMount(() => {
  eventBus.on('loader-start', () => {
    startLoadingInterval();
  });
  eventBus.on('loader-end', () => {
    endLoadingInterval();
  });
  eventBus.on('loader-hide', () => {
    hideLoadingBar();
  });
});

const clearLoadingInterval = () => {
  if (loadingIntervalId.value) clearInterval(loadingIntervalId.value);
  loadingIntervalId.value = null;
};

const clearLoadingTimeout = () => {
  if (timeoutId.value) clearTimeout(timeoutId.value);
  timeoutId.value = null;
};

const startLoadingInterval = () => {
  clearLoadingInterval();
  clearLoadingTimeout();
  loadingIndicatorValue.value = 0;
  isLoadingComplete.value = false;
  eventBus.emit('checkLoadingStatus', isLoadingComplete.value);
  loadingIntervalId.value = setInterval(() => {
    loadingIndicatorValue.value += 1;
    if (loadingIndicatorValue.value > 100) clearLoadingInterval();
  }, 100);
};

const endLoadingInterval = () => {
  clearLoadingInterval();
  clearLoadingTimeout();
  loadingIndicatorValue.value = 100;
  timeoutId.value = setTimeout(() => {
    // Let animation complete before hiding
    // the loading bar
    isLoadingComplete.value = true;
    eventBus.emit('checkLoadingStatus', isLoadingComplete.value);
  }, 1000);
};

const hideLoadingBar = () => {
  clearLoadingInterval();
  clearLoadingTimeout();
  loadingIndicatorValue.value = 0;
  isLoadingComplete.value = true;
};
</script>
<style lang="scss" scoped>
.progress {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.4rem;
  opacity: 1;
  transition: opacity $duration--moderate-01 $standard-easing--productive;
  height: 0.4rem;
  &.fade-enter-from,
  &.fade-leave-to {
    opacity: 0;
  }
}
.progress-bar {
  background-color: $loading-color;
}
</style>
