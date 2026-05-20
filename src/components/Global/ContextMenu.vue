<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="menuStyle"
      @contextmenu.prevent
    >
      <ul class="context-menu__list" role="menu">
        <li
          v-for="item in menuItems"
          :key="item.id"
          class="context-menu__item"
          :class="{
            'context-menu__item--disabled': item.disabled,
            'context-menu__item--divider': item.divider,
            'context-menu__item--has-submenu': item.submenu,
          }"
          role="menuitem"
          :aria-disabled="item.disabled"
          @click="handleItemClick(item)"
          @mouseenter="handleItemHover(item)"
          @mouseleave="handleItemLeave(item)"
        >
          <template v-if="!item.divider">
            <component
              :is="item.icon"
              v-if="item.icon"
              class="context-menu__icon"
              :size="16"
            />
            <span class="context-menu__label">{{ item.label }}</span>
            <span v-if="item.shortcut" class="context-menu__shortcut">
              {{ item.shortcut }}
            </span>
            <icon-chevron-right
              v-if="item.submenu"
              class="context-menu__chevron"
              :size="16"
            />
            <!-- Submenu -->
            <div
              v-if="item.submenu && hoveredItem === item.id"
              class="context-menu__submenu"
              @click.stop
            >
              <ul class="context-menu__list" role="menu">
                <li
                  v-for="subitem in item.submenu"
                  :key="subitem.id"
                  class="context-menu__item"
                  :class="{
                    'context-menu__item--active': subitem.active,
                  }"
                  role="menuitem"
                  @click="handleSubmenuClick(subitem)"
                >
                  <component
                    :is="subitem.icon"
                    v-if="subitem.icon"
                    class="context-menu__icon"
                    :size="16"
                  />
                  <span class="context-menu__label">{{ subitem.label }}</span>
                  <icon-checkmark
                    v-if="subitem.active"
                    class="context-menu__checkmark"
                    :size="16"
                  />
                </li>
              </ul>
            </div>
          </template>
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import IconCut from '@carbon/icons-vue/es/cut/16';
import IconCopy from '@carbon/icons-vue/es/copy/16';
import IconPaste from '@carbon/icons-vue/es/paste/16';
import IconSelectAll from '@carbon/icons-vue/es/select--01/16';
import IconCamera from '@carbon/icons-vue/es/camera/16';
import IconInspect from '@carbon/icons-vue/es/search/16';
import IconTheme from '@carbon/icons-vue/es/color-palette/16';
import IconLightMode from '@carbon/icons-vue/es/light/16';
import IconDarkMode from '@carbon/icons-vue/es/moon/16';
import IconChevronRight from '@carbon/icons-vue/es/chevron--right/16';
import IconCheckmark from '@carbon/icons-vue/es/checkmark/16';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  x: {
    type: Number,
    default: 0,
  },
  y: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(['close', 'action']);

const menuRef = ref(null);
const hoveredItem = ref(null);
const currentTheme = ref('light'); // Track current theme

const menuItems = computed(() => [
  {
    id: 'cut',
    label: 'Cut',
    icon: IconCut,
    shortcut: '⌘X',
    action: 'cut',
    disabled: !canCut.value,
  },
  {
    id: 'copy',
    label: 'Copy',
    icon: IconCopy,
    shortcut: '⌘C',
    action: 'copy',
    disabled: !canCopy.value,
  },
  {
    id: 'paste',
    label: 'Paste',
    icon: IconPaste,
    shortcut: '⌘V',
    action: 'paste',
    disabled: !canPaste.value,
  },
  {
    id: 'divider-1',
    divider: true,
  },
  {
    id: 'select-all',
    label: 'Select All',
    icon: IconSelectAll,
    shortcut: '⌘A',
    action: 'selectAll',
    disabled: false,
  },
  {
    id: 'divider-2',
    divider: true,
  },
  {
    id: 'screenshot',
    label: 'Take Screenshot',
    icon: IconCamera,
    action: 'screenshot',
    disabled: false,
  },
  {
    id: 'inspect',
    label: 'Inspect',
    icon: IconInspect,
    shortcut: '⌘⇧C',
    action: 'inspect',
    disabled: false,
  },
  {
    id: 'divider-3',
    divider: true,
  },
  {
    id: 'themes',
    label: 'Themes',
    icon: IconTheme,
    disabled: false,
    submenu: [
      {
        id: 'light-mode',
        label: 'Light Mode (Default)',
        icon: IconLightMode,
        action: 'theme-light',
        active: currentTheme.value === 'light',
      },
      {
        id: 'dark-mode',
        label: 'Dark Mode',
        icon: IconDarkMode,
        action: 'theme-dark',
        active: currentTheme.value === 'dark',
      },
    ],
  },
]);

const canCut = ref(false);
const canCopy = ref(false);
const canPaste = ref(true);

