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
          v-model="lateralCastOutModeState"
          aria-labelledby="lateral-cast-out-switch"
          aria-describedby="lateral-cast-out-description"
          switch
          @update:model-value="changeLateralCastOutState"
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
import { computed } from 'vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import { useSystemParameters } from '@/api/composables/useSystemParameters';
import i18n from '@/i18n';

const Toast = useToastComposable();

const { lateralCastOutMode, saveLateralCastOutMode } = useSystemParameters();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const lateralCastOutModeState = computed({
  get() {
    return lateralCastOutMode.value;
  },
  set(newValue) {
    return newValue;
  },
});

const changeLateralCastOutState = async (state) => {
  try {
    await saveLateralCastOutMode(state);
    Toast.successToast(
      i18n.global.t('pageSystemParameters.toast.successSavingLateralCastOut'),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingLateralCastOut'),
    );
  }
};
</script>
