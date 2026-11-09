import { shallowReactive, toValue } from 'vue';

// Extras registered by the pages that are currently mounted.
// Each entry: { items, handlers }
//   items    - array, ref or getter returning menu items
//              ({ key, label, disabled?, divider?, hint?, icon? })
//   handlers - object (or ref/getter) mapping item key -> function
const entries = shallowReactive([]);

export const registerPageItems = (entry) => {
  entries.push(entry);
  return () => {
    const index = entries.indexOf(entry);
    if (index !== -1) entries.splice(index, 1);
  };
};

// Appends the registered page items after the common items, separated by a
// divider. A page item whose key matches a common item replaces that common
// item in place instead of being appended.
export const mergeWithPageItems = (commonItems) => {
  const extras = entries.flatMap((entry) => toValue(entry.items) || []);
  if (!extras.length) return commonItems;

  const commonKeys = new Set(commonItems.map((item) => item.key));
  const overrides = new Map();
  const additions = [];
  extras.forEach((item) => {
    if (commonKeys.has(item.key)) overrides.set(item.key, item);
    else additions.push(item);
  });

  const merged = commonItems.map((item) => overrides.get(item.key) ?? item);
  if (!additions.length) return merged;
  return [...merged, { divider: true, key: 'div-page' }, ...additions];
};

// Returns the handler registered by a page for the key, if any.
// Page handlers take priority over the common actions.
export const getPageHandler = (key) => {
  for (let i = entries.length - 1; i >= 0; i--) {
    const handler = toValue(entries[i].handlers)?.[key];
    if (handler) return handler;
  }
  return undefined;
};
