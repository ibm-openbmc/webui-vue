<template>
  <div class="app-container">
    <app-header
      ref="focusTarget"
      class="app-header"
      :router-key="routerKey"
      @refresh="refresh"
    />
    <app-navigation class="app-navigation" />
    <page-container class="app-content" @contextmenu="handleContextMenu">
      <router-view ref="routerView" :key="routerKey" />
      <!-- Scroll to top button -->
      <button-back-to-top />
    </page-container>
    <!-- Context Menu -->
    <context-menu
      :visible="contextMenu.visible.value"
      :x="contextMenu.x.value"
      :y="contextMenu.y.value"
      @close="contextMenu.hide"
      @action="contextMenu.handleAction"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import AppHeader from '@/components/AppHeader/AppHeader.vue';
import AppNavigation from '@/components/AppNavigation/AppNavigation.vue';
import PageContainer from '@/components/Global/PageContainer.vue';
import ButtonBackToTop from '@/components/Global/ButtonBackToTop.vue';
import ContextMenu from '@/components/Global/ContextMenu.vue';
import useJumpLinkComposable from '@/components/Composables/useJumpLinkComposable';
import { useContextMenu } from '@/components/Composables/useContextMenu';
import stores from '@/store';
import { useRoute } from 'vue-router';
import eventBus from '@/eventBus';

const { setFocus } = useJumpLinkComposable();
const contextMenu = useContextMenu();

const global = stores.GlobalStore();

const route = useRoute();

const routerKey = ref(0);
const focusTarget = ref(null);

watch(route, () => {
  nextTick(() => {
    setFocus(focusTarget.value.$el);
  });
});

onMounted(() => {
  eventBus.on('refresh-application', () => refresh());
});

const refresh = () => {
  global.getSystemInfo();
  // Changing the component :key value will trigger
  // a component re-rendering and 'refresh' the view
  routerKey.value += 1;
};

const handleContextMenu = (event) => {
  contextMenu.show(event);
};
</script>

<style lang="scss" scoped>
.app-container {
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: auto;
  grid-template-areas:
    'header'
    'content';

  @include media-breakpoint-up($responsive-layout-bp) {
    grid-template-columns: $navigation-width 1fr;
    grid-template-areas:
      'header header'
      'navigation content';
  }
}

.app-header {
  grid-area: header;
  position: sticky;
  top: 0;
  z-index: $zindex-fixed + 1;
}

.app-navigation {
  grid-area: navigation;
}

.app-content {
  grid-area: content;
  background-color: $white;
}
</style>
