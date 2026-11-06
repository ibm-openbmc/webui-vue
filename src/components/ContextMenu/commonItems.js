import i18n from '@/i18n';

const t = (key) => i18n.global.t(key);

// Shared items shown on every page. Item shape matches Global/ContextMenu.vue.
export const getCommonItems = () => [
  { key: 'selectAll', label: t('global.contextMenu.selectAll') },
  { key: 'screenshot', label: t('global.contextMenu.screenshot') },
  { divider: true, key: 'div1' },
  {
    key: 'back',
    label: t('global.contextMenu.back'),
    disabled: !window.history || window.history.length <= 1,
  },
  { key: 'reload', label: t('global.contextMenu.reload') },
  {
    key: 'savePageAs',
    label: t('global.contextMenu.savePageAs'),
    disabled: true,
  },
];

// Shared actions. `screenshot` is handled by the host (it owns the modal).
export const commonActions = {
  selectAll: () => {
    const target = document.getElementById('app') || document.body;
    window.getSelection()?.selectAllChildren(target);
  },
  back: () => window.history.back(),
  reload: () => window.location.reload(),
  // Triggers the browser's native Save / Print dialog -
  // the only cross-browser way to let users save a page.
  savePageAs: () => window.print(),
};
