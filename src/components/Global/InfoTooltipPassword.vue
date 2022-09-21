<template>
  <span>
    <b-button
      id="tooltip-password"
      variant="link"
      class="btn-tooltip btn-icon-only"
    >
      <slot>
        <icon-tooltip />
      </slot>
      <span class="sr-only">{{ $t('global.ariaLabel.tooltip') }}</span>
    </b-button>
    <b-tooltip target="tooltip-password" triggers="hover">
      <p class="text-left">
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
    </b-tooltip>
  </span>
</template>

<script>
import IconTooltip from '@carbon/icons-vue/es/information/16';

export default {
  components: { IconTooltip },
  props: {
    title: {
      type: String,
      default: '',
    },
  },
};
</script>

<style lang="scss" scoped>
.btn-tooltip {
  padding: 0;
  line-height: 1em;
  svg {
    vertical-align: baseline;
  }
}
</style>
