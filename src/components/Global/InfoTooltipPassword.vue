<template>
  <span>
    <BButton
      id="tooltip-password"
      variant="link"
      class="btn-tooltip btn-icon-only"
    >
      <slot>
        <icon-tooltip />
      </slot>
    </BButton>
    <BTooltip target="tooltip-password" triggers="hover">
      <p id="tooltip">
        {{ $t('global.passwordValidation.title') }}
        <br />
        {{ $t('global.passwordValidation.message1') }}
        <br />
        {{ $t('global.passwordValidation.message2') }}
        <br />
        {{ $t('global.passwordValidation.message3') }}
        <br />
        {{ $t('global.passwordValidation.message4') }}
        <br />
        {{ $t('global.passwordValidation.message5') }}
        <br />
        {{ $t('global.passwordValidation.message6') }}
        <br />
        {{ $t('global.passwordValidation.message7') }}
      </p>
    </BTooltip>
  </span>
</template>

<script setup>
import { defineProps } from 'vue';
import IconTooltip from '@carbon/icons-vue/es/information/16';

defineProps({
    title: {
      type: String,
      default: '',
    },
  })
</script>

<style lang="scss" scoped>
.btn-tooltip {
  padding: 0;
  line-height: 1em;
  svg {
    vertical-align: baseline;
  }
}
#tooltip{
  text-align: left !important;
}
</style>
