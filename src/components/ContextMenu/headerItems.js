import { getCommonItems } from './commonItems';

// Context menu shown when right-clicking inside the header (`.app-header`).
// The header menu is independent of the page and of the page extras.
// PLACEHOLDER: currently the common items. Replace with the header specific
// items once chosen, and add their labels under `global.contextMenu.header.*`.
export const getHeaderItems = () => getCommonItems();

// Header specific handlers, keyed by item key. Keys not listed here fall back
// to the common actions in the host.
export const headerActions = {};
