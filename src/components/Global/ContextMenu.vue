<template>
  <teleport to="body">
    <transition name="context-menu-fade">
      <ul
        v-if="visible"
        ref="menuEl"
        class="context-menu"
        role="menu"
        :style="{ top: `${top}px`, left: `${left}px` }"
        @keydown.esc="close"
      >
        <template v-for="item in items" :key="item.key">
          <li
            v-if="item.divider"
            class="context-menu__divider"
            role="separator"
          />
          <!-- Non-interactive hint row: label left, shortcut badge right -->
          <li
            v-else-if="item.hint"
            class="context-menu__item context-menu__item--hint"
            role="presentation"
            aria-hidden="true"
          >
            <span class="context-menu__hint-label">{{ item.label }}</span>
            <span class="context-menu__hint-shortcut">{{ item.hint }}</span>
          </li>
          <li
            v-else
            class="context-menu__item"
            :class="{ 'context-menu__item--disabled': item.disabled }"
            role="menuitem"
            :tabindex="item.disabled ? -1 : 0"
            @click="!item.disabled && onItemClick(item)"
            @keydown.enter.prevent="!item.disabled && onItemClick(item)"
            @keydown.space.prevent="!item.disabled && onItemClick(item)"
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="context-menu__icon"
              aria-hidden="true"
            />
            <span>{{ item.label }}</span>
          </li>
        </template>
      </ul>
    </transition>
  </teleport>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    items: {
      type: Array,
      default: () => [],
      // Each item: { key, label, icon?, disabled?, divider? }
    },
  },
  emits: ['action'],
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
    };
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick);
    // Use 'mousedown' instead of 'contextmenu' to close on outside right-clicks
    // without racing with the open() call triggered by the parent.
    document.addEventListener('mousedown', this.onDocumentMousedown);
    document.addEventListener('scroll', this.close, true);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('mousedown', this.onDocumentMousedown);
    document.removeEventListener('scroll', this.close, true);
  },
  methods: {
    open(event) {
      event.preventDefault();
      // Stop the event from reaching the document mousedown listener we set up,
      // so opening does not immediately trigger a close.
      event.stopPropagation();
      this.visible = true;

      this.$nextTick(() => {
        const menu = this.$refs.menuEl;
        if (!menu) return;

        const MARGIN = 8;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const { width, height } = menu.getBoundingClientRect();

        let x = event.clientX + window.scrollX;
        let y = event.clientY + window.scrollY;

        // Clamp so the menu never overflows the viewport
        if (event.clientX + width + MARGIN > vw) {
          x = event.clientX + window.scrollX - width;
        }
        if (event.clientY + height + MARGIN > vh) {
          y = event.clientY + window.scrollY - height;
        }

        this.left = Math.max(MARGIN, x);
        this.top = Math.max(MARGIN, y);

        // Focus first focusable item
        const firstItem = menu.querySelector('[tabindex="0"]');
        firstItem?.focus();
      });
    },
    close() {
      this.visible = false;
    },
    onItemClick(item) {
      this.$emit('action', item.key);
      this.close();
    },
    onDocumentClick(event) {
      if (
        this.visible &&
        this.$refs.menuEl &&
        !this.$refs.menuEl.contains(event.target)
      ) {
        this.close();
      }
    },
    onDocumentMousedown(event) {
      // Close when the user right-clicks or left-clicks outside the menu
      if (
        this.visible &&
        this.$refs.menuEl &&
        !this.$refs.menuEl.contains(event.target)
      ) {
        this.close();
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.context-menu {
  position: absolute;
  z-index: 9999;
  min-width: 200px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &__divider {
    height: 1px;
    background: #e0e0e0;
    margin: 4px 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #161616;
    white-space: nowrap;
    outline: none;

    &:hover,
    &:focus {
      background: #e8e8e8;
    }

    &--disabled {
      color: #a8a8a8;
      cursor: not-allowed;

      &:hover,
      &:focus {
        background: transparent;
      }
    }

    &--hint {
      cursor: default;
      justify-content: space-between;
      color: #525252;

      &:hover,
      &:focus {
        background: transparent;
      }
    }
  }

  &__hint-label {
    font-size: 14px;
  }

  &__hint-shortcut {
    font-size: 12px;
    color: #8d8d8d;
    margin-left: 24px;
    white-space: nowrap;
  }

  &__icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }
}

.context-menu-fade-enter-active,
.context-menu-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}
.context-menu-fade-enter-from,
.context-menu-fade-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
</style>
