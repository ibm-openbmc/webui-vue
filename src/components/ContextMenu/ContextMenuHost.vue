<template>
  <!-- Single right-click context menu for the authenticated app -->
  <context-menu ref="contextMenuRef" :items="items" @action="onAction" />

  <!-- Screenshot preview modal -->
  <BModal
    v-model="screenshotModalOpen"
    :title="$t('global.contextMenu.screenshotTitle')"
    ok-only
    :ok-title="$t('global.contextMenu.screenshotDownload')"
    size="xl"
    @ok="downloadScreenshot"
  >
    <img
      v-if="screenshotDataUrl"
      :src="screenshotDataUrl"
      alt="Page screenshot"
      style="width: 100%; height: auto"
    />
  </BModal>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import ContextMenu from '@/components/Global/ContextMenu.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import { getCommonItems, commonActions } from './commonItems';
import { getHeaderItems, headerActions } from './headerItems';
import { mergeWithPageItems, getPageHandler } from './contextMenuRegistry';

// Right-clicks inside these areas keep the native browser menu
const NATIVE_MENU_SELECTOR = '.app-navigation';
const HEADER_SELECTOR = '.app-header';

const { t } = useI18n();
const route = useRoute();
const toast = useToastComposable();

const contextMenuRef = ref(null);
const zone = ref('page');
const openCount = ref(0);
const screenshotModalOpen = ref(false);
const screenshotDataUrl = ref(null);

// openCount forces a recompute on every open, so non-reactive state such as
// window.history.length is read fresh.
const items = computed(() => {
  openCount.value;
  return zone.value === 'header'
    ? getHeaderItems()
    : mergeWithPageItems(getCommonItems());
});

const onContextMenu = (event) => {
  if (event.target.closest?.(NATIVE_MENU_SELECTOR)) return;
  zone.value = event.target.closest?.(HEADER_SELECTOR) ? 'header' : 'page';
  // A route can opt out with `meta: { customContextMenu: false }` (see
  // router/routes.js) to keep the native browser menu in the page area.
  if (zone.value === 'page' && route.meta?.customContextMenu === false) return;
  openCount.value++;
  event.preventDefault();
  contextMenuRef.value?.open(event);
};

onMounted(() => document.addEventListener('contextmenu', onContextMenu));
onBeforeUnmount(() =>
  document.removeEventListener('contextmenu', onContextMenu),
);

const onAction = async (key) => {
  if (key === 'screenshot' && !getPageHandler(key)) {
    await captureScreenshot();
    return;
  }
  const handler =
    zone.value === 'header'
      ? (headerActions[key] ?? commonActions[key])
      : (getPageHandler(key) ?? commonActions[key]);
  await handler?.();
};

const captureScreenshot = async () => {
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(document.body, { useCORS: true });
    screenshotDataUrl.value = canvas.toDataURL('image/png');
    screenshotModalOpen.value = true;
  } catch {
    toast.infoToast(t('global.contextMenu.screenshotUnavailable'));
  }
};

const downloadScreenshot = () => {
  if (!screenshotDataUrl.value) return;
  const a = document.createElement('a');
  a.href = screenshotDataUrl.value;
  a.download = `${String(route.name || 'page')}-screenshot-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, '-')}.png`;
  a.click();
};
</script>
