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
        @mouseleave="openSubmenu = null"
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
            :class="{
              'context-menu__item--disabled': item.disabled,
              'context-menu__item--submenu': item.children,
            }"
            role="menuitem"
            :tabindex="item.disabled ? -1 : 0"
            :aria-haspopup="item.children ? 'menu' : null"
            :aria-expanded="
              item.children ? String(openSubmenu === item.key) : null
            "
            @mouseenter="onItemEnter(item, $event)"
            @click="!item.disabled && onItemClick(item, $event)"
            @keydown.enter.self.prevent="
              !item.disabled && onItemClick(item, $event)
            "
            @keydown.space.self.prevent="
              !item.disabled && onItemClick(item, $event)
            "
            @keydown.right.self.prevent="
              item.children &&
              !item.disabled &&
              openSubmenuFor(item, $event.currentTarget, true)
            "
          >
            <component
              :is="item.icon"
              v-if="item.icon"
              class="context-menu__icon"
              aria-hidden="true"
            />
            <span>{{ item.label }}</span>
            <span
              v-if="item.children"
              class="context-menu__chevron"
              aria-hidden="true"
              >&rsaquo;</span
            >
            <!-- Submenu: opens on hover (or click / right arrow) -->
            <ul
              v-if="item.children && openSubmenu === item.key"
              class="context-menu__submenu"
              role="menu"
              :style="submenuStyle"
            >
              <li
                v-for="child in item.children"
                :key="child.key"
                class="context-menu__item"
                :class="{ 'context-menu__item--disabled': child.disabled }"
                role="menuitem"
                :tabindex="child.disabled ? -1 : 0"
                @click.stop="!child.disabled && onItemClick(child, $event)"
                @keydown.enter.prevent="
                  !child.disabled && onItemClick(child, $event)
                "
                @keydown.space.prevent="
                  !child.disabled && onItemClick(child, $event)
                "
                @keydown.left.prevent="closeSubmenuFrom($event.currentTarget)"
              >
                <span>{{ child.label }}</span>
              </li>
            </ul>
          </li>
        </template>
        <!-- Optional small note attached to the bottom right of the menu -->
        <li
          v-if="footer"
          class="context-menu__footer"
          role="presentation"
          aria-hidden="true"
        >
          <span class="context-menu__footer-text" :title="footer">
            {{ footer }}
          </span>
        </li>
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
      // Each item: { key, label, icon?, disabled?, divider?, children? }
      // children: [{ key, label, disabled? }] shows a submenu on hover.
      // Clicking a child emits its own key.
    },
    footer: {
      type: String,
      default: '',
    },
  },
  emits: ['action'],
  data() {
    return {
      visible: false,
      top: 0,
      left: 0,
      openSubmenu: null,
      submenuFlip: false,
      submenuShift: 0,
    };
  },
  computed: {
    submenuStyle() {
      return {
        top: `${-4 + this.submenuShift}px`,
        ...(this.submenuFlip ? { left: 'auto', right: '100%' } : {}),
      };
    },
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
      this.openSubmenu = null;
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

        // Focus the first focusable item once the menu is at its final
        // position, and never let the focus change scroll the page. Focusing
        // while the menu is still at top: 0 scrolls the page to the top.
        this.$nextTick(() => {
          menu.querySelector('[tabindex="0"]')?.focus({ preventScroll: true });
        });
      });
    },
    close() {
      this.visible = false;
      this.openSubmenu = null;
    },
    onItemClick(item, event) {
      // An item with children only toggles its submenu
      if (item.children) {
        this.openSubmenuFor(item, event.currentTarget);
        return;
      }
      this.$emit('action', item.key);
      this.close();
    },
    onItemEnter(item, event) {
      if (item.children && !item.disabled) {
        this.openSubmenuFor(item, event.currentTarget);
      } else {
        this.openSubmenu = null;
      }
    },
    // Opens the submenu of `item` (rendered inside `itemEl`) and keeps it
    // inside the viewport: flipped to the left when there is no room on the
    // right, shifted up when it would run past the bottom edge.
    openSubmenuFor(item, itemEl, focusFirst = false) {
      if (this.openSubmenu === item.key && !focusFirst) return;
      const MARGIN = 8;
      this.openSubmenu = item.key;
      this.submenuFlip = false;
      this.submenuShift = 0;
      this.$nextTick(() => {
        const submenu = itemEl.querySelector('.context-menu__submenu');
        if (!submenu) return;
        const rect = submenu.getBoundingClientRect();
        this.submenuFlip = rect.right + MARGIN > window.innerWidth;
        const overflowBottom = rect.bottom + MARGIN - window.innerHeight;
        this.submenuShift = overflowBottom > 0 ? -overflowBottom : 0;
        if (focusFirst) {
          submenu
            .querySelector('[tabindex="0"]')
            ?.focus({ preventScroll: true });
        }
      });
    },
    // Left arrow inside a submenu: close it and return focus to its parent
    closeSubmenuFrom(childEl) {
      const parentEl = childEl.closest('.context-menu__submenu')?.parentElement;
      this.openSubmenu = null;
      parentEl?.focus({ preventScroll: true });
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
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    cursor: pointer;
    font-size: 14px;
    color: #161616;
    white-space: nowrap;
    outline: none;

    // :focus-visible, not :focus, so the item focused on open (for keyboard
    // use) is not highlighted after a mouse right-click.
    &:hover,
    &:focus-visible {
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

  &__chevron {
    margin-left: auto;
    padding-left: 16px;
    font-size: 16px;
    line-height: 1;
    color: #525252;
  }

  // Opens to the right of its parent item; flipped / shifted in JS when it
  // would leave the viewport.
  &__submenu {
    position: absolute;
    top: -4px;
    left: 100%;
    z-index: 1;
    min-width: 200px;
    padding: 4px 0;
    margin: 0;
    list-style: none;
    background: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: default;
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

  &__footer {
    // width: 0 + min-width: 100% keeps the note from widening the menu.
    // The row only positions the note; it is not styled like a menu option.
    box-sizing: border-box;
    display: flex;
    justify-content: flex-end;
    width: 0;
    min-width: 100%;
    margin-top: 4px;
    padding: 4px 8px 2px;
    cursor: default;
    user-select: none;
  }

  // Small italic tag pinned to the right end; shows only a few words and is
  // truncated with an ellipsis. The full text is available as a tooltip.
  &__footer-text {
    max-width: 130px;
    overflow: hidden;
    font-size: 10px;
    font-style: italic;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #8d8d8d;
    cursor: help;
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
