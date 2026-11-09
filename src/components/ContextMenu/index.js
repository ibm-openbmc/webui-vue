import ContextMenuHost from './ContextMenuHost.vue';
import useContextMenu from './useContextMenu';

// Public entry point of the central context menu module.
//
// Host: mount <context-menu-host /> once (AppLayout).
//
// Adding items for a page - call useContextMenu() from the page's setup():
//   useContextMenu({
//     items: computed(() => [{ key: 'myAction', label: t('...') }]),
//     handlers: { myAction: () => doSomething() },
//   });
// Page items are appended after the common items (separated by a divider)
// and are removed when the page unmounts. An item whose key matches a common
// item (selectAll, screenshot, back, reload, savePageAs) replaces it.
//
// Native menu instead of the custom one for a page: set the flag on the route
//   { path: '...', name: '...', component: ..., meta: { customContextMenu: false } }
// NOTE: routes are resolved per build target (vite alias './routes' ->
// src/env/router/<VITE_APP_ENV_NAME>.js), so set the flag in the env router
// file(s) in use (src/env/router/ibm.js, intel.js), not only src/router/routes.js.
// (The left navigation always uses the native menu; the header keeps its own.)
//
// Common items:  ./commonItems.js     Header menu: ./headerItems.js

export { ContextMenuHost, useContextMenu };
