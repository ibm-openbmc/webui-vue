<template>
  <div>
    <BRow class="section-divider">
      <BCol class="d-flex align-items-center justify-content-between">
        <dl class="mr-3 w-75">
          <dt id="ateral-cast-out-label">
            {{ $t('pageSystemParameters.lateralCastOut') }}
            <info-tooltip :title="$t('pageSystemParameters.parametersInfo')" />
          </dt>
          <dd id="lateral-cast-out-description">
            {{ $t('pageSystemParameters.lateralCastOutDescription') }}
          </dd>
        </dl>
        <BFormCheckbox
          id="lateral-cast-out-switch"
          v-model="systemParametersStore.lateralCastOutMode"
          aria-labelledby="lateral-cast-out-label"
          aria-describedby="lateral-cast-out-description"
          switch
          @update:modelValue="changeLateralCastOutState"
        >
          <span v-if="lateralCastOutModeState">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </BFormCheckbox>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import stores from '@/store';
import { computed, defineProps } from 'vue';
import useToastComposable from '@/components/Composables/useToastComposable';
const systemParametersStore = stores.SystemParametersStore();
const Toast = useToastComposable();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});
const lateralCastOutModeState = computed({
  get() {
    return systemParametersStore.lateralCastOutModeGetter;
  },
  set(newValue) {
    return newValue;
  },
});

const changeLateralCastOutState = (state) => {
  systemParametersStore
    .saveLateralCastOutMode(state)
    .then((message) => Toast.successToast(message))
    .catch(({ message }) => Toast.errorToast(message));
};
</script>
