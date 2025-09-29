<template>
  <main id="main-content" ref="main" class="page-container">
    <slot />
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import useJumpLinkComposable from '@/components/Composables/useJumpLinkComposable';
import eventBus from '@/eventBus';

const { setFocus } = useJumpLinkComposable();

const main = ref(null);

onMounted(() => {
  eventBus.on('skip-navigation', () => {
    if (main.value) {
      setFocus(main.value);
    }
  });
});
</script>

<style lang="scss" scoped>
main {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  padding-top: $spacer * 1.5;
  padding-bottom: $spacer * 3;
  padding-left: $spacer;
  padding-right: $spacer;

  &:focus-visible {
    box-shadow: inset 0 0 0 2px theme-color-light($info);
    outline: none;
  }

  @include media-breakpoint-up($responsive-layout-bp) {
    padding-left: $spacer * 2;
  }
}
</style>