const menuStyle = computed(() => {
  if (!props.visible) return {};

  const style = {
    left: `${props.x}px`,
    top: `${props.y}px`,
  };

  return style;
});

// Check if text is selected
const updateClipboardState = () => {
  const selection = window.getSelection();
  const hasSelection = selection && selection.toString().length > 0;
  canCut.value = hasSelection;
  canCopy.value = hasSelection;
};

// Handle menu item hover
const handleItemHover = (item) => {
  if (item.submenu && !item.disabled) {
    hoveredItem.value = item.id;
  }
};

const handleItemLeave = (item) => {
  // Don't clear immediately to allow moving to submenu
  setTimeout(() => {
    if (hoveredItem.value === item.id) {
      hoveredItem.value = null;
    }
  }, 100);
};

// Handle menu item click
const handleItemClick = (item) => {
  if (item.disabled || item.divider || item.submenu) return;

  emit('action', item.action);
  emit('close');
};

// Handle submenu item click
const handleSubmenuClick = (subitem) => {
  if (subitem.action) {
    // Update current theme
    if (subitem.action === 'theme-light') {
      currentTheme.value = 'light';
    } else if (subitem.action === 'theme-dark') {
      currentTheme.value = 'dark';
    }

    emit('action', subitem.action);
    emit('close');
  }
};

// Handle click outside
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    emit('close');
  }
};

// Handle escape key
const handleEscape = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// Adjust menu position if it goes off screen
const adjustMenuPosition = () => {
  if (!menuRef.value) return;

  const menu = menuRef.value;
  const rect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let { x, y } = props;

  // Adjust horizontal position
  if (rect.right > viewportWidth) {
    x = viewportWidth - rect.width - 8;
  }

  // Adjust vertical position
  if (rect.bottom > viewportHeight) {
    y = viewportHeight - rect.height - 8;
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
};

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // Reset submenu state when menu opens
      hoveredItem.value = null;
      // Sync current theme from localStorage or document attribute
      const savedTheme =
        localStorage.getItem('theme') ||
        document.documentElement.getAttribute('data-theme') ||
        'light';
      currentTheme.value = savedTheme;
      updateClipboardState();
      setTimeout(adjustMenuPosition, 0);
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    } else {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    }
  },
);

onMounted(() => {
  // Initialize current theme from localStorage or document attribute
  const savedTheme =
    localStorage.getItem('theme') ||
    document.documentElement.getAttribute('data-theme') ||
    'light';
  currentTheme.value = savedTheme;
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style lang="scss" scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.3),
    0 0 1px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  border-radius: 0;
  padding: 0;
  animation: fadeIn 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background-color 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
    color: #161616;
    font-size: 0.875rem;
    line-height: 1.125rem;
    font-weight: 400;
    position: relative;

    &:hover:not(&--disabled):not(&--divider) {
      background-color: #e5e5e5;
    }

    &:focus:not(&--disabled):not(&--divider) {
      outline: 2px solid #0f62fe;
      outline-offset: -2px;
    }

    &--disabled {
      color: #c6c6c6;
      cursor: not-allowed;
      pointer-events: none;

      .context-menu__icon {
        fill: #c6c6c6;
      }
    }

    &--divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 0.25rem 0;
      padding: 0;
      cursor: default;
      pointer-events: none;
    }
  }

  &__icon {
    margin-right: 0.75rem;
    flex-shrink: 0;
    fill: #161616;
  }

  &__label {
    flex: 1;
    white-space: nowrap;
  }

  &__shortcut {
    margin-left: 1rem;
    color: #6f6f6f;
    font-size: 0.75rem;
    font-family: 'IBM Plex Mono', 'Menlo', 'DejaVu Sans Mono', monospace;
  }

  &__chevron {
    margin-left: auto;
    fill: #6f6f6f;
  }

  &__checkmark {
    margin-left: auto;
    fill: #0f62fe;
  }

  &__submenu {
    position: absolute;
    left: 100%;
    top: -1px;
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.3),
      0 0 1px rgba(0, 0, 0, 0.1);
    min-width: 200px;
    animation: fadeIn 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
    z-index: 10000;
  }

  &__item--has-submenu {
    position: relative;
  }

  &__item--active {
    background-color: #e5e5e5;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Dark theme support (optional)
@media (prefers-color-scheme: dark) {
  .context-menu {
    background-color: #262626;
    border-color: #393939;

    &__submenu {
      background-color: #262626;
      border-color: #393939;
    }

    &__item {
      color: #f4f4f4;

      &:hover:not(&--disabled):not(&--divider) {
        background-color: #393939;
      }

      &--disabled {
        color: #6f6f6f;

        .context-menu__icon {
          fill: #6f6f6f;
        }
      }

      &--divider {
        background-color: #393939;
      }
    }

    &__icon {
      fill: #f4f4f4;
    }

    &__shortcut {
      color: #c6c6c6;
    }
  }
}
</style>
