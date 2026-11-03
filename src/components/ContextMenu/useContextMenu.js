import { onMounted, onBeforeUnmount } from 'vue';
import { registerPageItems } from './contextMenuRegistry';

// Registers page specific context menu items while the calling component is
// mounted. Call it from setup().
//   items    - array, ref or getter returning menu items
//   handlers - object mapping item key -> function
// A page item with the same key as a common item replaces the common item.
const useContextMenu = ({ items = [], handlers = {} } = {}) => {
  let unregister;
  onMounted(() => {
    unregister = registerPageItems({ items, handlers });
  });
  onBeforeUnmount(() => {
    unregister?.();
  });
};

export default useContextMenu;
