<template>
  <div
    v-if="(modelType !== '--' && hmcMangedInfo !== null) || loadingCompleted"
  >
    <div class="nav-container" :class="{ open: isNavigationOpen }">
      <nav ref="nav" :aria-label="$t('appNavigation.primaryNavigation')">
        <BNav vertical class="mb-4">
          <template v-for="(navItem, index) in navigationItems">
            <!-- Navigation items with no children -->
            <BNavItem
              v-if="!navItem.children"
              :key="index"
              :to="navItem.route"
              :data-test-id="`nav-item-${navItem.id}`"
              class="nav-nochild"
            >
              <component :is="navItem.icon" />
              {{ navItem.label }}
            </BNavItem>

            <!-- Navigation items with children -->
            <li v-else :key="`${navItem.id}`" class="nav-item">
              <BButton
                v-b-toggle="`${navItem.id}`"
                variant="link"
                :data-test-id="`nav-button-${navItem.id}`"
              >
                <component :is="navItem.icon" />
                {{ navItem.label }}
                <icon-chevron-up class="icon-expand" />
              </BButton>
              <BCollapse :id="navItem.id" class="nav-item__nav">
                <li>
                  <router-link
                    v-for="(subNavItem, i) of navItem.children"
                    :key="i"
                    :to="subNavItem.route"
                    :data-test-id="`nav-item-${subNavItem.id}`"
                    class="nav-link"
                  >
                    {{ subNavItem.label }}
                  </router-link>
                </li>
              </BCollapse>
            </li>
          </template>
        </BNav>
      </nav>
    </div>
    <transition name="fade">
      <div
        v-if="isNavigationOpen"
        id="nav-overlay"
        class="nav-overlay"
        @click="toggleIsOpen"
      ></div>
    </transition>
  </div>
</template>

<script setup>
//Do not change Mixin import.
//Exact match alias set to support
//dotenv customizations.
import { ref, watch, onMounted, computed } from 'vue';
import AppNavigationData from './AppNavigationData';
import { useRoute } from 'vue-router';
import IconChevronUp from '@carbon/icons-vue/es/chevron--up/16';
import { GlobalStore, UserManagementStore } from '@/store';
import eventBus from '@/eventBus';

const navigationItems = AppNavigationData().navigationItems;
const globalStore = GlobalStore();
const userManagementStore = UserManagementStore();
  const isNavigationOpen = ref(false);
  const loadingCompleted = ref(false);
  const route = useRoute();

  const modelType = computed(() => {
    return globalStore.modelTypeGetter;
  });
  const hmcMangedInfo = computed(() => {
    return globalStore.hmcManagedGetter;
  });
  const currentUser = computed(() => {
    return globalStore.currentUserGetter;
  });
  watch(route, () => {
    isNavigationOpen.value = false;
  });
  watch(isNavigationOpen, () => {
    eventBus.emit('change-is-navigation-open', isNavigationOpen.value);
  });
  onMounted(() => {
    eventBus.on('loading-bar-status', (value) => {
      loadingCompleted.value = value;
    });
    eventBus.on('toggle-navigation', toggleIsOpen);
  });
  const checkForUserData = () => {
      if (!currentUser.value) {
        userManagementStore.getUsers();
        globalStore.getCurrentUser();
      }
    };
  const toggleIsOpen = () => {
      isNavigationOpen.value = !isNavigationOpen.value;
  };
</script>

<style scoped lang="scss">
svg {
  fill: currentColor;
  height: 1.2rem;
  width: 1.2rem;
  margin-left: 0 !important; //!important overriding button specificity
  vertical-align: text-bottom;
  &:not(.icon-expand) {
    margin-right: $spacer;
  }
}

.nav {
  padding-top: 4px;
  // @include media-breakpoint-up($responsive-layout-bp) {
  padding-top: $spacer;
  // }
}

.nav-item__nav {
  list-style: none;
  padding-left: 0;
  margin-left: 0;

  .nav-item {
    outline: none;
  }

  .nav-link {
    padding-left: $spacer * 4;
    outline: none;

    &:not(.nav-link--current) {
      font-weight: normal;
    }
  }
}
.pad-left {
  padding-left: 0;
}
.btn-link {
  display: inline-block;
  width: 100%;
  text-align: left;
  text-decoration: none !important;
  border-radius: 0;

  &.collapsed {
    .icon-expand {
      transform: rotate(180deg);
    }
  }
}

.icon-expand {
  float: right;
  margin-top: math.div($spacer, 4);
}

.btn-link,
.nav-link {
  position: relative;
  font-weight: $headings-font-weight;
  padding-left: $spacer; // defining consistent padding for links and buttons
  padding-right: $spacer;
  color: $secondary;

  &:hover {
    background-color: shift-color($dark, -84%);
    color: $dark;
  }

  &:focus {
    background-color: shift-color($light, 0%);
    box-shadow: inset 0 0 0 2px $primary;
    color: #161616;
    outline: 0;
  }

  &:active {
    background-color: $secondary;
    color: $white;
  }
}
.nav-nochild {
  color: $secondary !important;
  &:hover {
    background-color: shift-color($dark, -84%);
    color: $dark;
  }

  &:focus {
    background-color: $light;
    box-shadow: inset 0 0 0 2px $primary;
    color: $dark;
    outline: 0;
  }
  &:active {
    background-color: $secondary !important;
    color: $white !important;
  }
}

.nav-link--current {
  font-weight: $headings-font-weight;
  background-color: $secondary;
  color: $light;
  cursor: default;
  box-shadow: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background-color: $primary;
  }

  &:hover,
  &:focus {
    background-color: $secondary;
    color: $light;
  }
}
.nav-items--current {
  font-weight: $headings-font-weight;
  background-color: $secondary;
  color: $light;
  cursor: default;
  box-shadow: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background-color: $primary;
  }

  &:hover,
  &:focus {
    background-color: $secondary;
    color: $light;
  }
}

.nav-container {
  position: fixed;
  width: 300px;
  top: 48px;
  bottom: 0;
  left: 0;
  z-index: $zindex-fixed;
  overflow-y: auto;
  background-color: $light;
  transform: translateX(-300px);
  transition: transform cubic-bezier(0.2, 0, 1, 0.9) 240ms;
  border-right: 1px solid shift-color($light, 22.8%);

  @include media-breakpoint-down(lg) {
    z-index: $zindex-fixed + 2;
  }

  &.open {
    transform: translateX(0);
    transition-timing-function: cubic-bezier(0, 0, 0.38, 0.9);
  }

  @include media-breakpoint-up($responsive-layout-bp) {
    transition-duration: 70ms;
    transform: translateX(0);
  }
}

.nav-overlay {
  position: fixed;
  top: 48px;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: $zindex-fixed + 1;
  background-color: $black;
  opacity: 0.5;

  &.fade-enter-active {
    transition: opacity 240ms cubic-bezier(0, 0, 0.38, 0.9);
  }

  &.fade-leave-active {
    transition: opacity 110ms cubic-bezier(0.2, 0, 1, 0.9);
  }

  &.fade-enter-from, // This is vue3 based only class modified from 'fade-enter'
  &.fade-leave-to {
    opacity: 0;
  }

  @include media-breakpoint-up($responsive-layout-bp) {
    display: none;
  }
}
</style>
