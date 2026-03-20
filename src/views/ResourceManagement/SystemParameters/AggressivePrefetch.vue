<template>
  <BRow class="section-divider">
    <BCol class="d-flex align-items-center justify-content-between">
      <dl class="mt-3 mr-3 w-75">
        <dt id="aggressive-prefetch-label">
          {{ $t('pageSystemParameters.aggressivePrefetch') }}
          <info-tooltip :title="$t('pageSystemParameters.parametersInfo')" />
        </dt>
        <dd id="aggressive-prefetch-description">
          {{ $t('pageSystemParameters.aggressivePrefetchDescription') }}
        </dd>
      </dl>
      <BFormCheckbox
        id="aggressivePrefetchSwitch"
        v-model="aggressivePrefetchState"
        aria-labelledby="aggressive-prefetch-label"
        aria-describedby="aggressive-prefetch-description"
        switch
        @update:model-value="changeAggressivePrefetchState"
      >
        <span v-if="aggressivePrefetchState">
          {{ $t('global.status.enabled') }}
        </span>
        <span v-else>{{ $t('global.status.disabled') }}</span>
      </BFormCheckbox>
    </BCol>
  </BRow>
</template>

<script setup>
import { computed } from 'vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import { useSystemParameters } from '@/api/composables/useSystemParameters';
import i18n from '@/i18n';

const Toast = useToastComposable();

const { aggressivePrefetch, saveAggressivePrefetch } = useSystemParameters();

defineProps({
  safeMode: {
    type: Boolean,
    default: null,
  },
});

const aggressivePrefetchState = computed({
  get() {
    return aggressivePrefetch.value;
  },
  set(newValue) {
    return newValue;
  },
});

const changeAggressivePrefetchState = async (state) => {
  try {
    await saveAggressivePrefetch(state);
    Toast.successToast(
      i18n.global.t(
        'pageSystemParameters.toast.successSavingAggressivePrefetch',
      ),
    );
  } catch (error) {
    Toast.errorToast(
      i18n.global.t('pageSystemParameters.toast.errorSavingAggressivePrefetch'),
    );
  }
};
</script>
